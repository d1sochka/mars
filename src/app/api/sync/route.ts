import { NextRequest, NextResponse } from 'next/server';
import { syncLatestCatalog } from '@/lib/sync/ingestion';

export async function POST(req: NextRequest) {
  try {
    const syncStats = await syncLatestCatalog();
    return NextResponse.json({
      success: true,
      message: 'Каталог успешно синхронизирован с провайдерами',
      stats: syncStats,
    });
  } catch (error: any) {
    console.error('Catalog sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Ошибка синхронизации каталога' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const syncStats = await syncLatestCatalog();
    return NextResponse.json({
      success: true,
      stats: syncStats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Ошибка синхронизации' },
      { status: 500 }
    );
  }
}
