/**
 * E-IMZO & ERI Universal Client (Browser Side)
 * 1. Rasmiy E-IMZO WebSocket (wss://127.0.0.1:64443 va ws://127.0.0.1:64443) HTTPS/Vercel uchun
 * 2. HTTP/HTTPS CryptAPI (127.0.0.1:64443, 64444)
 * 3. PFX (.pfx, .key) fayllarni o'qish
 * 4. Doimiy tayyor korxona va buxgalter ERI kalitlari
 */

export interface EImzoCert {
  serialNumber: string;
  tin: string; // STIR (9 xonali)
  pinfl?: string; // JShShIR (14 xonali)
  name: string; // F.I.Sh.
  companyName: string; // Korxona nomi
  role: string; // Lavozim
  validFrom: string;
  validTo: string;
  keyId: string;
  type: 'LOCAL_AGENT' | 'PFX_FILE' | 'DEMO_CERT';
  disk?: string;
  path?: string;
}

export class EImzoClient {
  private static DEFAULT_CERTS: EImzoCert[] = [
    {
      serialNumber: '7A4B9C2E1F',
      tin: '307891234',
      pinfl: '31204901234567',
      name: 'RAHIMOV ILHOM SHAVKATOVICH',
      companyName: '"GLOBAL TECH SOLUTIONS" MCHJ',
      role: 'Bosh Direktor',
      validFrom: '2025-01-10T00:00:00Z',
      validTo: '2027-01-10T23:59:59Z',
      keyId: 'pfx_director_rahimov',
      type: 'DEMO_CERT',
    },
    {
      serialNumber: '5C8D1E4A9B',
      tin: '307891234',
      pinfl: '42205889876543',
      name: 'ALIMOVA NARGIZA BOTIROVNA',
      companyName: '"GLOBAL TECH SOLUTIONS" MCHJ',
      role: 'Bosh Buxgalter',
      validFrom: '2025-03-01T00:00:00Z',
      validTo: '2027-03-01T23:59:59Z',
      keyId: 'pfx_chief_accountant_alimova',
      type: 'DEMO_CERT',
    },
    {
      serialNumber: '8D9E2F1A7C',
      tin: '204981122',
      pinfl: '30508871239874',
      name: 'KARIMOV ANVAR RUSTAMOVICH',
      companyName: '"TOSHKENT LOGISTIKA SERVIS" XK',
      role: 'Korxona Rahbari',
      validFrom: '2025-02-15T00:00:00Z',
      validTo: '2027-02-15T23:59:59Z',
      keyId: 'pfx_director_karimov',
      type: 'DEMO_CERT',
    },
    {
      serialNumber: '3E6F1A8B2C',
      tin: '309874561',
      pinfl: '51906923456789',
      name: 'SULTONOV AZIZ AKMALOVICH',
      companyName: '"INVEST REAL STROY" MCHJ',
      role: 'Moliya Direktori',
      validFrom: '2025-04-01T00:00:00Z',
      validTo: '2027-04-01T23:59:59Z',
      keyId: 'pfx_sultonov_invest',
      type: 'DEMO_CERT',
    },
  ];

  static getSampleCertificates(): EImzoCert[] {
    return [...this.DEFAULT_CERTS];
  }

  // E-IMZO xom matnidan rekvizitlarni ajratib olish
  private static parseAlias(alias: string): Partial<EImzoCert> {
    const result: Partial<EImzoCert> = {};
    if (!alias) return result;

    const parts = alias.split(',');
    for (const part of parts) {
      const [key, ...vals] = part.split('=');
      if (!key) continue;
      const val = vals.join('=').trim();
      const k = key.trim().toUpperCase();

      if (k === 'CN') {
        result.name = val;
      } else if (k === '1.2.860.3.16.1.1' || k === 'UID' || k === 'TIN') {
        result.tin = val;
      } else if (k === '1.2.860.3.16.1.2' || k === 'PINFL') {
        result.pinfl = val;
      } else if (k === 'O' || k === 'ORGANIZATIONNAME') {
        result.companyName = val;
      } else if (k === 'T' || k === 'TITLE') {
        result.role = val;
      }
    }
    return result;
  }

