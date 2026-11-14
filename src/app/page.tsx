'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Shuffle,
  ChevronLeft,
  Share2,
  Download,
  MoreHorizontal,
  Home,
  Flame,
  Bookmark,
  Library,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { UnifiedTrack } from '@/types/music';
import { TrackRow } from '@/components/track/TrackRow';
import { AudioPlayer } from '@/components/player/AudioPlayer';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, openAuthModal, triggerSync, isSyncing } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedTrack[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Active Tab: 'yam' (Яндекс Музыка), 'new' (Новинки), 'rock', 'electronic', 'hiphop'
  const [activeTab, setActiveTab] = useState<'yam' | 'new' | 'rock' | 'electronic' | 'hiphop'>('yam');
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<UnifiedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Bottom Navigation state: 'home' | 'search' | 'library' | 'hotlist'
  const [bottomNav, setBottomNav] = useState<'home' | 'search' | 'library' | 'hotlist'>('home');

  const loadFeed = async (type: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/charts?type=${type}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
        if (data.tracks?.length > 0 && !currentTrack) {
          setCurrentTrack(data.tracks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(activeTab);
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
      console.error('Search error:', err);
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
    const list = searchResults.length > 0 ? searchResults : tracks;
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % list.length;
    setCurrentTrack(list[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const list = searchResults.length > 0 ? searchResults : tracks;
    if (!list.length || !currentTrack) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    setCurrentTrack(list[prevIndex]);
    setIsPlaying(true);
  };

  const activeList = searchResults.length > 0 ? searchResults : tracks;
  const featured = activeList[0];

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-[#121316] pb-32 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full px-5 py-6 space-y-6">
        {/* =========================================================================
            TOP BAR: Back arrow on left, Title in center, Search & Profile on right
           ========================================================================= */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => {
              setSearchResults([]);
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              MARS Music
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#121316] text-white">
              YAM API
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="w-10 h-10 rounded-2xl bg-[#121316] text-white text-xs font-bold flex items-center justify-center shadow-md">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="w-10 h-10 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black"
                title="Войти"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Search Bar Input (Animated / Expandable) */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="animate-fadeIn">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по Яндекс Музыке, Apple Music, трекам мира..."
                className="w-full pl-11 pr-24 py-3 rounded-2xl neu-input text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-[#121316] text-white text-xs font-bold hover:bg-black transition-colors"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Найти'}
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            ALBUM / FEATURED HEADER (Exact design matching Mockup Right Phone!)
           ========================================================================= */}
        {!searchResults.length && featured && (
          <div className="flex items-start gap-5 pt-2">
            {/* Square Rounded Artwork */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-[0_12px_28px_rgba(163,177,198,0.4)] border border-white flex-shrink-0">
              <img
                src={featured.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'}
                alt={featured.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Album Info & Action Icons */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Хит недели • 2026
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
                {featured.title}
              </h1>
              <p className="text-sm font-semibold text-slate-400 truncate">
                {featured.artistName}
              </p>

              {/* Action Icons Pill: Share, Download, More (from mockup) */}
              <div className="flex items-center gap-2 pt-2 text-slate-700">
                <button
                  onClick={triggerSync}
                  className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
                  title="Синхронизировать каталог"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-black' : ''}`} />
                </button>
                <button className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Поделиться">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Сохранить">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors" title="Еще">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BIG ACTION BUTTONS: ▶ Play & 🔀 Shuffle (Exact from Mockup)
           ========================================================================= */}
        {!searchResults.length && featured && (
          <div className="grid grid-cols-2 gap-4 pt-1">
            <button
              onClick={() => handlePlayTrack(featured)}
              className="py-3.5 px-6 rounded-2xl bg-[#121316] text-white font-bold text-sm shadow-[0_8px_20px_rgba(18,19,22,0.35)] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={() => {
                if (tracks.length > 1) {
                  const randomIdx = Math.floor(Math.random() * tracks.length);
                  handlePlayTrack(tracks[randomIdx]);
                }
              }}
              className="py-3.5 px-6 rounded-2xl neu-flat text-slate-800 font-bold text-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        )}

        {/* Genre / Source Filter Pills */}
        {!searchResults.length && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2">
            {[
              { id: 'yam', label: '🔥 Яндекс Топ' },
              { id: 'new', label: '✨ Новинки' },
              { id: 'rock', label: '🎸 Рок' },
              { id: 'electronic', label: '⚡ Электроника' },
              { id: 'hiphop', label: '🎤 Рэп' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#121316] text-white shadow-md'
                    : 'neu-btn text-slate-600 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* =========================================================================
            TRACKLIST (Exact matching mockup tracklist rows!)
           ========================================================================= */}
        <div className="space-y-1 pt-2">
          {isLoading && !searchResults.length ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#121316]" />
              <p className="text-sm font-semibold">Загрузка музыки...</p>
            </div>
          ) : activeList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 neu-card rounded-3xl p-8">
              <p className="text-slate-800 font-bold">Ничего не найдено</p>
              <p className="text-xs mt-1">Попробуйте ввести другой поисковый запрос</p>
            </div>
          ) : (
            activeList.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                onPlay={() => handlePlayTrack(track)}
                onSelectSource={handleSelectSource}
              />
            ))
          )}
        </div>
      </div>

      {/* =========================================================================
          PERSISTENT AUDIO PLAYER (Floating black pill + Expanded Now Playing)
         ========================================================================= */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={handleNext}
        onPrev={handlePrev}
        onSelectSource={handleSelectSource}
      />

      {/* =========================================================================
          BOTTOM DOCK NAVIGATION BAR (Exact matching Mockup Bottom Bar!)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#F2F4F8]/90 backdrop-blur-lg border-t border-slate-200/60 px-8 flex items-center justify-around z-30 max-w-2xl mx-auto">
        <button
          onClick={() => {
            setBottomNav('home');
            setSearchResults([]);
            setIsSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'home' ? 'text-[#121316] font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => {
            setBottomNav('search');
            setIsSearchOpen(true);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'search' ? 'text-[#121316] font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Search</span>
        </button>

        <button
          onClick={() => setBottomNav('library')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'library' ? 'text-[#121316] font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px]">Library</span>
        </button>

        <button
          onClick={() => {
            setBottomNav('hotlist');
            setActiveTab('yam');
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            bottomNav === 'hotlist' ? 'text-[#121316] font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px]">Hotlist</span>
        </button>
      </nav>
    </div>
  );
}
