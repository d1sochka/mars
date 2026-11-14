import { NextRequest, NextResponse } from 'next/server';
import { YandexMusicProvider } from '@/lib/providers/yam';

const yam = new YandexMusicProvider();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get('trackId');
  const query = searchParams.get('q');
  const token =
    searchParams.get('token') ||
    req.headers.get('x-yam-token') ||
    process.env.YANDEX_MUSIC_TOKEN ||
    undefined;

  let targetTrackId = trackId;

  // Search by query if trackId is not provided
  if (!targetTrackId && query) {
    try {
      const searchResults = await yam.search(query, 1, token);
      if (searchResults.length > 0) {
        targetTrackId = searchResults[0].sources[0]?.externalTrackId;
      }
    } catch (err) {
      console.warn('YAM Search in stream failed:', err);
    }
  }

  if (!targetTrackId && !query) {
    return NextResponse.json({ error: 'Missing trackId or query q' }, { status: 400 });
  }

  try {
    let directUrl: string | null = null;
    if (targetTrackId) {
      directUrl = await yam.resolveDirectStream(targetTrackId, token);
    }

    // Direct proxy to provide audio/mpeg with full Range and CORS headers
    const audioUrl = directUrl || 'https://prod-1.storage.jamendo.com/download/track/101/mp32/';

    const audioRes = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Yandex-Music-API',
      },
    });

    if (!audioRes.ok || !audioRes.body) {
      return NextResponse.json({ error: 'Failed to fetch audio stream' }, { status: 502 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'audio/mpeg');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'public, max-age=1800');

    const contentLength = audioRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    return new Response(audioRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('YAM Stream error:', err);
    return NextResponse.json({ error: 'Streaming error', details: err?.message }, { status: 500 });
  }
}
