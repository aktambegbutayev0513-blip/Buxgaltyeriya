import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateJournalEntryDto } from './accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. O'zbekiston BHMS standart hisoblar rejasini avtomatik seed qilish
  async seedStandardChartOfAccounts() {
    const defaultAccounts = [
      { code: '5010', name: 'Milliy valyutadagi pul mablag\'lari (Kassa)', type: 'ASSET' },
      { code: '5110', name: 'Hisob-kitob schoti (Bank)', type: 'ASSET' },
      { code: '5210', name: 'Valyuta schotlari', type: 'ASSET' },
      { code: '4010', name: 'Xaridorlar va buyurtmachilardan olinadigan schotlar (Debitorlar)', type: 'ASSET' },
      { code: '4310', name: 'Berilgan bo\'naklar (Avans)', type: 'ASSET' },
      { code: '1010', name: 'Xom-ashyo va materiallar', type: 'ASSET' },
      { code: '2810', name: 'Tayyor mahsulotlar', type: 'ASSET' },
      { code: '2910', name: 'Tovarlar', type: 'ASSET' },
      { code: '0110', name: 'Asosiy vositalar (Bino va inshootlar)', type: 'ASSET' },
      { code: '6010', name: 'Mollarni yetkazib beruvchilarga to\'lanadigan schotlar (Kreditorlar)', type: 'LIABILITY' },
      { code: '6310', name: 'Olingan bo\'naklar (Avans)', type: 'LIABILITY' },
      { code: '6410', name: 'Byudjetga to\'lovlar bo\'yicha qarzlar (QQS va soliqlar)', type: 'LIABILITY' },
      { code: '6710', name: 'Mehnat haqi bo\'yicha xodimlar bilan hisoblashishlar', type: 'LIABILITY' },
      { code: '8330', name: 'Ustav kapitali', type: 'EQUITY' },
      { code: '9010', name: 'Tayyor mahsulotlarni sotishdan daromadlar', type: 'REVENUE' },
      { code: '9020', name: 'Tovarlarni sotishdan daromadlar', type: 'REVENUE' },
      { code: '9030', name: 'Ishlar bajarish va xizmatlar ko\'rsatishdan daromadlar', type: 'REVENUE' },
      { code: '9110', name: 'Sotilgan tayyor mahsulotlarning tannarxi', type: 'EXPENSE' },
      { code: '9410', name: 'Sotish xarajatlari', type: 'EXPENSE' },
      { code: '9420', name: 'Ma\'muriy xarajatlar', type: 'EXPENSE' },
      { code: '9430', name: 'Boshqa operatsion xarajatlar', type: 'EXPENSE' },
    ];

    for (const acc of defaultAccounts) {
      await this.prisma.chartOfAccount.upsert({
        where: { code: acc.code },
        update: {},
        create: acc,
      });
    }

    return { message: 'Hisoblar rejasi muvaffaqiyatli yuklandi' };
  }

  // 2. Hisoblar rejasini olish
  async getChartOfAccounts() {
    await this.seedStandardChartOfAccounts();
    return this.prisma.chartOfAccount.findMany({
      orderBy: { code: 'asc' },
    });
  }

  // 3. Provodkalar jurnali
  async getJournal(companyId: string, startDate?: string, endDate?: string) {
    return this.prisma.journalEntry.findMany({
      where: {
        companyId,
        ...(startDate && endDate
          ? {
              entryDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      include: {
        lines: {
          include: {
            counterparty: { select: { name: true, tin: true } },
            product: { select: { name: true, ikpuCode: true } },
          },
        },
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  // 4. Qo'lda provodka yaratish
  async createJournalEntry(companyId: string, userId: string, dto: CreateJournalEntryDto) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Provodka kamida bitta qatordan iborat bo\'lishi kerak');
    }

    return this.prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber: dto.entryNumber,
        entryDate: new Date(dto.entryDate),
        description: dto.description || null,
        createdById: userId,
        lines: {
          create: dto.lines.map((l) => ({
            debitAccount: l.debitAccount,
            creditAccount: l.creditAccount,
            amount: l.amount,
            currency: l.currency || 'UZS',
            counterpartyId: l.counterpartyId || null,
            productId: l.productId || null,
            comment: l.comment || null,
          })),
        },
      },
      include: {
        lines: true,
      },
    });
  }

  // 5. Aylanma-qoldiq vedomosti (Оборотно-сальдовая ведомость - OSV)
  async getTurnoverBalanceSheet(companyId: string, startDate?: string, endDate?: string) {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          companyId,
          ...(startDate && endDate
            ? {
                entryDate: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }
            : {}),
        },
      },
    });

    const accountsMap: Record<string, { debitTurnover: number; creditTurnover: number }> = {};

    for (const line of lines) {
      const amount = Number(line.amount);
      if (!accountsMap[line.debitAccount]) {
        accountsMap[line.debitAccount] = { debitTurnover: 0, creditTurnover: 0 };
      }
      accountsMap[line.debitAccount].debitTurnover += amount;

      if (!accountsMap[line.creditAccount]) {
        accountsMap[line.creditAccount] = { debitTurnover: 0, creditTurnover: 0 };
      }
      accountsMap[line.creditAccount].creditTurnover += amount;
    }

    const allAccounts = await this.prisma.chartOfAccount.findMany();
    const result = allAccounts
      .filter((acc) => accountsMap[acc.code])
      .map((acc) => {
        const stats = accountsMap[acc.code];
        const balance = stats.debitTurnover - stats.creditTurnover;
        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          debitTurnover: stats.debitTurnover,
          creditTurnover: stats.creditTurnover,
          closingDebit: balance > 0 ? balance : 0,
          closingCredit: balance < 0 ? Math.abs(balance) : 0,
        };
      });

    return result;
  }

  // 6. Kompaniya boshqaruv statistikasi (Dashboard KPI)
  async getCompanyDashboardSummary(companyId: string) {
    const [docsCount, counterpartiesCount, productsCount] = await Promise.all([
      this.prisma.document.count({ where: { companyId } }),
      this.prisma.counterparty.count({ where: { companyId } }),
      this.prisma.product.count({ where: { companyId } }),
    ]);

    const turnoverData = await this.getTurnoverBalanceSheet(companyId);
    const bankBalance = turnoverData.find((a) => a.code === '5110')?.closingDebit || 0;
    const receivables = turnoverData.find((a) => a.code === '4010')?.closingDebit || 0;
    const payables = turnoverData.find((a) => a.code === '6010')?.closingCredit || 0;
    const revenues = turnoverData
      .filter((a) => a.code.startsWith('90'))
      .reduce((sum, a) => sum + a.creditTurnover, 0);

    return {
      documentsCount: docsCount,
      counterpartiesCount,
      productsCount,
      bankBalance,
      receivables, // Debitorlik
      payables, // Kreditorlik
      totalRevenue: revenues, // Daromad
    };
  }
}
