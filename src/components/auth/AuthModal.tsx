'use client';

import React, { useState } from 'react';
import { X, Mail, Phone, Lock, User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+7 ');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? {
            type: authMethod,
            email: authMethod === 'email' ? email : undefined,
            phone: authMethod === 'phone' ? phone : undefined,
            password,
            name,
          }
        : {
            identifier: authMethod === 'email' ? email : phone,
            password,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка авторизации');
      }

      setSuccessMessage(isRegister ? 'Регистрация прошла успешно!' : 'Успешный вход!');
      setTimeout(() => {
        onSuccess(data.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Произошла непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-mars-surface border border-mars-border rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-mars-muted hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-mars-red to-orange-500 text-white font-bold text-2xl shadow-lg shadow-mars-red/20 mb-2">
            M
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? 'Регистрация в MARS' : 'Вход в аккаунт'}
          </h3>
          <p className="text-xs text-mars-muted">
            {isRegister
              ? 'Создайте аккаунт для синхронизации музыки и плейлистов'
              : 'Войдите по почте или номеру телефона'}
          </p>
        </div>

        {/* Auth Method Selector (Email vs Phone) */}
        <div className="grid grid-cols-2 gap-2 bg-mars-card p-1 rounded-xl border border-mars-border/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              authMethod === 'email'
                ? 'bg-mars-red text-white shadow-md'
                : 'text-mars-muted hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Почта</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              authMethod === 'phone'
                ? 'bg-mars-red text-white shadow-md'
                : 'text-mars-muted hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Телефон</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-mars-muted mb-1.5">
                Ваше имя
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-mars-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Александр"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-mars-card border border-mars-border text-sm text-white placeholder-mars-muted focus:outline-none focus:border-mars-red transition-all"
                />
              </div>
            </div>
          )}

          {authMethod === 'email' ? (
            <div>
              <label className="block text-xs font-medium text-mars-muted mb-1.5">
                Электронная почта
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-mars-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-mars-card border border-mars-border text-sm text-white placeholder-mars-muted focus:outline-none focus:border-mars-red transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-mars-muted mb-1.5">
                Номер телефона
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-mars-muted absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-mars-card border border-mars-border text-sm text-white placeholder-mars-muted focus:outline-none focus:border-mars-red transition-all font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-mars-muted mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-mars-muted absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-mars-card border border-mars-border text-sm text-white placeholder-mars-muted focus:outline-none focus:border-mars-red transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-mars-red hover:bg-orange-600 text-white font-semibold text-sm transition-all mars-glow shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              'Зарегистрироваться'
            ) : (
              'Войти в аккаунт'
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center pt-2 border-t border-mars-border/60">
          <p className="text-xs text-mars-muted">
            {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-mars-red hover:underline font-semibold ml-1"
            >
              {isRegister ? 'Войти' : 'Создать аккаунт'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
