/**
 * E-IMZO Local Service Client Wrapper (Browser Side)
 * Aloqa: http://127.0.0.1:64443
 * Xavfsizlik: Private Key va parollar faqat lokal xizmatda ishlanadi, serverga yuborilmaydi.
 */

export interface EImzoCert {
  serialNumber: string;
  tin: string;
  pinfl?: string;
  name: string;
  companyName?: string;
  validFrom: string;
  validTo: string;
  keyId: string;
}

export class EImzoClient {
  private static LOCAL_PORT = 64443;
  private static BASE_URL = `http://127.0.0.1:${EImzoClient.LOCAL_PORT}`;

  // 1. E-IMZO moduli o'rnatilgan va ishlab turganini tekshirish
  static async checkStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const res = await fetch(`${this.BASE_URL}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return { available: true, message: 'E-IMZO moduli faol' };
      }
      return { available: false, message: 'E-IMZO moduli javob bermadi' };
    } catch (e) {
      // Brauzerda E-IMZO o'rnatilmagan yoki dastur yoqilmagan bo'lsa fallback
      return {
        available: false,
        message: 'E-IMZO dasturi kompyuterda ishga tushirilmagan (http://127.0.0.1:64443)',
      };
    }
  }

  // 2. Kompyuterdagi (USB token, fleshka, disk) sertifikatlar ro'yxatini olish
  static async listAllCertificates(): Promise<EImzoCert[]> {
    try {
      const res = await fetch(`${this.BASE_URL}/certificates`, {
        method: 'GET',
      });
      if (!res.ok) {
        throw new Error('E-IMZO moduli sertifikatlarni taqdim etmadi');
      }
      const data = await res.json();
      if (data && Array.isArray(data.certificates)) {
        return data.certificates;
      }
      return [];
    } catch (e: any) {
      console.warn('E-IMZO moduli ulanmagan:', e.message);
      return [];
    }
  }

  // 3. Xeshni PKCS#7 formatida imzolash (Detached)
  static async signHash(hashBase64: string, keyId: string): Promise<string> {
    const res = await fetch(`${this.BASE_URL}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyId,
        data: hashBase64,
        isDetached: true,
      }),
    });
    
    if (!res.ok) {
      throw new Error('E-IMZO xizmati imzolashni bajara olmadi');
    }

    const data = await res.json();
    if (data?.success && data.pkcs7_64) {
      return data.pkcs7_64;
    }
    throw new Error(data?.message || 'E-IMZO imzolashda xatolik yuz berdi');
  }
}
