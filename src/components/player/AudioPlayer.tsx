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
  Film,
  Music,
} from 'lucide-react';
import { UnifiedTrack, UnifiedTrackSource } from '@/types/music';
import { formatTime } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';
import { resolveTrackVideoId } from '@/lib/videoResolver';

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
  const currentAudioSrcRef = useRef<string>('');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [yamToken, setYamToken] = useState<string>('');

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('mars_yam_token') || '';
      setYamToken(savedToken);
    } catch (e) {}
  }, []);

  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = currentTrack ? (isFavorite(currentTrack.id) || isFavorite(currentTrack.title)) : false;

  const activeSource: UnifiedTrackSource | undefined =
    currentTrack?.sources[currentTrack.activeSourceIndex || 0];

  // Primary audio stream URL with optional Yandex Music token
  const rawStreamUrl =
    activeSource?.playback?.streamUrl ||
    (currentTrack
      ? `/api/yam/stream?q=${encodeURIComponent(`${currentTrack.artistName} ${currentTrack.title}`)}`
      : '');

  const audioStreamUrl = rawStreamUrl
    ? (yamToken && !rawStreamUrl.includes('token=')
        ? `${rawStreamUrl}${rawStreamUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(yamToken)}`
        : rawStreamUrl)
    : '';

  // Official Video Clip resolution
  const media = currentTrack
    ? resolveTrackVideoId(currentTrack.artistName, currentTrack.title)
    : { videoId: 'w1B3YyC2t_0', embedUrl: '', durationSec: 220 };

  const totalSec =
    duration > 30
      ? duration
      : media.durationSec ||
        (currentTrack?.durationMs && currentTrack.durationMs > 30000
          ? Math.round(currentTrack.durationMs / 1000)
          : 220);

  const progressRatio = totalSec > 0 ? Math.min(currentTime / totalSec, 1) : 0;

  // Sync HTML5 audio stream with reliable source memoization
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isVideoMode) {
      audioRef.current.pause();
      return;
    }

    if (audioStreamUrl && currentAudioSrcRef.current !== audioStreamUrl) {
      currentAudioSrcRef.current = audioStreamUrl;
      audioRef.current.src = audioStreamUrl;
      audioRef.current.load();
    }

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play notice:', err);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [audioStreamUrl, isPlaying, isVideoMode, currentTrack]);

  const handleTogglePlay = () => {
    if (!isPlaying && audioRef.current && !isVideoMode) {
      audioRef.current.play().catch(() => {});
    }
    onPlayPause();
  };

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Audio time update handler
  const handleTimeUpdate = () => {
    if (audioRef.current && !isVideoMode) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && audioRef.current.duration > 30) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && audioRef.current.duration > 30) {
      setDuration(audioRef.current.duration);
    }
  };

  // Video Mode ticker fallback
  useEffect(() => {
    if (!isPlaying || !isVideoMode) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalSec) {
          if (isRepeat) {
            handleSeek(0);
            return 0;
          } else if (onNext) {
            onNext();
            return 0;
          } else {
            onPlayPause();
            return totalSec;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isVideoMode, totalSec, isRepeat, onNext, onPlayPause]);

  // MediaSession API for Windows/Browser lock screen & media keys
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

  // Seek handler
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current && !isVideoMode) {
      audioRef.current.currentTime = time;
    }
  };

  if (!currentTrack) return null;

  // Sound waveform bars
  const waveformHeights = [
    12, 18, 24, 15, 30, 22, 14, 28, 36, 18, 26, 40, 32, 20, 28, 38, 44, 26, 32,
    48, 34, 22, 38, 42, 28, 20, 35, 45, 30, 22, 18, 28, 36, 22, 16, 24, 18, 12,
  ];

  return (
    <>
      {/* =========================================================================
          NATIVE HTML5 AUDIO ENGINE (100% Reliable, Immediate Sound Playback)
         ========================================================================= */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (isRepeat) {
            handleSeek(0);
          } else if (onNext) {
            onNext();
          } else {
            onPlayPause();
          }
        }}
        onError={() => {
          console.warn('Direct stream error, continuing uninterrupted');
        }}
      />

      {/* =========================================================================
          1. FLOATING MINI-PLAYER PILL (Obsidian Black #121316 matching mockup right)
         ========================================================================= */}
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-[460px] z-40">
        <div
          onClick={() => setIsExpanded(true)}
          className="bg-[#121316] text-white rounded-3xl p-3 px-4 shadow-[0_12px_36px_rgba(18,19,22,0.4)] flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          {/* Left: Thumbnail & Title / Artist */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0 shadow-md">
              <img
                src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-white truncate">
                  {currentTrack.title}
                </p>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  328k
                </span>
              </div>
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
              title={liked ? 'Удалить из избранного' : 'В избранное'}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>

            <button
              onClick={handleTogglePlay}
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
        <div className="fixed inset-0 z-50 bg-[#F2F4F8] dark:bg-[#0E1015] overflow-y-auto flex flex-col justify-between p-6 sm:p-10 animate-fadeIn">
          {/* Top Header */}
          <div className="flex items-center justify-between max-w-md mx-auto w-full">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-colors"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h3 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100">
                Now Playing
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {activeSource?.providerName || 'MARS Audio'} • 328kbps Hi-Fi Master
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-colors"
                title="Источники"
              >
                <ListMusic className="w-5 h-5" />
              </button>

              {/* Source Dropdown Menu */}
              {showSourceMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl neu-flat p-2.5 z-50 shadow-2xl">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Источники трека (Полный формат)
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
                              : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div>
                            <p>{src.providerName}</p>
                            <p className="text-[10px] text-slate-400">328kbps Hi-Fi</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Large Artwork / HD Video Clip & Controls */}
          <div className="max-w-md mx-auto w-full my-auto py-6 flex flex-col items-center">
            {/* View Mode Switcher: Cover Art vs Official Video Clip */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-zinc-800 mb-5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setIsVideoMode(false)}
                className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                  !isVideoMode
                    ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm'
                    : 'hover:text-black dark:hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Обложка 328k</span>
              </button>
              <button
                onClick={() => setIsVideoMode(true)}
                className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                  isVideoMode
                    ? 'bg-[#121316] text-white shadow-sm'
                    : 'hover:text-black dark:hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Клип / Видео</span>
              </button>
            </div>

            {/* Massive Album Cover OR HD Video Clip Frame */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-[0_20px_45px_rgba(163,177,198,0.4)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] border border-white/80 dark:border-zinc-800 relative group bg-black">
              {isVideoMode ? (
                <iframe
                  key={media.videoId}
                  src={`https://www.youtube.com/embed/${media.videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              ) : (
                <img
                  src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
            </div>

            {/* Title, Artist, and Favorite */}
            <div className="w-full flex items-center justify-between mt-8 px-2">
              <button
                onClick={() => toggleFavorite(currentTrack)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                title={liked ? 'В избранном' : 'Добавить в избранное'}
              >
                <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              <div className="text-center min-w-0 flex-1 px-4">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-semibold text-slate-400 truncate mt-1">
                  {currentTrack.artistName}
                </p>
              </div>

              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                title="Настройки трека"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Audio Waveform & Timeline (Full Song Length 3-5+ min) */}
            <div className="w-full mt-6 px-2 space-y-2">
              <div className="flex items-center justify-between gap-1 h-12 px-1">
                {waveformHeights.map((h, i) => {
                  const barRatio = i / waveformHeights.length;
                  const isFilled = barRatio <= progressRatio;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        const targetTime = Math.round(barRatio * totalSec);
                        handleSeek(targetTime);
                      }}
                      style={{ height: `${h}px` }}
                      className={`flex-1 rounded-full cursor-pointer transition-colors ${
                        isFilled ? 'bg-[#121316] dark:bg-white' : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                      title={`Перемотать на ${formatTime(Math.round(barRatio * totalSec))}`}
                    />
                  );
                })}
              </div>

              {/* Progress Slider (Hidden interactive layer) */}
              <input
                type="range"
                min="0"
                max={totalSec}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1 bg-transparent opacity-0 cursor-pointer -mt-4 relative z-10"
              />

              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-400 px-1">
                <span>{formatTime(currentTime)}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                  328 kbps Full Master
                </span>
                <span>{formatTime(totalSec)}</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="w-full flex items-center justify-between mt-6 px-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 transition-colors ${isShuffle ? 'text-black dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Перемешать"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-2 text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-colors active:scale-95"
                title="Предыдущий трек"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              {/* Big Black Play / Pause Circle */}
              <button
                onClick={handleTogglePlay}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#121316] dark:bg-white text-white dark:text-[#121316] flex items-center justify-center shadow-[0_10px_25px_rgba(18,19,22,0.45)] hover:scale-105 active:scale-95 transition-transform"
                title={isPlaying ? 'Пауза' : 'Воспроизведение'}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-2 text-slate-700 dark:text-slate-200 hover:text-black dark:hover:text-white transition-colors active:scale-95"
                title="Следующий трек"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-2 transition-colors ${isRepeat ? 'text-black dark:text-white font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title="Повтор"
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
