'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Layers,
  Heart,
  Shuffle,
  Repeat,
} from 'lucide-react';
import { UnifiedTrack, UnifiedTrackSource } from '@/types/music';
import { formatTime } from '@/lib/utils';

interface AudioPlayerProps {
  currentTrack: UnifiedTrack | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSelectSource?: (sourceIndex: number) => void;
}

export function AudioPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onSelectSource,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  const activeSource: UnifiedTrackSource | undefined =
    currentTrack?.sources[currentTrack.activeSourceIndex || 0];

  const streamUrl = activeSource?.playback.streamUrl;

  // Sync audio element with play state & stream URL
  useEffect(() => {
    if (!audioRef.current) return;

    if (streamUrl) {
      if (audioRef.current.src !== streamUrl) {
        audioRef.current.src = streamUrl;
        audioRef.current.load();
      }
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.log('Playback error:', err));
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();
    }
  }, [streamUrl, isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // MediaSession API for mobile lock screen & multimedia keys
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artistName,
        album: currentTrack.albumTitle || 'MARS Multi-Platform',
        artwork: currentTrack.artworkUrl
          ? [{ src: currentTrack.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', onPlayPause);
      navigator.mediaSession.setActionHandler('pause', onPlayPause);
      if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext);
      if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    }
  }, [currentTrack, onPlayPause, onNext, onPrev]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration && audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) setIsMuted(false);
  };

  if (!currentTrack) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-20 mars-glass border-t border-mars-border/50 px-6 flex items-center justify-between text-mars-muted text-sm z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-mars-surface border border-mars-border/40 flex items-center justify-center">
            <Radio className="w-5 h-5 text-mars-muted/60 animate-pulse" />
          </div>
          <div>
            <p className="text-white font-medium">MARS готов к воспроизведению</p>
            <p className="text-xs text-mars-muted">Выберите композицию для прослушивания</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNext || onPlayPause}
      />

      <footer className="fixed bottom-0 left-0 right-0 h-22 mars-glass border-t border-mars-border px-4 md:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3 z-50">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4 min-w-[200px]">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-mars-surface border border-mars-border flex-shrink-0">
            {currentTrack.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-mars-card">
                <Radio className="w-6 h-6 text-mars-red" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium text-sm md:text-base truncate">
                {currentTrack.title}
              </p>
              {currentTrack.explicit && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-mars-red/20 text-mars-red border border-mars-red/40">
                  E
                </span>
              )}
            </div>
            <p className="text-xs text-mars-muted truncate">{currentTrack.artistName}</p>
          </div>

          <button
            className="text-mars-muted hover:text-mars-red transition-colors hidden sm:block"
            title="Добавить в избранное"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Center Controls & Timeline */}
        <div className="flex flex-col items-center gap-2 w-full md:w-2/4 max-w-xl">
          <div className="flex items-center gap-5">
            <button
              onClick={onPrev}
              className="text-mars-muted hover:text-white transition-colors p-1"
              title="Предыдущий трек"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-11 h-11 rounded-full bg-mars-red text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform mars-glow"
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="text-mars-muted hover:text-white transition-colors p-1"
              title="Следующий трек"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline Bar */}
          <div className="w-full flex items-center gap-3 text-xs text-mars-muted font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || currentTrack.durationMs / 1000 || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-mars-border rounded-lg appearance-none cursor-pointer accent-mars-red focus:outline-none"
            />
            <span>{formatTime(duration || currentTrack.durationMs / 1000)}</span>
          </div>
        </div>

        {/* Right Side: Source Selector Badge & Volume */}
        <div className="flex items-center justify-end gap-4 w-full md:w-1/4">
          {/* Multi-Source Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSourceMenu(!showSourceMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mars-surface hover:bg-mars-card border border-mars-border text-xs text-mars-text transition-all"
              title="Выбрать источник воспроизведения"
            >
              <Layers className="w-3.5 h-3.5 text-mars-red" />
              <span className="font-semibold text-white uppercase text-[11px]">
                {activeSource?.providerName || 'Источник'}
              </span>
              <span className="text-mars-muted text-[10px]">
                ({currentTrack.sources.length})
              </span>
            </button>

            {/* Dropdown Menu of Sources */}
            {showSourceMenu && (
              <div className="absolute bottom-full right-0 mb-3 w-56 rounded-xl bg-mars-surface border border-mars-border shadow-2xl p-2 z-50">
                <p className="text-[11px] font-semibold text-mars-muted px-2 py-1 uppercase tracking-wider">
                  Доступные источники
                </p>
                <div className="space-y-1 mt-1">
                  {currentTrack.sources.map((src, idx) => {
                    const isSelected = idx === (currentTrack.activeSourceIndex || 0);
                    return (
                      <button
                        key={src.id}
                        onClick={() => {
                          if (onSelectSource) onSelectSource(idx);
                          setShowSourceMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-mars-red/20 text-white border border-mars-red/40'
                            : 'hover:bg-mars-card text-mars-text'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-mars-red' : 'bg-mars-muted'
                            }`}
                          />
                          <div>
                            <p className="font-medium">{src.providerName}</p>
                            <p className="text-[10px] text-mars-muted">
                              {src.quality || 'Стандарт'} • {src.sourceVersion || 'Original'}
                            </p>
                          </div>
                        </div>
                        {src.playback.externalUrl && (
                          <a
                            href={src.playback.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-mars-muted hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-mars-muted hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-mars-red" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-mars-border rounded-lg appearance-none cursor-pointer accent-mars-red"
            />
          </div>
        </div>
      </footer>
    </>
  );
}
