/**
 * O'zbekiston Davlat Soliq Qo'mitasi & Davlat Reestri STIR qidiruv xizmati
 * Faqat haqiqiy ma'lumotlar bilan ishlaydi, soxta ma'lumotlar olib tashlangan.
 */

export interface CompanyRegistryInfo {
  found: boolean;
  tin: string;
  name: string;
  shortName?: string;
  directorName?: string;
  address?: string;
  oked?: string;
  okedName?: string;
  vatStatus?: string;
  status?: string;
  source?: string;
}

export async function lookupCompanyByTin(tin: string): Promise<CompanyRegistryInfo> {
  const cleanTin = tin.replace(/\D/g, '').slice(0, 9);
  if (cleanTin.length !== 9) {
    throw new Error('STIR 9 xonali son bo\'lishi shart');
  }

  try {
    const res = await fetch(`/api/v1/company-lookup?tin=${cleanTin}`);
    if (res.ok) {
      const data = await res.json();
      if (data.found) {
        return {
          found: true,
          tin: cleanTin,
          name: data.name || '',
          shortName: data.shortName || '',
          directorName: data.directorName || '',
          address: data.address || '',
          oked: data.oked || '',
          okedName: data.okedName || '',
          vatStatus: data.vatStatus || 'ACTIVE_VAT',
          status: data.status || 'ACTIVE',
          source: 'DAVLAT_REESTRI',
        };
      }
    }
  } catch (e) {
    console.warn('Online STIR qidiruvida xatolik:', e);
  }

  // Agar online reestrdan topilmasa, soxta ma'lumot bermaymiz
  return {
    found: false,
    tin: cleanTin,
    name: '',
    directorName: '',
    address: '',
    source: 'MANUAL',
  };
}
