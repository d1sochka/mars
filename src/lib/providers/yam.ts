import { IMusicProvider } from './base';
import { ProviderId, UnifiedTrack, PlaybackInfo } from '@/types/music';
import crypto from 'crypto';

interface YamTrack {
  id: number | string;
  title: string;
  available?: boolean;
  durationMs?: number;
  artists?: Array<{ name: string; id: number }>;
  albums?: Array<{ id: number; title: string; year?: number }>;
  ogImage?: string;
  coverUri?: string;
}

export class YandexMusicProvider implements IMusicProvider {
  readonly id: ProviderId = 'yandex';
  readonly name = 'Яндекс Музыка (YAM)';
  readonly isPlaybackSupported = true;
  readonly defaultPriority = 12;

  private baseUrl = 'https://api.music.yandex.net';

  /**
   * Search Yandex Music API
   */
  async search(query: string, limit: number = 25): Promise<UnifiedTrack[]> {
    try {
      const url = `${this.baseUrl}/search?text=${encodeURIComponent(query)}&type=track&page=0`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Yandex-Music-API',
          Accept: 'application/json',
        },
        next: { revalidate: 1800 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      const tracks: YamTrack[] = data.result?.tracks?.results || [];

      return tracks.slice(0, limit).map((t) => this.mapToUnifiedTrack(t));
    } catch (err) {
      console.warn('YAM API search error:', err);
      return [];
    }
  }

  async getTrack(externalId: string): Promise<UnifiedTrack | null> {
    try {
      const url = `${this.baseUrl}/tracks/${externalId}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const t = data.result?.[0];
      return t ? this.mapToUnifiedTrack(t) : null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve direct MP3 audio stream for track
   */
  async getPlaybackSource(externalId: string): Promise<PlaybackInfo> {
    const streamUrl = await this.resolveDirectStream(externalId);
    return {
      type: 'direct_stream',
      streamUrl: streamUrl || `/api/yam/stream?trackId=${externalId}`,
      quality: '192kbps MP3',
      audioFormat: 'mp3',
    };
  }

  async resolveDirectStream(trackId: string): Promise<string | null> {
    try {
      const infoRes = await fetch(`${this.baseUrl}/tracks/${trackId}/download-info`, {
        headers: { 'User-Agent': 'Yandex-Music-API' },
      });
      if (!infoRes.ok) return null;

      const infoData = await infoRes.json();
      const downloadInfoUrl = infoData.result?.[0]?.downloadInfoUrl;
      if (!downloadInfoUrl) return null;

      const xmlRes = await fetch(downloadInfoUrl);
      if (!xmlRes.ok) return null;
      const xml = await xmlRes.text();

      const hostMatch = xml.match(/<host>(.*?)<\/host>/);
      const pathMatch = xml.match(/<path>(.*?)<\/path>/);
      const tsMatch = xml.match(/<ts>(.*?)<\/ts>/);
      const sMatch = xml.match(/<s>(.*?)<\/s>/);

      if (!hostMatch || !pathMatch || !tsMatch || !sMatch) return null;

      const host = hostMatch[1];
      const pathVal = pathMatch[1];
      const ts = tsMatch[1];
      const s = sMatch[1];

      const secret = 'XGRprocessad0k9浓';
      const hash = crypto.createHash('md5').update(secret + pathVal.slice(1) + s).digest('hex');

      return `https://${host}/get-mp3/${hash}/${ts}${pathVal}`;
    } catch (err) {
      console.warn('YAM stream resolve error:', err);
      return null;
    }
  }

  private mapToUnifiedTrack(t: YamTrack): UnifiedTrack {
    const artistName = t.artists?.map((a) => a.name).join(', ') || 'Unknown Artist';
    const albumTitle = t.albums?.[0]?.title || null;
    const coverRaw = t.ogImage || t.coverUri;
    const artworkUrl = coverRaw
      ? `https://${coverRaw.replace('%%', '400x400')}`
      : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

    const trackIdStr = t.id.toString();

    return {
      id: `yam_${trackIdStr}`,
      title: t.title,
      artistName,
      albumTitle,
      durationMs: t.durationMs || 180000,
      artworkUrl,
      isrc: null,
      explicit: false,
      versionType: 'original',
      activeSourceIndex: 0,
      sources: [
        {
          id: `src_yam_${trackIdStr}`,
          providerId: 'yandex' as any,
          providerName: 'Яндекс Музыка',
          externalTrackId: trackIdStr,
          sourceVersion: 'Original Master MP3',
          quality: '192kbps MP3',
          isAvailable: true,
          playback: {
            type: 'direct_stream',
            streamUrl: `/api/yam/stream?trackId=${trackIdStr}`,
            externalUrl: `https://music.yandex.ru/track/${trackIdStr}`,
            quality: '192k',
            audioFormat: 'mp3',
          },
        },
      ],
    };
  }
}
