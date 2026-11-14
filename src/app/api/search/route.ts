import { NextRequest, NextResponse } from 'next/server';
import { JamendoProvider } from '@/lib/providers/jamendo';
import { SoundCloudProvider } from '@/lib/providers/soundcloud';
import { mergeTracks } from '@/lib/matching';
import { ProviderId, SearchResult } from '@/types/music';
import { ingestTracks } from '@/lib/sync/ingestion';

const jamendo = new JamendoProvider();
const soundcloud = new SoundCloudProvider();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() || '';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 50);

  if (!query) {
    return NextResponse.json({
      query: '',
      tracks: [],
      totalResults: 0,
      providersQueried: [],
    } satisfies SearchResult);
  }

  try {
    const providersQueried: ProviderId[] = ['jamendo', 'soundcloud'];

    // Parallel fetch from all enabled providers
    const [jamendoTracks, soundcloudTracks] = await Promise.all([
      jamendo.search(query, limit).catch(() => []),
      soundcloud.search(query, limit).catch(() => []),
    ]);

    // Unified Matching Engine
    const unifiedTracks = mergeTracks([jamendoTracks, soundcloudTracks]);

    // Asynchronously auto-ingest newly found tracks into the platform database
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
