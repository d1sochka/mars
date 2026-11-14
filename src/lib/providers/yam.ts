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

/**
 * Yandex Music Provider based on MarshalX/yandex-music-api implementation.
 * Uses official Android client headers and cryptographic MDS salt signing.
 */
export class YandexMusicProvider implements IMusicProvider {
  readonly id: ProviderId = 'yandex';
  readonly name = 'Яндекс Музыка (YAM)';
  readonly isPlaybackSupported = true;
  readonly defaultPriority = 12;

  private baseUrl = 'https://api.music.yandex.net';

  // Salt from MarshalX/yandex-music-api (yandex_music/download_info.py)
  private readonly SIGN_SALT = 'XGRlBW9FXlekgbPrRHuSiA';

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Yandex-Music-API',
      'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
      Accept: 'application/json',
    };

    const activeToken = token || process.env.YANDEX_MUSIC_TOKEN;
    if (activeToken) {
      headers['Authorization'] = `OAuth ${activeToken}`;
    }

    return headers;
  }

  /**
   * Search Yandex Music catalog
   */
  async search(query: string, limit: number = 25, token?: string): Promise<UnifiedTrack[]> {
    try {
      const url = `${this.baseUrl}/search?text=${encodeURIComponent(query)}&type=track&page=0`;
      const res = await fetch(url, {
        headers: this.getHeaders(token),
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

  async getTrack(externalId: string, token?: string): Promise<UnifiedTrack | null> {
    try {
      const url = `${this.baseUrl}/tracks/${externalId}`;
      const res = await fetch(url, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const t = data.result?.[0];
      return t ? this.mapToUnifiedTrack(t) : null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve playback source for track
   */
  async getPlaybackSource(externalId: string): Promise<PlaybackInfo> {
    const streamUrl = await this.resolveDirectStream(externalId);
    return {
      type: 'direct_stream',
      streamUrl: streamUrl || `/api/yam/stream?trackId=${externalId}`,
      quality: '328kbps Hi-Fi Master',
      audioFormat: 'mp3',
    };
  }

  /**
   * Resolve direct MP3 audio stream using MarshalX signing algorithm
   */
  async resolveDirectStream(trackId: string, token?: string): Promise<string | null> {
    try {
      const infoUrl = `${this.baseUrl}/tracks/${trackId}/download-info`;
      const infoRes = await fetch(infoUrl, {
        headers: this.getHeaders(token),
      });
      if (!infoRes.ok) return null;

      const infoData = await infoRes.json();
      const results = infoData.result;
      if (!results || !Array.isArray(results) || results.length === 0) return null;

      // Select MP3 codec with highest bitrate (prefer non-preview if available)
      const sorted = [...results].sort((a, b) => {
        if (a.preview === false && b.preview === true) return -1;
        if (a.preview === true && b.preview === false) return 1;
        return (b.bitrateInKbps || 0) - (a.bitrateInKbps || 0);
      });

      const downloadInfoUrl = sorted[0]?.downloadInfoUrl;
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

      // Exact MarshalX cryptographic signing formula
      const sign = crypto
        .createHash('md5')
        .update(this.SIGN_SALT + pathVal.slice(1) + s)
        .digest('hex');

      return `https://${host}/get-mp3/${sign}/${ts}${pathVal}`;
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
      durationMs: (t.durationMs && t.durationMs > 30000) ? t.durationMs : 215000,
      artworkUrl,
      isrc: null,
      explicit: false,
      versionType: 'original',
      activeSourceIndex: 0,
      sources: [
        {
          id: `src_yam_${trackIdStr}`,
          providerId: 'yandex' as any,
          providerName: 'Яндекс Музыка (MarshalX API)',
          externalTrackId: trackIdStr,
          sourceVersion: 'Original Master 328k',
          quality: '328kbps Hi-Fi',
          isAvailable: true,
          playback: {
            type: 'direct_stream',
            streamUrl: `/api/yam/stream?trackId=${trackIdStr}`,
            externalUrl: `https://music.yandex.ru/track/${trackIdStr}`,
            quality: '328kbps',
            audioFormat: 'mp3',
          },
        },
      ],
    };
  }
}
