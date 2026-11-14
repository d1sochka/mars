import { ProviderId, UnifiedTrack, PlaybackInfo } from '@/types/music';

export interface IMusicProvider {
  readonly id: ProviderId;
  readonly name: string;
  readonly isPlaybackSupported: boolean;
  readonly defaultPriority: number;

  search(query: string, limit?: number): Promise<UnifiedTrack[]>;
  getTrack(externalId: string): Promise<UnifiedTrack | null>;
  getPlaybackSource(externalId: string): Promise<PlaybackInfo>;
}
