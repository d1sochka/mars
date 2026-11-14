'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Shuffle,
  Repeat,
  ChevronDown,
  ListMusic,
  MoreHorizontal,
  Youtube,
  Radio,
  Sparkles,
} from 'lucide-react';
import { UnifiedTrack, UnifiedTrackSource } from '@/types/music';
import { formatTime } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';

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
  const [volume, setVolume] = useState(0.9);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [fullSongModal, setFullSongModal] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = currentTrack ? (isFavorite(currentTrack.id) || isFavorite(currentTrack.title)) : false;

  const activeSource: UnifiedTrackSource | undefined =
    currentTrack?.sources[currentTrack.activeSourceIndex || 0];

  const streamUrl = activeSource?.playback.streamUrl;
  const isIframe = activeSource?.playback.type === 'iframe_widget';

  // Sync audio stream
  useEffect(() => {
    if (!audioRef.current) return;

    if (streamUrl && !isIframe) {
      if (audioRef.current.src !== streamUrl) {
        audioRef.current.src = streamUrl;
        audioRef.current.load();
      }
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn('Playback audio stream notice:', err);
        });
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();
    }
  }, [streamUrl, isPlaying, isIframe]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // MediaSession API
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artistName,
        album: currentTrack.albumTitle || 'MARS Music',
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

  if (!currentTrack) return null;

  const totalSec = duration || (currentTrack.durationMs ? currentTrack.durationMs / 1000 : 210);
  const progressRatio = totalSec > 0 ? Math.min(currentTime / totalSec, 1) : 0;

  // Waveform bars simulation
  const waveformHeights = [
    12, 18, 24, 15, 30, 22, 14, 28, 36, 18, 26, 40, 32, 20, 28, 38, 44, 26, 32,
    48, 34, 22, 38, 42, 28, 20, 35, 45, 30, 22, 18, 28, 36, 22, 16, 24, 18, 12,
  ];

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (isRepeat) {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          } else if (onNext) {
            onNext();
          } else {
            onPlayPause();
          }
        }}
        onError={() => {
          // If error occurs, fallback to next source
          if (currentTrack.sources.length > 1 && onSelectSource) {
            const nextIdx = ((currentTrack.activeSourceIndex || 0) + 1) % currentTrack.sources.length;
            onSelectSource(nextIdx);
          }
        }}
      />

      {/* Embedded Full Track Modal when YouTube Full Playback is active */}
      {fullSongModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121316] text-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm">Полная версия трека (Full Song)</span>
              </div>
              <button
                onClick={() => setFullSongModal(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Закрыть
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                  `${currentTrack.artistName} - ${currentTrack.title}`
                )}&autoplay=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-none"
              />
            </div>
            <p className="text-xs text-zinc-400 text-center">
              Воспроизведение полной версии трека без ограничений по времени
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. FLOATING MINI-PLAYER (Bottom obsidian black pill matching mockup right)
         ========================================================================= */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-[460px] z-40">
        <div
          onClick={() => setIsExpanded(true)}
          className="bg-[#121316] text-white rounded-3xl p-3 px-4 shadow-[0_12px_36px_rgba(18,19,22,0.4)] flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          {/* Left: Thumbnail & Title/Artist */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md">
              <img
                src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white truncate">
                {currentTrack.title}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {currentTrack.artistName}
              </p>
            </div>
          </div>

          {/* Right: Heart & Black/White Play-Pause Button */}
          <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleFavorite(currentTrack)}
              className="text-zinc-400 hover:text-red-500 transition-colors p-1"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>

            <button
              onClick={onPlayPause}
              className="w-10 h-10 rounded-full bg-white text-[#121316] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FULL NOW PLAYING SCREEN (Matching mockup left view!)
         ========================================================================= */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-[#F2F4F8] overflow-y-auto flex flex-col justify-between p-6 sm:p-10 animate-fadeIn">
          {/* Top Header */}
          <div className="flex items-center justify-between max-w-md mx-auto w-full">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h3 className="font-bold text-sm tracking-wide text-slate-800">
                Now Playing
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {activeSource?.providerName || 'MARS Audio'} • {activeSource?.quality || '320kbps'}
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black"
                title="Источники"
              >
                <ListMusic className="w-5 h-5" />
              </button>

              {/* Source Dropdown Menu */}
              {showSourceMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl neu-flat p-2.5 z-50 shadow-2xl">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Источники трека
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
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#121316] text-white shadow-md'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <p>{src.providerName}</p>
                            <p className="text-[10px] text-slate-400">{src.quality || '320k'}</p>
                          </div>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setShowSourceMenu(false);
                        setFullSongModal(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 mt-2 border-t border-slate-100 pt-2"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>Полная песня (Full 4m+)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Large Artwork & Track Title */}
          <div className="max-w-md mx-auto w-full my-auto py-6 flex flex-col items-center">
            {/* Massive Album Cover */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-[0_20px_45px_rgba(163,177,198,0.4)] border border-white relative group">
              <img
                src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Title, Artist, and Favorite/Menu */}
            <div className="w-full flex items-center justify-between mt-8 px-2">
              <button
                onClick={() => toggleFavorite(currentTrack)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              <div className="text-center min-w-0 flex-1 px-4">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-semibold text-slate-400 truncate mt-1">
                  {currentTrack.artistName}
                </p>
              </div>

              <button
                onClick={() => setFullSongModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                title="Слушать полную версию"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Full Song Switcher Pill */}
            <div className="mt-3">
              <button
                onClick={() => setFullSongModal(true)}
                className="px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Включить полную версию трека (3-5 мин)</span>
              </button>
            </div>

            {/* Audio Waveform & Timeline */}
            <div className="w-full mt-6 px-2 space-y-2">
              <div className="flex items-center justify-between gap-1 h-12 px-1">
                {waveformHeights.map((h, i) => {
                  const barRatio = i / waveformHeights.length;
                  const isFilled = barRatio <= progressRatio;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        const targetTime = barRatio * totalSec;
                        setCurrentTime(targetTime);
                        if (audioRef.current) audioRef.current.currentTime = targetTime;
                      }}
                      style={{ height: `${h}px` }}
                      className={`flex-1 rounded-full cursor-pointer transition-colors ${
                        isFilled ? 'bg-[#121316]' : 'bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Progress Slider (Hidden / Integrated) */}
              <input
                type="range"
                min="0"
                max={totalSec}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-transparent opacity-0 cursor-pointer -mt-4 relative z-10"
              />

              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 px-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalSec)}</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="w-full flex items-center justify-between mt-6 px-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 transition-colors ${isShuffle ? 'text-black' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-2 text-slate-700 hover:text-black transition-colors active:scale-95"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              {/* Big Black Play / Pause Circle */}
              <button
                onClick={onPlayPause}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#121316] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(18,19,22,0.45)] hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-2 text-slate-700 hover:text-black transition-colors active:scale-95"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-2 transition-colors ${isRepeat ? 'text-black' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="h-6" />
        </div>
      )}
    </>
  );
}
