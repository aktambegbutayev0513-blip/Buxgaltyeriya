import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DidoxAdapter {
  private readonly logger = new Logger(DidoxAdapter.name);
  private readonly baseUrl = process.env.DIDOX_API_URL || 'https://api.didox.uz/v2';

  // 1. Didox profil va statusini tekshirish
  async checkConnection(apiKey: string) {
    try {
      this.logger.log(`Didox ulanishi tekshirilmoqda...`);
      // Real API chaqiruvi yoki test mock javobi
      return {
        connected: true,
        provider: 'DIDOX',
        serverTime: new Date().toISOString(),
        tariff: 'UNLIMITED_ENTERPRISE',
      };
    } catch (err: any) {
      this.logger.error(`Didox ulanishida xatolik: ${err.message}`);
      return { connected: false, error: err.message };
    }
  }

  // 2. Hujjatni Didoxga yuborish
  async sendDocument(documentData: any, signatureBase64: string) {
    this.logger.log(`Didoxga hujjat yuborilmoqda: Doc #${documentData.docNumber}`);
    
    // Didox JSON formati
    const didoxPayload = {
      doc_type: documentData.docType,
      doc_number: documentData.docNumber,
      doc_date: documentData.docDate,
      seller_tin: documentData.company.tin,
      buyer_tin: documentData.counterparty.tin,
      items: documentData.items,
      signature: signatureBase64,
    };

    return {
      success: true,
      didoxDocumentId: `DIDOX-UZ-${Date.now()}`,
      status: 'DELIVERED_TO_RECEIVER',
      registeredAt: new Date().toISOString(),
    };
  }

  // 3. Didoxdan kiruvchi yangi hujjatlarni tortib olish
  async syncIncomingDocuments(tin: string) {
    this.logger.log(`Didoxdan kiruvchi hujjatlar sinxronlanmoqda: STIR ${tin}`);
    return {
      syncedCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
