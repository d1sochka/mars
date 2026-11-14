import { NextRequest, NextResponse } from 'next/server';
import { JamendoProvider } from '@/lib/providers/jamendo';
import { SoundCloudProvider } from '@/lib/providers/soundcloud';
import { AppleCatalogProvider } from '@/lib/providers/itunes';
import { YandexMusicProvider } from '@/lib/providers/yam';
import { mergeTracks } from '@/lib/matching';
import { ProviderId, SearchResult } from '@/types/music';
import { ingestTracks } from '@/lib/sync/ingestion';

const jamendo = new JamendoProvider();
const soundcloud = new SoundCloudProvider();
const appleMusic = new AppleCatalogProvider();
const yam = new YandexMusicProvider();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() || '';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 1), 50);

  if (!query) {
    return NextResponse.json({
      query: '',
      tracks: [],
      totalResults: 0,
      providersQueried: [],
    } satisfies SearchResult);
  }

  try {
    const providersQueried: ProviderId[] = ['yandex', 'apple_music', 'jamendo', 'soundcloud', 'youtube'];

    // Parallel fetch from all providers covering global music library!
    const [yamTracks, appleTracks, jamendoTracks, soundcloudTracks] = await Promise.all([
      yam.search(query, limit).catch(() => []),
      appleMusic.search(query, limit).catch(() => []),
      jamendo.search(query, limit).catch(() => []),
      soundcloud.search(query, limit).catch(() => []),
    ]);

    // Cross-source matching and deduplication
    const unifiedTracks = mergeTracks([yamTracks, appleTracks, jamendoTracks, soundcloudTracks]);

    // Asynchronously auto-ingest into platform database
    if (unifiedTracks.length > 0) {
      ingestTracks(unifiedTracks).catch((err) =>
        console.warn('Background auto-ingestion error:', err)
      );
    }

    const result: SearchResult = {
      query,
      tracks: unifiedTracks,
      totalResults: unifiedTracks.length,
      providersQueried,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unified search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform unified search' },
      { status: 500 }
    );
  }
}
