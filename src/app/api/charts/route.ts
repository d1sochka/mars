import { NextRequest, NextResponse } from 'next/server';
import { AppleCatalogProvider } from '@/lib/providers/itunes';
import { YandexMusicProvider } from '@/lib/providers/yam';
import { mergeTracks } from '@/lib/matching';

const apple = new AppleCatalogProvider();
const yam = new YandexMusicProvider();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'yam';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 1), 50);

  try {
    let tracks = [];

    if (type === 'yam' || type === 'hits') {
      // Yandex Music real-time hits & new releases
      const [yamTracks, appleTracks] = await Promise.all([
        yam.search('хиты', limit).catch(() => []),
        apple.getTopCharts(limit, 'us').catch(() => []),
      ]);
      tracks = mergeTracks([yamTracks, appleTracks]);
    } else if (type === 'new') {
      const [yamTracks, appleTracks] = await Promise.all([
        yam.search('новинки', limit).catch(() => []),
        apple.search('2026', limit).catch(() => []),
      ]);
      tracks = mergeTracks([yamTracks, appleTracks]);
    } else if (type === 'global') {
      const appleTracks = await apple.getTopCharts(limit, 'us');
      tracks = appleTracks;
    } else {
      const [yamTracks, appleTracks] = await Promise.all([
        yam.search(type, limit).catch(() => []),
        apple.search(type, limit).catch(() => []),
      ]);
      tracks = mergeTracks([yamTracks, appleTracks]);
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
