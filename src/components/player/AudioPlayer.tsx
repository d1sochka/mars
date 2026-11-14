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
  Volume2,
  Film,
  Music,
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
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = currentTrack ? (isFavorite(currentTrack.id) || isFavorite(currentTrack.title)) : false;

  const activeSource: UnifiedTrackSource | undefined =
    currentTrack?.sources[currentTrack.activeSourceIndex || 0];

  const streamUrl = activeSource?.playback?.streamUrl;

  // Calculate full standard duration (average 3:35 if metadata is short/empty)
  const totalSec =
    currentTrack?.durationMs && currentTrack.durationMs > 30000
      ? Math.round(currentTrack.durationMs / 1000)
      : 215;

  const progressRatio = totalSec > 0 ? Math.min(currentTime / totalSec, 1) : 0;

  // Reset timer on new track
  useEffect(() => {
    setCurrentTime(0);
  }, [currentTrack?.id]);

  // Command sender to YouTube engine
  const sendYtCommand = (func: string, args: any[] = []) => {
    if (ytIframeRef.current?.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  // Sync play/pause with YouTube engine and HTML audio
  useEffect(() => {
    if (!currentTrack) return;

    if (streamUrl && audioRef.current) {
      if (audioRef.current.src !== streamUrl) {
        audioRef.current.src = streamUrl;
        audioRef.current.load();
      }
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    } else {
      if (isPlaying) {
        sendYtCommand('playVideo');
      } else {
        sendYtCommand('pauseVideo');
      }
    }
  }, [currentTrack, isPlaying, streamUrl]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    sendYtCommand('setVolume', [Math.round(volume * 100)]);
  }, [volume]);

  // Full-track continuous playback timer ticker
  useEffect(() => {
    if (!isPlaying) return;

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
  }, [isPlaying, totalSec, isRepeat, onNext, onPlayPause]);

  // MediaSession API for OS integration (lock screen, keyboard media keys)
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
    if (audioRef.current && streamUrl) {
      audioRef.current.currentTime = time;
    }
    sendYtCommand('seekTo', [time, true]);
  };

  if (!currentTrack) return null;

  // Waveform bars simulation matching mockup
  const waveformHeights = [
    12, 18, 24, 15, 30, 22, 14, 28, 36, 18, 26, 40, 32, 20, 28, 38, 44, 26, 32,
    48, 34, 22, 38, 42, 28, 20, 35, 45, 30, 22, 18, 28, 36, 22, 16, 24, 18, 12,
  ];

  return (
    <>
      {/* HTML5 audio element for direct stream sources */}
      {streamUrl && (
        <audio
          ref={audioRef}
          preload="auto"
          onEnded={() => {
            if (isRepeat) {
              handleSeek(0);
            } else if (onNext) {
              onNext();
            } else {
              onPlayPause();
            }
          }}
        />
      )}

      {/* =========================================================================
          PERSISTENT FULL-TRACK AUDIO/VIDEO ENGINE (Runs uninterrupted)
         ========================================================================= */}
      <div
        className={`transition-all duration-300 ${
          isVideoMode && isExpanded
            ? 'fixed z-[60] top-28 left-1/2 -translate-x-1/2 w-[340px] h-[260px] sm:w-[400px] sm:h-[300px] rounded-3xl overflow-hidden shadow-2xl bg-black border border-zinc-800'
            : 'fixed bottom-1 right-1 w-10 h-10 opacity-5 pointer-events-none -z-50 overflow-hidden'
        }`}
      >
        <iframe
          ref={ytIframeRef}
          key={currentTrack.id}
          src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
            `${currentTrack.artistName} - ${currentTrack.title}`
          )}&autoplay=1&enablejsapi=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="w-full h-full border-none"
        />
      </div>

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
              className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h3 className="font-bold text-sm tracking-wide text-slate-800">
                Now Playing
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {activeSource?.providerName || 'MARS Audio'} • 328kbps Hi-Fi Master
              </p>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
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
                              : 'hover:bg-slate-100 text-slate-700'
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

          {/* Center: Large Artwork & Controls */}
          <div className="max-w-md mx-auto w-full my-auto py-6 flex flex-col items-center">
            {/* View Mode Switcher (Cover Art vs Music Video) */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 mb-5 text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setIsVideoMode(false)}
                className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                  !isVideoMode ? 'bg-white text-black shadow-sm' : 'hover:text-black'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Обложка 328k</span>
              </button>
              <button
                onClick={() => setIsVideoMode(true)}
                className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                  isVideoMode ? 'bg-[#121316] text-white shadow-sm' : 'hover:text-black'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Клип / Видео</span>
              </button>
            </div>

            {/* Massive Album Cover (or placeholder for video mode) */}
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-[0_20px_45px_rgba(163,177,198,0.4)] border border-white relative group">
              <img
                src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
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
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-semibold text-slate-400 truncate mt-1">
                  {currentTrack.artistName}
                </p>
              </div>

              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-black transition-colors"
                title="Настройки трека"
              >
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Audio Waveform & Timeline (Full Song Length) */}
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
                        isFilled ? 'bg-[#121316]' : 'bg-slate-300'
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
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  328 kbps Full Master
                </span>
                <span>{formatTime(totalSec)}</span>
              </div>
            </div>

            {/* Controls Row */}
            <div className="w-full flex items-center justify-between mt-6 px-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 transition-colors ${isShuffle ? 'text-black font-bold' : 'text-slate-400 hover:text-slate-700'}`}
                title="Перемешать"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-2 text-slate-700 hover:text-black transition-colors active:scale-95"
                title="Предыдущий трек"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              {/* Big Black Play / Pause Circle */}
              <button
                onClick={onPlayPause}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#121316] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(18,19,22,0.45)] hover:scale-105 active:scale-95 transition-transform"
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
                className="p-2 text-slate-700 hover:text-black transition-colors active:scale-95"
                title="Следующий трек"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-2 transition-colors ${isRepeat ? 'text-black font-bold' : 'text-slate-400 hover:text-slate-700'}`}
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