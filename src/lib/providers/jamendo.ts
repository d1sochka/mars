import { IMusicProvider } from './base';
import { ProviderId, UnifiedTrack, PlaybackInfo } from '@/types/music';

interface JamendoApiTrack {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  album_name: string;
  album_id: string;
  audio: string;
  audiodl: string;
  image: string;
  musicinfo?: {
    vocalinstrumental?: string;
  };
  shareurl?: string;
}

const CURATED_JAMENDO_CATALOG: UnifiedTrack[] = [
  {
    id: 'jamendo_101',
    title: 'Starfall Horizon',
    artistName: 'Cosmic Odyssey',
    albumTitle: 'Interstellar Drift',
    durationMs: 184000,
    artworkUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00101',
    explicit: false,
    versionType: 'original',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_jamendo_101',
        providerId: 'jamendo',
        providerName: 'Jamendo Music',
        externalTrackId: '101',
        sourceVersion: 'Original Master',
        quality: '320kbps MP3',
        isAvailable: true,
        playback: {
          type: 'direct_stream',
          streamUrl: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
          externalUrl: 'https://www.jamendo.com/track/101',
          quality: '320k',
          audioFormat: 'mp3',
        },
      },
    ],
  },
  {
    id: 'jamendo_102',
    title: 'Cybernetic Drive',
    artistName: 'Neon Void',
    albumTitle: 'Red Sector',
    durationMs: 215000,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00102',
    explicit: true,
    versionType: 'original',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_jamendo_102',
        providerId: 'jamendo',
        providerName: 'Jamendo Music',
        externalTrackId: '102',
        sourceVersion: 'Explicit Original',
        quality: '320kbps MP3',
        isAvailable: true,
        playback: {
          type: 'direct_stream',
          streamUrl: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
          externalUrl: 'https://www.jamendo.com/track/102',
          quality: '320k',
          audioFormat: 'mp3',
        },
      },
    ],
  },
  {
    id: 'jamendo_103',
    title: 'Deep Space Ambient',
    artistName: 'Solitude Echo',
    albumTitle: 'Martian Sands',
    durationMs: 240000,
    artworkUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00103',
    explicit: false,
    versionType: 'original',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_jamendo_103',
        providerId: 'jamendo',
        providerName: 'Jamendo Music',
        externalTrackId: '103',
        sourceVersion: 'Studio Master',
        quality: '320kbps MP3',
        isAvailable: true,
        playback: {
          type: 'direct_stream',
          streamUrl: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
          externalUrl: 'https://www.jamendo.com/track/103',
          quality: '320k',
          audioFormat: 'mp3',
        },
      },
    ],
  },
  {
    id: 'jamendo_104',
    title: 'Quantum Beat',
    artistName: 'Pulsar 9',
    albumTitle: 'Velocity',
    durationMs: 172000,
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00104',
    explicit: false,
    versionType: 'instrumental',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_jamendo_104',
        providerId: 'jamendo',
        providerName: 'Jamendo Music',
        externalTrackId: '104',
        sourceVersion: 'Instrumental',
        quality: '320kbps MP3',
        isAvailable: true,
        playback: {
          type: 'direct_stream',
          streamUrl: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
          externalUrl: 'https://www.jamendo.com/track/104',
          quality: '320k',
          audioFormat: 'mp3',
        },
      },
    ],
  },
  {
    id: 'jamendo_105',
    title: 'Solar Wind Symphony',
    artistName: 'Aurora Borealis',
    albumTitle: 'Orbital Echoes',
    durationMs: 260000,
    artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    isrc: 'US-JMD-24-00105',
    explicit: false,
    versionType: 'original',
    activeSourceIndex: 0,
    sources: [
      {
        id: 'src_jamendo_105',
        providerId: 'jamendo',
        providerName: 'Jamendo Music',
        externalTrackId: '105',
        sourceVersion: 'FLAC Transcode',
        quality: '320kbps MP3',
        isAvailable: true,
        playback: {
          type: 'direct_stream',
          streamUrl: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
          externalUrl: 'https://www.jamendo.com/track/105',
          quality: '320k',
          audioFormat: 'mp3',
        },
      },
    ],
  },
];

export class JamendoProvider implements IMusicProvider {
  readonly id: ProviderId = 'jamendo';
  readonly name = 'Jamendo Music';
  readonly isPlaybackSupported = true;
  readonly defaultPriority = 10;

  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.JAMENDO_CLIENT_ID || '';
  }

  async search(query: string, limit: number = 20): Promise<UnifiedTrack[]> {
    try {
      if (this.clientId) {
        const url = new URL('https://api.jamendo.com/v3.0/tracks/');
        url.searchParams.set('client_id', this.clientId);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('namesearch', query);
        url.searchParams.set('audioformat', 'mp32');

        const res = await fetch(url.toString(), {
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            return data.results.map((item: JamendoApiTrack) => this.mapToUnifiedTrack(item));
          }
        }
      }
    } catch (err) {
      console.warn('Jamendo API search failed, using curated catalog:', err);
    }

    // Curated catalog fallback
    return this.filterCuratedCatalog(query);
  }

  async getTrack(externalId: string): Promise<UnifiedTrack | null> {
    const found = CURATED_JAMENDO_CATALOG.find(
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
      type: 'direct_stream',
      streamUrl: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
      quality: '320k',
      audioFormat: 'mp3',
    };
  }

  private filterCuratedCatalog(query: string): UnifiedTrack[] {
    const q = query.toLowerCase().trim();
    if (!q || q === 'rock' || q === 'all') {
      return CURATED_JAMENDO_CATALOG;
    }
    return CURATED_JAMENDO_CATALOG.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        (t.albumTitle && t.albumTitle.toLowerCase().includes(q))
    );
  }

  private mapToUnifiedTrack(item: JamendoApiTrack): UnifiedTrack {
    return {
      id: `jamendo_${item.id}`,
      title: item.name,
      artistName: item.artist_name,
      albumTitle: item.album_name || null,
      durationMs: (item.duration || 0) * 1000,
      artworkUrl: item.image || null,
      isrc: null,
      explicit: false,
      versionType: 'original',
      activeSourceIndex: 0,
      sources: [
        {
          id: `src_jamendo_${item.id}`,
          providerId: 'jamendo',
          providerName: 'Jamendo Music',
          externalTrackId: item.id,
          sourceVersion: 'Original Master',
          quality: '320kbps MP3',
          isAvailable: true,
          playback: {
            type: 'direct_stream',
            streamUrl: item.audio,
            externalUrl: item.shareurl || `https://www.jamendo.com/track/${item.id}`,
            quality: '320k',
            audioFormat: 'mp3',
          },
        },
      ],
    };
  }
}
