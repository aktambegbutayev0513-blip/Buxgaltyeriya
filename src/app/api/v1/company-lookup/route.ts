import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tin = searchParams.get('tin')?.replace(/\D/g, '') || '';

  if (tin.length !== 9) {
    return NextResponse.json({ error: 'STIR 9 xonali son bo\'lishi kerak' }, { status: 400 });
  }

  // 1. STAT.UZ (Statistika Agentligi - YeGRPO) va rasmiy ochiq reestrlar orqali so'rov yuborish
  const endpoints = [
    // Stat.uz va Ochiq Reestr API manbalari
    `https://orginfo.uz/api/organization/details/?tin=${tin}`,
    `https://stat.uz/api/v1/usreo?tin=${tin}`,
    `https://openinfo.uz/api/v1/organizations/${tin}`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 StatUzFetcher',
        },
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeout);

      if (response && response.ok) {
        const data = await response.json();
        
        // Ma'lumotlarni tahlil qilish
        const fullName = data.full_name || data.name || data.organization_name || data.short_name;
        const headName = data.head_name || data.director || data.director_name || data.leader || '';
        const address = data.legal_address || data.address || data.region_address || '';
        const oked = data.oked || data.ifut || '';
        const okedName = data.activity_type || data.oked_name || '';
        const status = data.status || 'ACTIVE';

        if (fullName) {
          return NextResponse.json({
            found: true,
            tin,
            name: fullName,
            shortName: data.short_name || fullName,
            directorName: headName,
            address: address,
            oked: oked,
            okedName: okedName,
            status: status === 'ACTIVE' || status === '1' ? 'ACTIVE' : status,
            source: 'STAT.UZ (Statistika Agentligi - YeGRPO)',
          });
        }
      }
    } catch (err) {
      // Keyingi manbaga o'tish
    }
  }

  return NextResponse.json({
    found: false,
    tin,
    message: 'Stat.uz reestridan avtomat topilmadi. Korxona nomini to\'g\'ridan-to\'g\'ri kiritishingiz mumkin.',
  });
}
