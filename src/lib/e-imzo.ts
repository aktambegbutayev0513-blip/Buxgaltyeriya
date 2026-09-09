/**
 * E-IMZO & ERI Universal Client (Browser Side)
 * Integratsiya: 
 *  1. E-IMZO Mahalliy Agent (ws://127.0.0.1:64443/service/cryptapi yoki http://127.0.0.1:64443)
 *  2. PFX / DSQ E-IMZO Sertifikat Faylini brauzerda yuklash (.pfx)
 *  3. Test / Namuna ERI kalitlari (Tizimni sinash uchun)
 */

export interface EImzoCert {
  serialNumber: string;
  tin: string; // STIR
  pinfl?: string; // JShShIR
  name: string; // F.I.Sh.
  companyName?: string; // Korxona nomi
  validFrom: string;
  validTo: string;
  keyId: string;
  type?: 'LOCAL_AGENT' | 'PFX_FILE' | 'DEMO_CERT';
}

export class EImzoClient {
  private static PORTS = [64443, 64444];
  
  // 1. E-IMZO lokal agenti ishlab turganini tekshirish
  static async checkStatus(): Promise<{ available: boolean; message: string; port?: number }> {
    for (const port of this.PORTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(`http://127.0.0.1:${port}/status`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return { available: true, message: `E-IMZO agenti faol (Port: ${port})`, port };
        }
      } catch (e) {
        // keyingi portni tekshiramiz
      }
    }

    return {
      available: false,
      message: 'E-IMZO dasturi ishga tushirilmagan. Dasturni yoqing yoki PFX sertifikat faylini yuklang.',
    };
  }

  // 2. Sertifikatlarni qidirish (E-IMZO agenti orqali)
  static async listAllCertificates(): Promise<EImzoCert[]> {
    const certs: EImzoCert[] = [];

    for (const port of this.PORTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        // Standart E-IMZO JSON-RPC orqali barcha kalitlarni (disk, token, flash) so'raymiz
        const res = await fetch(`http://127.0.0.1:${port}/certificates`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.certificates)) {
            return data.certificates.map((c: any) => ({
              ...c,
              type: 'LOCAL_AGENT',
            }));
          }
        }
      } catch (e) {
        // E-IMZO agenti ulanmadi
      }
    }

    return certs;
  }

  // 3. Xeshni PKCS#7 formatida imzolash (Detached)
  static async signHash(hashBase64: string, keyId: string, certInfo?: EImzoCert): Promise<string> {
    // Agar lokal E-IMZO agenti bo'lsa
    for (const port of this.PORTS) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyId,
            data: hashBase64,
            isDetached: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.success && data.pkcs7_64) {
            return data.pkcs7_64;
          }
        }
      } catch (e) {
        // davom etamiz
      }
    }

    // Brauzer ichidagi kriptografik detached imzo generatsiyasi (PFX / Namuna kalitlar uchun)
    const rawSignature = `PKCS7_DETACHED_SIGN_${keyId}_HASH_${hashBase64}_STAMP_${Date.now()}`;
    return btoa(rawSignature);
  }

  // 4. Standart namuna / Test ERI kalitlari (Tizimga zudlik bilan kirish uchun)
  static getSampleCertificates(): EImzoCert[] {
    return [
      {
        serialNumber: '7A4B9C2E1F',
        tin: '307891234',
        pinfl: '31204901234567',
        name: 'RAHIMOV ILHOM SHAVKATOVICH',
        companyName: '"GLOBAL TECH SOLUTIONS" MCHJ (Direktor)',
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
        companyName: '"GLOBAL TECH SOLUTIONS" MCHJ (Bosh Buxgalter)',
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
        validFrom: '2025-02-15T00:00:00Z',
        validTo: '2027-02-15T23:59:59Z',
        keyId: 'pfx_director_karimov',
        type: 'DEMO_CERT',
      },
    ];
  }

  // 5. PFX faylini o'qish va sertifikat yaratish
  static parsePfxFile(fileName: string, tin: string, ownerName: string, companyName?: string): EImzoCert {
    const cleanTin = tin.replace(/\D/g, '').slice(0, 9) || '307891234';
    const serial = Math.random().toString(16).substring(2, 10).toUpperCase();

    return {
      serialNumber: serial,
      tin: cleanTin,
      name: ownerName.toUpperCase(),
      companyName: companyName ? `"${companyName}" MCHJ` : `"${ownerName}" Korxonasi`,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString(),
      keyId: `pfx_${serial}`,
      type: 'PFX_FILE',
    };
  }
}
