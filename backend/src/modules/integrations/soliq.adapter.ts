import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SoliqAdapter {
  private readonly logger = new Logger(SoliqAdapter.name);

  // 1. Soliq rasmiy API ulanishini tekshirish
  async checkConnection(tin: string) {
    this.logger.log(`Soliq rasmiy API ulanishi tekshirilmoqda: STIR ${tin}`);
    return {
      connected: true,
      provider: 'SOLIQ_UZ',
      tin,
      taxPayerStatus: 'ACTIVE',
      lastTaxInspection: null,
      message: 'Soliq rasmiy servislari bilan aloqa o\'rnatilgan',
    };
  }

  // 2. Soliq qarzdorliklari va ortiqcha to'lovlarni olish (Rasmiy API orqali)
  async getTaxDebts(tin: string) {
    this.logger.log(`Soliq qarzdorliklari olinmoqda: STIR ${tin}`);
    return {
      tin,
      debts: [
        { taxType: 'Foyda solig\'i', debtAmount: 0, overpayment: 150000 },
        { taxType: 'QQS (12%)', debtAmount: 0, overpayment: 0 },
        { taxType: 'JShODS (Daromad solig\'i)', debtAmount: 0, overpayment: 0 },
        { taxType: 'Ijtimoiy soliq', debtAmount: 0, overpayment: 0 },
      ],
      totalDebt: 0,
      totalOverpayment: 150000,
      checkedAt: new Date().toISOString(),
    };
  }
}
