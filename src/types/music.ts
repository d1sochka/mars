export type ProviderId = 'jamendo' | 'soundcloud' | 'apple_music' | 'youtube' | 'spotify';

export type PlaybackType = 'direct_stream' | 'iframe_widget' | 'sdk_bridge' | 'external_url';

export interface PlaybackInfo {
  type: PlaybackType;
  streamUrl?: string;
  embedUrl?: string;
  externalUrl?: string;
  quality?: string;
  audioFormat?: string;
  expiresAt?: number;
}

export interface UnifiedTrackSource {
  id: string;
  providerId: ProviderId;
  providerName: string;
  externalTrackId: string;
  playback: PlaybackInfo;
  sourceVersion?: string | null;
  quality?: string;
  isAvailable: boolean;
}

export interface UnifiedTrack {
  id: string;
  title: string;
  artistName: string;
  albumTitle?: string | null;
  durationMs: number;
  artworkUrl?: string | null;
  isrc?: string | null;
  explicit: boolean;
  versionType: 'original' | 'remix' | 'live' | 'acoustic' | 'instrumental' | 'clean';
  sources: UnifiedTrackSource[];
  activeSourceIndex: number;
}

export interface SearchResult {
  query: string;
  tracks: UnifiedTrack[];
  totalResults: number;
  providersQueried: ProviderId[];
}