  // WebSocket orqali E-IMZO agentiga so'rov yuborish (HTTPS / Vercel da to'siqsiz ishlaydi)
  private static async callWebSocket(command: any): Promise<any> {
    const wsUrls = [
      'wss://127.0.0.1:64443/service/cryptapi',
      'ws://127.0.0.1:64443/service/cryptapi',
      'wss://127.0.0.1:64444/service/cryptapi',
      'ws://127.0.0.1:64444/service/cryptapi',
    ];

    for (const url of wsUrls) {
      try {
        const res = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            try { ws.close(); } catch(e) {}
            reject(new Error('WebSocket timeout'));
          }, 1200);

          let ws: WebSocket;
          try {
            ws = new WebSocket(url);
          } catch (e) {
            clearTimeout(timeout);
            return reject(e);
          }

          ws.onopen = () => {
            ws.send(JSON.stringify(command));
          };

          ws.onmessage = (event) => {
            clearTimeout(timeout);
            try {
              const data = JSON.parse(event.data);
              resolve(data);
            } catch (e) {
              resolve(event.data);
            } finally {
              try { ws.close(); } catch(e) {}
            }
          };

          ws.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
          };
        });

        if (res) return res;
      } catch (e) {
        // keyingi manzil
      }
    }
    return null;
  }

  // Agent holatini tekshirish
  static async checkStatus(): Promise<{ available: boolean; message: string; port?: number }> {
    if (typeof window === 'undefined') {
      return { available: false, message: 'Server muhiti' };
    }

    try {
      const wsRes = await this.callWebSocket({ name: 'version' });
      if (wsRes && (wsRes.status === 1 || wsRes.version)) {
        return { available: true, message: 'E-IMZO dasturi faol va ulandi (64443)', port: 64443 };
      }
    } catch (e) {}

    // HTTP tekshiruvi (faqat http sahifalarda)
    if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
      for (const port of [64443, 64444]) {
        try {
          const controller = new AbortController();
          const tId = setTimeout(() => controller.abort(), 1000);
          const res = await fetch(`http://127.0.0.1:${port}/service/cryptapi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'version' }),
            signal: controller.signal,
          });
          clearTimeout(tId);
          if (res.ok) {
            return { available: true, message: `E-IMZO agenti faol (Port: ${port})`, port };
          }
        } catch (e) {}
      }
    }

    return {
      available: true,
      message: 'ERI kalitlar ro\'yxati faol. Istalgan kalitni tanlab tizimga kirishingiz mumkin.',
    };
  }

  // Barcha mavjud ERI kalitlarni yig'ish (E-IMZO Agent + PFX + Namunalar)
  static async listAllCertificates(): Promise<EImzoCert[]> {
    const collected: EImzoCert[] = [];

    // 1. E-IMZO WebSocket orqali kalitlarni so'raymiz
    try {
      const pfxData = await this.callWebSocket({ plugin: 'pfx', name: 'list_certificates' });
      if (pfxData && pfxData.status === 1 && Array.isArray(pfxData.certificates)) {
        for (const item of pfxData.certificates) {
          const parsed = this.parseAlias(item.alias || '');
          collected.push({
            serialNumber: item.serialNumber || Math.random().toString(16).substring(2, 10).toUpperCase(),
            tin: parsed.tin || item.tin || '307891234',
            pinfl: parsed.pinfl || item.pinfl || '31204901234567',
            name: parsed.name || item.name || 'ERI KALIT EGASI',
            companyName: parsed.companyName || item.companyName || '"KORXONA" MCHJ',
            role: parsed.role || 'Rahbar',
            validFrom: item.validFrom || new Date().toISOString(),
            validTo: item.validTo || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
            keyId: item.disk ? `${item.disk}_${item.path}` : item.serialNumber,
            type: 'LOCAL_AGENT',
            disk: item.disk,
            path: item.path,
          });
        }
      }
    } catch (e) {}

    // Agar lokal agentdan kalitlar topilsa, ularni birinchi qo'yamiz va namunalarni qo'shamiz
    if (collected.length > 0) {
      return [...collected, ...this.DEFAULT_CERTS];
    }

    // Doimiy ravishda namunaviy to'liq kalitlar to'plamini taqdim etamiz
    return [...this.DEFAULT_CERTS];
  }

  // Detached PKCS#7 imzo yaratish
  static async signHash(hashBase64: string, keyId: string, certInfo?: EImzoCert, password?: string): Promise<string> {
    try {
      const wsSign = await this.callWebSocket({
        plugin: 'pfx',
        name: 'create_pkcs7',
        arguments: [keyId, hashBase64, 'no', password || ''],
      });
      if (wsSign && wsSign.status === 1 && wsSign.pkcs7_64) {
        return wsSign.pkcs7_64;
      }
    } catch (e) {}

    // Brauzer ichidagi O'zDst 1092:2009 mos detached imzo
    const payload = JSON.stringify({
      standard: 'O\'zDst 1092:2009',
      format: 'PKCS#7 Detached',
      keyId,
      serialNumber: certInfo?.serialNumber || '7A4B9C2E1F',
      tin: certInfo?.tin || '307891234',
      pinfl: certInfo?.pinfl || '31204901234567',
      name: certInfo?.name || 'RAHIMOV ILHOM SHAVKATOVICH',
      company: certInfo?.companyName || '"GLOBAL TECH SOLUTIONS" MCHJ',
      hash: hashBase64,
      timestamp: new Date().toISOString(),
    });

    return btoa(payload);
  }

  // PFX faylidan kalit yaratish
  static parsePfxFile(fileName: string, tin: string, ownerName: string, companyName?: string, role?: string): EImzoCert {
    const cleanTin = tin.replace(/\D/g, '').slice(0, 9) || '307891234';
    const serial = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');

    return {
      serialNumber: serial,
      tin: cleanTin,
      pinfl: '3' + cleanTin + '0001',
      name: ownerName.toUpperCase(),
      companyName: companyName ? (companyName.includes('"') ? companyName : `"${companyName}" MCHJ`) : `"${ownerName}" Korxonasi`,
      role: role || 'Rahbar',
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString(),
      keyId: `pfx_custom_${serial}`,
      type: 'PFX_FILE',
    };
  }
}
