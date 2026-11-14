import { NextRequest, NextResponse } from 'next/server';
import { YandexMusicProvider } from '@/lib/providers/yam';

const yam = new YandexMusicProvider();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackId = searchParams.get('trackId');

  if (!trackId) {
    return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
  }

  try {
    const streamUrl = await yam.resolveDirectStream(trackId);

    if (!streamUrl) {
      // Fallback sample stream if track has regional restrictions
      return NextResponse.redirect(
        'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3'
      );
    }

    // Direct redirect to CDN audio stream
    return NextResponse.redirect(streamUrl);
  } catch (err: any) {
    console.error('YAM Stream error:', err);
    return NextResponse.redirect(
      'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3'
    );
  }
}
