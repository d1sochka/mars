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
  Globe2,
  Compass,
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

  // World Charts / New Releases state
  const [activeTab, setActiveTab] = useState<'global' | 'ru' | 'rock' | 'electronic' | 'hiphop'>('global');
  const [chartTracks, setChartTracks] = useState<UnifiedTrack[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<UnifiedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load World Charts & New Releases
  const loadChart = async (type: string) => {
    try {
      setIsLoadingChart(true);
      const res = await fetch(`/api/charts?type=${type}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setChartTracks(data.tracks || []);
        if (data.tracks?.length > 0 && !currentTrack) {
          setCurrentTrack(data.tracks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load chart:', err);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    loadChart(activeTab);
  }, [activeTab]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=30`);
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
    const list = searchResults.length > 0 ? searchResults : chartTracks;
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % list.length;
    setCurrentTrack(list[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const list = searchResults.length > 0 ? searchResults : chartTracks;
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    setCurrentTrack(list[prevIndex]);
    setIsPlaying(true);
  };

  const activeTracksList = searchResults.length > 0 ? searchResults : chartTracks;

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Bar with Global Search & User Profile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Globe2 className="w-7 h-7 text-mars-red" />
              <span>MARS World Music</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-mars-red/20 text-mars-red border border-mars-red/30 uppercase tracking-widest font-mono">
              100M+ ТРЕКОВ
            </span>
          </div>
          <p className="text-mars-muted text-sm mt-1 flex items-center gap-2">
            <span>Все треки и мировые новинки в одном интерфейсе</span>
            <span className="text-mars-border">•</span>
            <span className="text-emerald-400 font-mono text-xs">{totalTracksInDb} треков в локальной базе</span>
          </p>
        </div>

        {/* Search Bar across all world tracks */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={handleSearch}
            className="relative flex-1 md:w-96 flex items-center"
          >
            <Search className="w-4 h-4 text-mars-muted absolute left-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск любых треков мира, артистов, альбомов..."
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

          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="p-2.5 rounded-xl bg-mars-surface hover:bg-mars-card border border-mars-border text-mars-muted hover:text-white transition-all flex-shrink-0"
            title="Синхронизировать базу с мировыми источниками"
          >
            <RefreshCw className={`w-4 h-4 text-mars-red ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

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

      {/* Featured Banner / Yandex Music Style Hero */}
      {!searchResults.length && chartTracks.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-mars-surface via-mars-card to-zinc-950 border border-mars-border p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mars-red/20 text-mars-red text-xs font-bold uppercase tracking-wider border border-mars-red/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Главная музыкальная новинка</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
              {chartTracks[0]?.title} — {chartTracks[0]?.artistName}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Слушайте мировой топ-релиз в студийном качестве с выбором источника воспроизведения (Apple Music, YouTube, SoundCloud).
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handlePlayTrack(chartTracks[0])}
                className="px-6 py-3 rounded-xl bg-mars-red text-white font-semibold text-sm flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all mars-glow shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Слушать прямо сейчас</span>
              </button>

              <button
                onClick={() => {
                  if (chartTracks.length > 1) handlePlayTrack(chartTracks[1]);
                }}
                className="px-4 py-3 rounded-xl bg-mars-surface hover:bg-mars-hover border border-mars-border text-xs text-slate-200 font-semibold flex items-center gap-2 transition-all"
              >
                <span>Следующий хит</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center relative w-48 h-48 md:w-60 md:h-60 flex-shrink-0">
            <div className="w-48 h-48 rounded-full bg-mars-red/20 blur-3xl absolute" />
            <img
              src={chartTracks[0]?.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
              alt={chartTracks[0]?.title}
              className="w-44 h-44 md:w-52 md:h-52 rounded-2xl object-cover shadow-2xl border border-mars-border relative z-10 transform hover:scale-105 transition-transform"
            />
          </div>
        </div>
      )}

      {/* Global Charts & New Releases Tabs (Yandex Music Style) */}
      {!searchResults.length && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-mars-border/60">
          {[
            { id: 'global', label: '🔥 Мировой топ-50' },
            { id: 'ru', label: '🇷🇺 Топ новинки' },
            { id: 'electronic', label: '⚡ Электроника' },
            { id: 'rock', label: '🎸 Рок & Альтернатива' },
            { id: 'hiphop', label: '🎤 Хип-Хоп' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-mars-red text-white shadow-lg shadow-mars-red/20'
                  : 'bg-mars-surface hover:bg-mars-card text-mars-muted hover:text-white border border-mars-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tracks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {searchResults.length > 0 ? (
              <>
                <TrendingUp className="w-5 h-5 text-mars-red" />
                <span>Результаты глобального поиска ({searchResults.length})</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 text-mars-red" />
                <span>Свежие мировые релизы и чарты</span>
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
              Вернуться к чартам
            </button>
          )}
        </div>

        {/* Tracks List */}
        {isLoadingChart && !searchResults.length ? (
          <div className="py-20 flex flex-col items-center justify-center text-mars-muted space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-mars-red" />
            <p className="text-sm">Загрузка мировых новинок...</p>
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
