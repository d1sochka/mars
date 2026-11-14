'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Radio,
  Play,
  Layers,
  Flame,
  Music2,
  TrendingUp,
  Disc3,
  Loader2,
  User,
  RefreshCw,
} from 'lucide-react';
import { UnifiedTrack } from '@/types/music';
import { TrackRow } from '@/components/track/TrackRow';
import { AudioPlayer } from '@/components/player/AudioPlayer';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, openAuthModal, triggerSync, isSyncing, totalTracksInDb } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedTrack[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<UnifiedTrack[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<UnifiedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch initial featured tracks from catalog on mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        setIsLoadingFeatured(true);
        const res = await fetch('/api/search?q=rock&limit=10');
        if (res.ok) {
          const data = await res.json();
          setFeaturedTracks(data.tracks || []);
          if (data.tracks?.length > 0 && !currentTrack) {
            setCurrentTrack(data.tracks[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load featured tracks:', err);
      } finally {
        setIsLoadingFeatured(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tracks || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = (track: UnifiedTrack) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleSelectSource = (sourceIndex: number) => {
    if (!currentTrack) return;
    setCurrentTrack({
      ...currentTrack,
      activeSourceIndex: sourceIndex,
    });
  };

  const handleNext = () => {
    const list = searchResults.length > 0 ? searchResults : featuredTracks;
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % list.length;
    setCurrentTrack(list[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const list = searchResults.length > 0 ? searchResults : featuredTracks;
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    setCurrentTrack(list[prevIndex]);
    setIsPlaying(true);
  };

  const activeTracksList = searchResults.length > 0 ? searchResults : featuredTracks;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Bar with Unified Search & Quick Auth / Sync */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Объединённый каталог
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-mars-red/20 text-mars-red border border-mars-red/30 uppercase tracking-widest font-mono">
              Live MVP
            </span>
          </div>
          <p className="text-mars-muted text-sm mt-1 flex items-center gap-2">
            <span>Автоматическое добавление треков и единый поиск</span>
            <span className="text-mars-border">•</span>
            <span className="text-emerald-400 font-mono text-xs">{totalTracksInDb} треков в базе</span>
          </p>
        </div>

        {/* Right side: Search Bar & Mobile Auth Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={handleSearch}
            className="relative flex-1 md:w-80 flex items-center"
          >
            <Search className="w-4 h-4 text-mars-muted absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по исполнителю, треку или ISRC..."
              className="w-full pl-11 pr-24 py-2.5 rounded-xl bg-mars-surface border border-mars-border text-sm text-white placeholder-mars-muted focus:outline-none focus:border-mars-red transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 px-3 py-1 rounded-lg bg-mars-red text-white text-xs font-semibold hover:bg-orange-600 transition-colors flex items-center gap-1.5"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Найти'
              )}
            </button>
          </form>

          {/* Quick sync button in top bar */}
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="p-2.5 rounded-xl bg-mars-surface hover:bg-mars-card border border-mars-border text-mars-muted hover:text-white transition-all flex-shrink-0"
            title="Автоматически добавить новые треки в базу данных"
          >
            <RefreshCw className={`w-4 h-4 text-mars-red ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Mobile Auth button */}
          {!user && (
            <button
              onClick={openAuthModal}
              className="md:hidden px-3 py-2 rounded-xl bg-mars-red text-white text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>Войти</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured Banner / Hero */}
      {!searchResults.length && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-mars-surface via-mars-card to-zinc-900 border border-mars-border p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mars-red/20 text-mars-red text-xs font-bold uppercase tracking-wider border border-mars-red/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MARS Ingestion Engine</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              Все новые релизы автоматически сохраняются на платформе
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Музыкальные каталоги Jamendo и SoundCloud сканируются и сохраняются в единую базу. При поиске новые треки моментально пополняют медиатеку.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (featuredTracks.length > 0) {
                    handlePlayTrack(featuredTracks[0]);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-mars-red text-white font-semibold text-sm flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all mars-glow shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Включить подборку</span>
              </button>

              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="px-4 py-3 rounded-xl bg-mars-surface hover:bg-mars-hover border border-mars-border text-xs text-slate-200 font-semibold flex items-center gap-2 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-mars-red ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Синхронизация...' : 'Сканировать новые треки'}</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center relative w-64 h-64">
            <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-mars-red/30 to-orange-500/10 blur-2xl absolute" />
            <div className="w-40 h-40 rounded-2xl bg-mars-card border border-mars-border/80 p-4 shadow-2xl flex flex-col items-center justify-center text-center space-y-2 relative transform rotate-6 hover:rotate-0 transition-transform">
              <Layers className="w-10 h-10 text-mars-red animate-pulse" />
              <p className="text-white font-bold text-sm">Auto-Ingestion</p>
              <p className="text-[11px] text-emerald-400 font-mono">DB Sync Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Genre / Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['Electronic', 'Rock', 'Chillout', 'Hip-Hop', 'Instrumental', 'Classical', 'Jazz', 'Ambient'].map(
          (genre) => (
            <button
              key={genre}
              onClick={() => {
                setSearchQuery(genre);
                fetch(`/api/search?q=${encodeURIComponent(genre)}&limit=25`)
                  .then((r) => r.json())
                  .then((data) => setSearchResults(data.tracks || []));
              }}
              className="px-4 py-2 rounded-xl bg-mars-surface hover:bg-mars-card text-xs font-medium text-slate-300 hover:text-white border border-mars-border hover:border-mars-red/40 transition-all flex-shrink-0"
            >
              {genre}
            </button>
          )
        )}
      </div>

      {/* Tracks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {searchResults.length > 0 ? (
              <>
                <TrendingUp className="w-5 h-5 text-mars-red" />
                <span>Результаты поиска ({searchResults.length})</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 text-mars-red" />
                <span>Популярные композиции (База MARS)</span>
              </>
            )}
          </h3>

          {searchResults.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-xs text-mars-red hover:underline"
            >
              Сбросить поиск
            </button>
          )}
        </div>

        {/* Tracks List */}
        {isLoadingFeatured && !searchResults.length ? (
          <div className="py-20 flex flex-col items-center justify-center text-mars-muted space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-mars-red" />
            <p className="text-sm">Загрузка каталога MARS...</p>
          </div>
        ) : activeTracksList.length === 0 ? (
          <div className="py-16 text-center text-mars-muted bg-mars-surface/50 rounded-2xl border border-mars-border p-8">
            <Music2 className="w-12 h-12 text-mars-muted/40 mx-auto mb-3" />
            <p className="text-white font-medium">Ничего не найдено</p>
            <p className="text-xs mt-1">Попробуйте ввести другой поисковый запрос</p>
          </div>
        ) : (
          <div className="bg-mars-card/40 rounded-2xl border border-mars-border p-3 space-y-1">
            {activeTracksList.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                onPlay={() => handlePlayTrack(track)}
                onSelectSource={handleSelectSource}
              />
            ))}
          </div>
        )}
      </div>

      {/* Persistent Audio Player */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectSource={handleSelectSource}
      />
    </div>
  );
}
