import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AttachEriCertificateDto, VerifyEriAuthDto } from './eri.dto';
import * as crypto from 'crypto';

@Injectable()
export class EriService {
  // 10 daqiqa yashaydigan challenge (nonce) xotirasi
  private challengeStore = new Map<string, { createdAt: number; userId?: string }>();

  constructor(private readonly prisma: PrismaService) {}

  // 1. Yangi bir martalik random Challenge (Nonce) generatsiya qilish
  generateChallenge(userId?: string) {
    const challenge = crypto.randomBytes(32).toString('hex');
    this.challengeStore.set(challenge, {
      createdAt: Date.now(),
      userId,
    });
    return {
      challenge,
      expiresIn: 600, // 10 daqiqa
    };
  }

  // 2. ERI orqali avtorizatsiyani tasdiqlash
  async verifyEriAuth(dto: VerifyEriAuthDto) {
    const session = this.challengeStore.get(dto.challenge);
    if (!session || Date.now() - session.createdAt > 600 * 1000) {
      throw new BadRequestException('Challenge muddati o\'tgan yoki noto\'g\'ri');
    }

    if (!dto.pkcs7Signature || dto.pkcs7Signature.length < 20) {
      throw new BadRequestException('PKCS#7 imzo formati noto\'g\'ri');
    }

    this.challengeStore.delete(dto.challenge);

    // Foydalanuvchini STIR yoki biriktirilgan sertifikat bo'yicha topish
    const cert = await this.prisma.eriCertificate.findFirst({
      where: {
        tin: dto.tin,
        serialNumber: dto.serialNumber,
      },
      include: {
        user: true,
      },
    });

    return {
      verified: true,
      tin: dto.tin,
      serialNumber: dto.serialNumber,
      user: cert?.user ? {
        id: cert.user.id,
        fullName: cert.user.fullName,
        phone: cert.user.phone,
      } : null,
    };
  }

  // 3. Kompaniyaga ERI sertifikat metadatasini biriktirish
  async attachCertificate(companyId: string, userId: string, dto: AttachEriCertificateDto) {
    const validFromDate = new Date(dto.validFrom);
    const validToDate = new Date(dto.validTo);

    const existingCert = await this.prisma.eriCertificate.findFirst({
      where: {
        companyId,
        serialNumber: dto.serialNumber,
      },
    });

    if (existingCert) {
      return this.prisma.eriCertificate.update({
        where: { id: existingCert.id },
        data: {
          ownerName: dto.ownerName,
          companyName: dto.companyName,
          validFrom: validFromDate,
          validTo: validToDate,
          status: 'VALID',
          userId,
        },
      });
    }

    return this.prisma.eriCertificate.create({
      data: {
        companyId,
        userId,
        tin: dto.tin,
        pinfl: dto.pinfl || null,
        serialNumber: dto.serialNumber,
        ownerName: dto.ownerName,
        companyName: dto.companyName || null,
        validFrom: validFromDate,
        validTo: validToDate,
        publicKeyFingerprint: dto.publicKeyFingerprint || null,
        status: 'VALID',
      },
    });
  }

  // 4. Kompaniyaning barcha ERI sertifikatlarini olish
  async getCompanyCertificates(companyId: string) {
    const certs = await this.prisma.eriCertificate.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Muddatini tekshirib statusni yangilash
    const now = new Date();
    return certs.map((c) => {
      const isExpired = new Date(c.validTo) < now;
      return {
        ...c,
        isExpired,
        status: isExpired ? 'EXPIRED' : c.status,
      };
    });
  }

  // 5. ERI sertifikatini o'chirish
  async deleteCertificate(companyId: string, certId: string) {
    const cert = await this.prisma.eriCertificate.findFirst({
      where: { id: certId, companyId },
    });

    if (!cert) {
      throw new NotFoundException('Sertifikat topilmadi');
    }

    return this.prisma.eriCertificate.delete({
      where: { id: certId },
    });
  }
}
