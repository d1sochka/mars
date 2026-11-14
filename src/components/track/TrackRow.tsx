'use client';

import React from 'react';
import { Play, Pause, MoreHorizontal, Layers, Heart } from 'lucide-react';
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
  const formattedIndex = (index + 1 < 10 ? '0' : '') + (index + 1);

  return (
    <div
      onClick={onPlay}
      className={`group flex items-center justify-between py-3.5 px-4 rounded-2xl cursor-pointer transition-all ${
        isCurrent
          ? 'bg-white shadow-[0_4px_16px_rgba(163,177,198,0.25)] border border-slate-200/80'
          : 'hover:bg-white/60 hover:shadow-sm border border-transparent'
      }`}
    >
      {/* Left: Index / Animated Equalizer & Title / Artist */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Index or Equalizer */}
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-4 w-4 justify-center">
              <span className="w-1 bg-[#121316] rounded-full animate-eq-1" />
              <span className="w-1 bg-[#121316] rounded-full animate-eq-2" />
              <span className="w-1 bg-[#121316] rounded-full animate-eq-3" />
            </div>
          ) : (
            <span
              className={`font-mono text-xs font-semibold ${
                isCurrent ? 'text-[#121316] font-bold' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            >
              {formattedIndex}
            </span>
          )}
        </div>

        {/* Thumbnail (clean rounded-xl) */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 shadow-sm border border-slate-200/60">
          {track.artworkUrl ? (
            <img
              src={track.artworkUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
              ♪
            </div>
          )}
        </div>

        {/* Title and Artist + Duration */}
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <p
              className={`font-bold text-sm truncate ${
                isCurrent ? 'text-black' : 'text-slate-800'
              }`}
            >
              {track.title}
            </p>
            {track.explicit && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600">
                E
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
            {track.artistName} • {formatDurationMs(track.durationMs)}
          </p>
        </div>
      </div>

      {/* Middle: Source Badge */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0 px-3">
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
          {activeSource?.providerName || 'Источник'}
          {track.sources.length > 1 && ` +${track.sources.length - 1}`}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 text-slate-400">
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-1 text-slate-300 hover:text-slate-700 transition-colors"
          title="Действия"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
