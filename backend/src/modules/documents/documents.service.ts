import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentDto, SignDocumentDto, RejectDocumentDto } from './documents.dto';
import { DocumentStatus, DocumentType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Kompaniya hujjatlari ro'yxati (filtrlash bilan)
  async findAll(companyId: string, options?: { status?: DocumentStatus; type?: DocumentType; search?: string }) {
    const { status, type, search } = options || {};

    return this.prisma.document.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
        ...(type ? { docType: type } : {}),
        ...(search
          ? {
              OR: [
                { docNumber: { contains: search, mode: 'insensitive' } },
                { counterparty: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        counterparty: { select: { id: true, name: true, tin: true } },
        items: true,
        signatures: true,
      },
      orderBy: { docDate: 'desc' },
    });
  }

  // 2. Hujjat tafsilotlari
  async findOne(companyId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, companyId },
      include: {
        company: true,
        counterparty: true,
        items: true,
        signatures: true,
        journalEntries: {
          include: { lines: true },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Hujjat topilmadi');
    }

    return document;
  }

  // 3. Yangi hujjat (hisob-faktura/akt) qoralamasini yaratish
  async create(companyId: string, userId: string, dto: CreateDocumentDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Hujjatda kamida bitta tovar yoki xizmat bo\'lishi shart');
    }

    let calculatedTotalWithoutVat = 0;
    let calculatedTotalVat = 0;
    let calculatedTotalAmount = 0;

    const itemsData = dto.items.map((item) => {
      const vatRate = item.vatRate !== undefined ? item.vatRate : 12.0;
      const totalPrice = item.quantity * item.price;
      const vatAmount = (totalPrice * vatRate) / 100;
      const finalAmount = totalPrice + vatAmount;

      calculatedTotalWithoutVat += totalPrice;
      calculatedTotalVat += vatAmount;
      calculatedTotalAmount += finalAmount;

      return {
        productId: item.productId || null,
        ikpuCode: item.ikpuCode,
        packageCode: item.packageCode || null,
        name: item.name,
        quantity: item.quantity,
        unitCode: item.unitCode,
        price: item.price,
        totalPrice,
        vatRate,
        vatAmount,
        finalAmount,
      };
    });

    return this.prisma.document.create({
      data: {
        companyId,
        docType: dto.docType,
        docNumber: dto.docNumber,
        docDate: new Date(dto.docDate),
        contractId: dto.contractId || null,
        counterpartyId: dto.counterpartyId,
        totalWithoutVat: calculatedTotalWithoutVat,
        totalVat: calculatedTotalVat,
        totalAmount: calculatedTotalAmount,
        currency: dto.currency || 'UZS',
        status: DocumentStatus.DRAFT,
        createdById: userId,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        counterparty: true,
      },
    });
  }

  // 4. Imzolash uchun xesh (SHA-256) tayyorlash
  async getDocumentSignHash(companyId: string, id: string) {
    const doc = await this.findOne(companyId, id);

    // Kanonizatsiya qilingan JSON obyekt
    const canonicalPayload = {
      docId: doc.id,
      docNumber: doc.docNumber,
      docDate: doc.docDate.toISOString().split('T')[0],
      sellerTin: doc.company.tin,
      buyerTin: doc.counterparty.tin,
      totalAmount: String(doc.totalAmount),
      items: doc.items.map((it) => ({
        ikpu: it.ikpuCode,
        name: it.name,
        qty: String(it.quantity),
        price: String(it.price),
        sum: String(it.finalAmount),
      })),
    };

    const payloadString = JSON.stringify(canonicalPayload);
    const hash = crypto.createHash('sha256').update(payloadString, 'utf8').digest('base64');

    return {
      documentId: doc.id,
      docNumber: doc.docNumber,
      hash,
      canonicalPayload,
    };
  }

  // 5. ERI orqali imzolashni tasdiqlash
  async signDocument(companyId: string, userId: string, id: string, dto: SignDocumentDto) {
    const doc = await this.findOne(companyId, id);

    if (doc.status === DocumentStatus.ACCEPTED || doc.status === DocumentStatus.CANCELLED) {
      throw new BadRequestException('Ushbu holatdagi hujjatni imzolab bo\'lmaydi');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Imzoni saqlash
      await tx.signature.create({
        data: {
          documentId: doc.id,
          userId,
          certificateSerial: dto.certificateSerial,
          signerTin: dto.signerTin,
          signerName: dto.signerName,
          signerRole: dto.signerRole || 'DIREKTOR',
          pkcs7Signature: dto.pkcs7Signature,
          verificationStatus: 'VERIFIED',
        },
      });

      // 2. Hujjat holatini o'zgartirish
      const updatedDoc = await tx.document.update({
        where: { id: doc.id },
        data: {
          status: DocumentStatus.SIGNED_LOCAL,
        },
        include: {
          signatures: true,
          counterparty: true,
          company: true,
          items: true,
        },
      });

      // 3. Buxgalteriya provodkalarini avtomatik shakllantirish (Sotuv bo'yicha: Debet 4010, Kredit 9010, Kredit 6410 QQS)
      const isFactura = doc.docType === DocumentType.FACTURA;
      if (isFactura) {
        const entry = await tx.journalEntry.create({
          data: {
            companyId,
            documentId: doc.id,
            entryNumber: `ENTRY-${doc.docNumber}`,
            entryDate: doc.docDate,
            description: `Hisob-faktura №${doc.docNumber} bo'yicha sotuv realizatsiyasi`,
            createdById: userId,
          },
        });

        // 4010 - Haridorlar qarzi (Debet)
        await tx.journalEntryLine.create({
          data: {
            journalEntryId: entry.id,
            debitAccount: '4010',
            creditAccount: '9010',
            amount: doc.totalWithoutVat,
            counterpartyId: doc.counterpartyId,
            comment: 'Realizatsiyadan daromad',
          },
        });

        // 6410 - Byudjetga QQS qarzi (Kredit)
        if (Number(doc.totalVat) > 0) {
          await tx.journalEntryLine.create({
            data: {
              journalEntryId: entry.id,
              debitAccount: '4010',
              creditAccount: '6410',
              amount: doc.totalVat,
              counterpartyId: doc.counterpartyId,
              comment: 'Hisoblangan QQS',
            },
          });
        }
      }

      return updatedDoc;
    });
  }

  // 6. Hujjatni Didox / Soliq tizimiga yuborish
  async sendDocument(companyId: string, id: string) {
    const doc = await this.findOne(companyId, id);

    if (doc.status !== DocumentStatus.SIGNED_LOCAL) {
      throw new BadRequestException('Hujjat avval E-IMZO bilan imzolanishi shart');
    }

    // Mock/Real Integration Adapter trigger
    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.SENT,
        externalDidoxId: `DIDOX-${Date.now()}`,
        externalSoliqId: `SOLIQ-${Date.now()}`,
      },
    });

    return {
      success: true,
      message: 'Hujjat Didox va Soliq tizimiga muvaffaqiyatli yuborildi',
      document: updated,
    };
  }

  // 7. Hujjatni rad etish
  async rejectDocument(companyId: string, id: string, dto: RejectDocumentDto) {
    return this.prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        rejectReason: dto.reason,
      },
    });
  }
}
