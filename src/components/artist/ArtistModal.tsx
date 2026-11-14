'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Shuffle, Heart, Music, Check, UserPlus } from 'lucide-react';
import { UnifiedTrack } from '@/types/music';
import { TrackRow } from '@/components/track/TrackRow';

export interface ArtistData {
  id: string;
  name: string;
  avatarUrl: string;
  genre: string;
  listeners: string;
  bio?: string;
  headerUrl?: string;
}

interface ArtistModalProps {
  artist: ArtistData | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: UnifiedTrack) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
}

export function ArtistModal({
  artist,
  isOpen,
  onClose,
  onPlayTrack,
  currentTrackId,
  isPlaying,
}: ArtistModalProps) {
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    if (!artist || !isOpen) return;

    async function loadArtistTracks() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(artist!.name)}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          setTracks(data.tracks || []);
        }
      } catch (err) {
        console.error('Failed to load artist tracks:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadArtistTracks();
  }, [artist, isOpen]);

  if (!isOpen || !artist) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F2F4F8] overflow-y-auto animate-fadeIn pb-32">
      <div className="max-w-2xl mx-auto w-full px-5 py-6 space-y-6">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl neu-btn flex items-center justify-center text-slate-700 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm text-slate-800">Карточка артиста</span>
          <div className="w-11" />
        </div>

        {/* Artist Header / Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2 text-center sm:text-left">
          <div className="w-36 h-36 rounded-3xl overflow-hidden shadow-[0_12px_30px_rgba(163,177,198,0.45)] border border-white flex-shrink-0">
            <img
              src={artist.avatarUrl}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2 flex-1">
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
              {artist.genre}
            </div>
            <h1 className="text-3xl font-black text-slate-900">{artist.name}</h1>
            <p className="text-xs font-semibold text-slate-400">
              {artist.listeners} слушателей за месяц
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                onClick={() => setIsFollowed(!isFollowed)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isFollowed
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-[#121316] text-white shadow-md hover:bg-black'
                }`}
              >
                {isFollowed ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{isFollowed ? 'В подписках' : 'Подписаться'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Play All & Shuffle */}
        {tracks.length > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => onPlayTrack(tracks[0])}
              className="py-3.5 px-6 rounded-2xl bg-[#121316] text-white font-bold text-sm shadow-md hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Слушать все</span>
            </button>

            <button
              onClick={() => {
                const randomIdx = Math.floor(Math.random() * tracks.length);
                onPlayTrack(tracks[randomIdx]);
              }}
              className="py-3.5 px-6 rounded-2xl neu-flat text-slate-800 font-bold text-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>Перемешать</span>
            </button>
          </div>
        )}

        {/* Top Tracks */}
        <div className="space-y-2 pt-4">
          <h3 className="font-extrabold text-lg text-slate-900">Популярные треки</h3>
          <div className="space-y-1">
            {isLoading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Загрузка композиций...</p>
            ) : tracks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Нет доступных треков</p>
            ) : (
              tracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  isCurrent={currentTrackId === track.id}
                  isPlaying={!!isPlaying}
                  onPlay={() => onPlayTrack(track)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
