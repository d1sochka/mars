'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  Disc3,
  Heart,
  ListMusic,
  History,
  Settings,
  ShieldCheck,
  RefreshCw,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Sidebar() {
  const { user, openAuthModal, logout, triggerSync, isSyncing, totalTracksInDb } = useAuth();

  return (
    <aside className="w-64 bg-mars-surface border-r border-mars-border flex flex-col justify-between p-5 min-h-screen hidden md:flex flex-shrink-0">
      <div className="space-y-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-mars-red to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-mars-red/20">
            M
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">MARS</h1>
            <p className="text-[10px] tracking-widest uppercase text-mars-muted font-mono">
              Aggregator v1.1
            </p>
          </div>
        </Link>

        {/* User Profile / Auth Status */}
        <div className="bg-mars-card/70 border border-mars-border/80 rounded-xl p-3">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-mars-red/40 to-orange-500/30 border border-mars-red/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.name || 'Пользователь'}
                  </p>
                  <p className="text-[10px] text-mars-muted truncate font-mono">
                    {user.email || user.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-mars-muted hover:text-mars-red p-1 transition-colors"
                title="Выйти"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="w-full py-2 px-3 rounded-lg bg-mars-red/20 hover:bg-mars-red text-mars-red hover:text-white border border-mars-red/40 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Войти / Регистрация</span>
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-mars-muted uppercase tracking-wider px-3 mb-2">
            Каталог
          </p>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-mars-red/15 text-white font-medium text-sm border border-mars-red/30 transition-all"
          >
            <Compass className="w-4 h-4 text-mars-red" />
            <span>Главная</span>
          </Link>
          <Link
            href="#search"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-mars-muted hover:text-white hover:bg-mars-card font-medium text-sm transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Единый поиск</span>
          </Link>
          <Link
            href="#discover"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-mars-muted hover:text-white hover:bg-mars-card font-medium text-sm transition-all"
          >
            <Disc3 className="w-4 h-4" />
            <span>Каталог треков</span>
          </Link>
        </div>

        {/* Auto Sync & Catalog Status */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-mars-muted uppercase tracking-wider px-3 flex items-center justify-between">
            <span>Авто-добавление</span>
            <Sparkles className="w-3.5 h-3.5 text-mars-red" />
          </p>
          <div className="bg-mars-card/60 rounded-xl p-3 border border-mars-border/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-mars-muted">Треков в базе:</span>
              <span className="font-mono text-white font-bold">
                {totalTracksInDb}
              </span>
            </div>
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="w-full py-1.5 px-2 rounded-lg bg-mars-surface hover:bg-mars-hover border border-mars-border text-[11px] text-slate-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              title="Запустить синхронизацию новых релизов из Jamendo и SoundCloud"
            >
              <RefreshCw className={`w-3 h-3 text-mars-red ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Синхронизация...' : 'Обновить каталог'}</span>
            </button>
          </div>
        </div>

        {/* Connected Sources Status */}
        <div className="pt-1">
          <p className="text-[11px] font-semibold text-mars-muted uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>Источники</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </p>
          <div className="bg-mars-card/60 rounded-xl p-3 border border-mars-border/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Jamendo Music
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">320k Audio</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                SoundCloud
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Widget</span>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                Apple Music
              </span>
              <span className="text-[10px] text-slate-500 font-mono">MusicKit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Footer */}
      <div className="pt-4 border-t border-mars-border">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-mars-muted hover:text-white hover:bg-mars-card w-full text-sm transition-all">
          <Settings className="w-4 h-4" />
          <span>Настройки источников</span>
        </button>
      </div>
    </aside>
  );
}
