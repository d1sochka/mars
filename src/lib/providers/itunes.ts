import { IMusicProvider } from './base';
import { ProviderId, UnifiedTrack, PlaybackInfo } from '@/types/music';

interface ITunesTrackItem {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  trackTimeMillis?: number;
  artworkUrl100?: string;
  previewUrl?: string;
  trackExplicitness?: string;
  trackViewUrl?: string;
  isrc?: string;
  primaryGenreName?: string;
}

export class AppleCatalogProvider implements IMusicProvider {
  readonly id: ProviderId = 'apple_music';
  readonly name = 'Apple Music / iTunes';
  readonly isPlaybackSupported = true;
  readonly defaultPriority = 10;

  async search(query: string, limit: number = 25): Promise<UnifiedTrack[]> {
    try {
      const url = new URL('https://itunes.apple.com/search');
      url.searchParams.set('term', query);
      url.searchParams.set('entity', 'song');
      url.searchParams.set('limit', limit.toString());

      const res = await fetch(url.toString(), {
        next: { revalidate: 1800 },
      });

      if (!res.ok) return [];

      const data = await res.json();
      const results: ITunesTrackItem[] = data.results || [];

      return results.map((item) => this.mapToUnifiedTrack(item));
    } catch (err) {
      console.warn('Apple Catalog search error:', err);
      return [];
    }
  }

  async getTrack(externalId: string): Promise<UnifiedTrack | null> {
    try {
      const url = `https://itunes.apple.com/lookup?id=${externalId}&entity=song`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const item = data.results?.[0];
      return item ? this.mapToUnifiedTrack(item) : null;
    } catch {
      return null;
    }
  }

  async getPlaybackSource(externalId: string): Promise<PlaybackInfo> {
    const track = await this.getTrack(externalId);
    if (track && track.sources[0]?.playback) {
      return track.sources[0].playback;
    }
    return {
      type: 'direct_stream',
      quality: '256kbps AAC',
      audioFormat: 'm4a',
    };
  }

  /**
   * Fetch current global top chart and new releases from Apple Music RSS
   */
  async getTopCharts(limit: number = 25, country: string = 'us'): Promise<UnifiedTrack[]> {
    try {
      const url = `https://rss.applemarketingtools.com/api/v2/${country}/music/most-played/${limit}/songs.json`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return [];

      const data = await res.json();
      const items = data.feed?.results || [];

      // Convert each chart entry into a UnifiedTrack
      return items.map((item: any, idx: number) => {
        // Upgrade artwork from 100x100 to 600x600
        const highResArtwork = (item.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg');

        return {
          id: `apple_${item.id || idx}`,
          title: item.name,
          artistName: item.artistName,
          albumTitle: item.collectionName || 'Single',
          durationMs: 210000, // Estimated average 3.5 min
          artworkUrl: highResArtwork || item.artworkUrl100,
          isrc: null,
          explicit: false,
          versionType: 'original' as const,
          activeSourceIndex: 0,
          sources: [
            {
              id: `src_apple_${item.id || idx}`,
              providerId: 'apple_music' as const,
              providerName: 'Apple Music',
              externalTrackId: item.id?.toString() || idx.toString(),
              sourceVersion: 'Original Master',
              quality: '256kbps AAC / Hi-Fi',
              isAvailable: true,
              playback: {
                type: 'direct_stream' as const,
                externalUrl: item.url,
                quality: '256kbps AAC',
                audioFormat: 'm4a',
              },
            },
            {
              id: `src_yt_${item.id || idx}`,
              providerId: 'youtube' as const,
              providerName: 'YouTube Music',
              externalTrackId: encodeURIComponent(`${item.artistName} - ${item.name}`),
              sourceVersion: 'Official Video / Audio',
              quality: '1080p / 320k',
              isAvailable: true,
              playback: {
                type: 'iframe_widget' as const,
                embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                  `${item.artistName} - ${item.name}`
                )}&autoplay=1`,
                externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${item.artistName} - ${item.name}`
                )}`,
                audioFormat: 'opus',
              },
            },
          ],
        };
      });
    } catch (err) {
      console.warn('Failed to fetch top charts:', err);
      return [];
    }
  }

  private mapToUnifiedTrack(item: ITunesTrackItem): UnifiedTrack {
    const isExplicit = item.trackExplicitness === 'explicit';
    // Upgrade artwork to 600x600 high-res
    const artwork = (item.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg');

    return {
      id: `itunes_${item.trackId}`,
      title: item.trackName,
      artistName: item.artistName,
      albumTitle: item.collectionName || null,
      durationMs: item.trackTimeMillis || 0,
      artworkUrl: artwork,
      isrc: item.isrc || null,
      explicit: isExplicit,
      versionType: 'original',
      activeSourceIndex: 0,
      sources: [
        {
          id: `src_itunes_${item.trackId}`,
          providerId: 'apple_music',
          providerName: 'Apple Music',
          externalTrackId: item.trackId.toString(),
          sourceVersion: isExplicit ? 'Explicit Master' : 'Original Master',
          quality: '256kbps AAC / Master',
          isAvailable: true,
          playback: {
            type: 'direct_stream',
            streamUrl: item.previewUrl,
            externalUrl: item.trackViewUrl,
            quality: '256k',
            audioFormat: 'm4a',
          },
        },
        {
          id: `src_yt_${item.trackId}`,
          providerId: 'youtube',
          providerName: 'YouTube Music',
          externalTrackId: encodeURIComponent(`${item.artistName} - ${item.trackName}`),
          sourceVersion: 'Full Track Playback',
          quality: 'Original Stream',
          isAvailable: true,
          playback: {
            type: 'iframe_widget',
            embedUrl: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
              `${item.artistName} - ${item.trackName}`
            )}&autoplay=1`,
            externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${item.artistName} - ${item.trackName}`
            )}`,
            audioFormat: 'opus',
          },
        },
      ],
    };
  }
}
