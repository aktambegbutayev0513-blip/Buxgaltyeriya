/**
 * O'zbekiston Respublikasi Prezidenti huzuridagi Statistika Agentligi (Stat.uz)
 * va Yagona Davlat Korxona va Tashkilotlar Reestri (YeGRPO / USREO) integratsiyasi.
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
          status: data.status || 'ACTIVE',
          source: data.source || 'STAT.UZ (YeGRPO)',
        };
      }
    }
  } catch (e) {
    console.warn('Stat.uz qidiruvida xatolik:', e);
  }

  return {
    found: false,
    tin: cleanTin,
    name: '',
    directorName: '',
    address: '',
    source: 'MANUAL',
  };
}
