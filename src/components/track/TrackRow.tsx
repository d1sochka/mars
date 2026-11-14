'use client';

import React from 'react';
import { Play, Pause, Heart, Layers, ExternalLink } from 'lucide-react';
import { UnifiedTrack } from '@/types/music';
import { formatDurationMs } from '@/lib/utils';

interface TrackRowProps {
  track: UnifiedTrack;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onSelectSource?: (sourceIndex: number) => void;
}

export function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  onPlay,
  onSelectSource,
}: TrackRowProps) {
  const activeSource = track.sources[track.activeSourceIndex || 0];

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-xl transition-all ${
        isCurrent
          ? 'bg-mars-red/10 border border-mars-red/30'
          : 'hover:bg-mars-surface border border-transparent hover:border-mars-border'
      }`}
    >
      {/* Left: Index / Play Button & Artwork & Title */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          <button
            onClick={onPlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isCurrent && isPlaying
                ? 'bg-mars-red text-white'
                : 'text-mars-muted group-hover:text-white group-hover:bg-mars-card'
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-mars-card flex-shrink-0 border border-mars-border">
          {track.artworkUrl ? (
            <img
              src={track.artworkUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-mars-surface flex items-center justify-center text-mars-muted text-xs font-bold">
              ♪
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <p
              className={`font-medium text-sm truncate ${
                isCurrent ? 'text-mars-red font-semibold' : 'text-white'
              }`}
            >
              {track.title}
            </p>
            {track.explicit && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mars-red/20 text-mars-red border border-mars-red/40">
                EXPLICIT
              </span>
            )}
            {track.versionType && track.versionType !== 'original' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-mars-card text-mars-muted uppercase">
                {track.versionType}
              </span>
            )}
          </div>
          <p className="text-xs text-mars-muted truncate">{track.artistName}</p>
        </div>
      </div>

      {/* Middle: Sources Badges (The core feature of MARS: Multi-Platform Aggregation!) */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0 px-4">
        <div className="flex items-center gap-1.5 bg-mars-card px-2.5 py-1 rounded-lg border border-mars-border text-[11px]">
          <Layers className="w-3.5 h-3.5 text-mars-red" />
          <span className="text-white font-medium">
            {activeSource?.providerName || 'Источник'}
          </span>
          {track.sources.length > 1 && (
            <span className="text-mars-red font-bold text-[10px] ml-0.5">
              +{track.sources.length - 1}
            </span>
          )}
        </div>
      </div>

      {/* Right: Duration & Actions */}
      <div className="flex items-center gap-3 text-xs text-mars-muted font-mono flex-shrink-0">
        <span>{formatDurationMs(track.durationMs)}</span>
        <button
          className="text-mars-muted hover:text-mars-red p-1 transition-colors"
          title="Добавить в избранное"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
