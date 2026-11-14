import { IMusicProvider } from './base';
import { ProviderId, UnifiedTrack, PlaybackInfo } from '@/types/music';

const CURATED_SOUNDCLOUD_CATALOG: UnifiedTrack[] = [
  {
    id: 'sc_201',
    title: 'Starfall Horizon',
    artistName: 'Cosmic Odyssey',
    albumTitle: 'Interstellar Drift',
    durationMs: 184000,
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00101', // Identical ISRC to trigger Matching Engine!
    explicit: false,
    versionType: 'original',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_sc_201',
        providerId: 'soundcloud',
        providerName: 'SoundCloud',
        externalTrackId: '201',
        sourceVersion: 'Remastered Stream',
        quality: '160kbps Opus',
        isAvailable: true,
        playback: {
          type: 'iframe_widget',
          embedUrl: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/201&color=%23ff5500',
          externalUrl: 'https://soundcloud.com/cosmic-odyssey/starfall-horizon',
          audioFormat: 'opus',
        },
      },
    ],
  },
  {
    id: 'sc_202',
    title: 'Cybernetic Drive',
    artistName: 'Neon Void',
    albumTitle: 'Red Sector',
    durationMs: 215000,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00102', // Identical ISRC to trigger Matching Engine!
    explicit: true,
    versionType: 'original',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_sc_202',
        providerId: 'soundcloud',
        providerName: 'SoundCloud',
        externalTrackId: '202',
        sourceVersion: 'Club Mix',
        quality: '128kbps MP3',
        isAvailable: true,
        playback: {
          type: 'iframe_widget',
          embedUrl: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/202&color=%23ff5500',
          externalUrl: 'https://soundcloud.com/neon-void/cybernetic-drive',
          audioFormat: 'mp3',
        },
      },
    ],
  },
];

export class SoundCloudProvider implements IMusicProvider {
  readonly id: ProviderId = 'soundcloud';
  readonly name = 'SoundCloud';
  readonly isPlaybackSupported = true;
  readonly defaultPriority = 8;

  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.SOUNDCLOUD_CLIENT_ID || '';
  }

  async search(query: string, limit: number = 20): Promise<UnifiedTrack[]> {
    try {
      if (this.clientId) {
        const url = new URL('https://api-v2.soundcloud.com/search/tracks');
        url.searchParams.set('q', query);
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('limit', limit.toString());

        const res = await fetch(url.toString(), {
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.collection && data.collection.length > 0) {
            return data.collection.map((item: any) => ({
              id: `sc_${item.id}`,
              title: item.title,
              artistName: item.user?.username || 'Unknown Artist',
              albumTitle: null,
              durationMs: item.duration || 0,
              artworkUrl: item.artwork_url || item.user?.avatar_url || null,
              isrc: null,
              explicit: false,
              versionType: 'original' as const,
              activeSourceIndex: 0,
              sources: [
                {
                  id: `src_sc_${item.id}`,
                  providerId: 'soundcloud' as const,
                  providerName: 'SoundCloud',
                  externalTrackId: item.id.toString(),
                  quality: '128kbps AAC/MP3',
                  isAvailable: true,
                  playback: {
                    type: 'iframe_widget' as const,
                    embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
                      item.permalink_url
                    )}&color=%23ff5500`,
                    externalUrl: item.permalink_url,
                    audioFormat: 'mp3',
                  },
                },
              ],
            }));
          }
        }
      }
    } catch (err) {
      console.warn('SoundCloud API search failed, using curated catalog:', err);
    }

    return this.filterCuratedCatalog(query);
  }

  async getTrack(externalId: string): Promise<UnifiedTrack | null> {
    const found = CURATED_SOUNDCLOUD_CATALOG.find(
      (t) => t.sources[0]?.externalTrackId === externalId
    );
    return found || null;
  }

  async getPlaybackSource(externalId: string): Promise<PlaybackInfo> {
    const track = await this.getTrack(externalId);
    if (track && track.sources[0]?.playback) {
      return track.sources[0].playback;
    }
    return {
      type: 'iframe_widget',
      embedUrl: `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${externalId}`,
      audioFormat: 'mp3',
    };
  }

  private filterCuratedCatalog(query: string): UnifiedTrack[] {
    const q = query.toLowerCase().trim();
    if (!q || q === 'rock' || q === 'all') {
      return CURATED_SOUNDCLOUD_CATALOG;
    }
    return CURATED_SOUNDCLOUD_CATALOG.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        (t.albumTitle && t.albumTitle.toLowerCase().includes(q))
    );
  }
}
