import { NextRequest, NextResponse } from 'next/server';
import { AppleCatalogProvider } from '@/lib/providers/itunes';

const apple = new AppleCatalogProvider();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'global';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 1), 50);

  try {
    let tracks = [];

    if (type === 'global' || type === 'top') {
      tracks = await apple.getTopCharts(limit, 'us');
    } else if (type === 'ru') {
      tracks = await apple.getTopCharts(limit, 'ru');
    } else {
      // Query specific genre charts or hot releases
      tracks = await apple.search(type, limit);
    }

    return NextResponse.json({
      type,
      total: tracks.length,
      tracks,
    });
  } catch (error) {
    console.error('Charts fetch error:', error);
    return NextResponse.json({ type, total: 0, tracks: [] }, { status: 500 });
  }
}
