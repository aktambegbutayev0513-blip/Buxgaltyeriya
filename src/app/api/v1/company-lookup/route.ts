import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tin = searchParams.get('tin')?.replace(/\D/g, '') || '';

  if (tin.length !== 9) {
    return NextResponse.json({ error: 'STIR 9 xonali son bo\'lishi kerak' }, { status: 400 });
  }

  try {
    // 1. O'zbekiston ochiq davlat va soliq reestrlari orqali so'rov yuborish
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    // Orginfo / OpenInfo / Soliq ochiq API orqali qidiruv
    const response = await fetch(`https://orginfo.uz/api/organization/details/?tin=${tin}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);

    if (response && response.ok) {
      const data = await response.json();
      if (data && (data.full_name || data.name || data.short_name)) {
        return NextResponse.json({
          found: true,
          tin,
          name: data.full_name || data.name || data.short_name,
          shortName: data.short_name || data.name,
          directorName: data.head_name || data.director || data.leader || '',
          address: data.legal_address || data.address || '',
          status: data.status || 'ACTIVE',
          oked: data.oked || '',
          okedName: data.activity_type || '',
          source: 'ORGINFO_REESTR',
        });
      }
    }
  } catch (e) {
    // Online lookup timeout/error
  }

  // Agar online API dan topilmasa, HECH QANDAY SOXTA MA'LUMOT YOZILMAYDI!
  return NextResponse.json({
    found: false,
    tin,
    message: 'Davlat reestridan topilmadi yoki to\'g\'ridan-to\'g\'ri kiritish mumkin',
  });
}
