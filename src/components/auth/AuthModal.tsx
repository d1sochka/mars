'use client';

import React, { useState } from 'react';
import { X, Mail, Phone, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';

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
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#F2F4F8] border border-white/80 rounded-3xl shadow-[0_20px_50px_rgba(163,177,198,0.5)] p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl neu-btn flex items-center justify-center text-slate-500 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#121316] text-white font-black text-xl shadow-md mb-2">
            M
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRegister ? 'Регистрация в MARS' : 'Вход в аккаунт'}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            {isRegister
              ? 'Создайте аккаунт для синхронизации музыки и избранного'
              : 'Войдите по почте или номеру телефона'}
          </p>
        </div>

        {/* Auth Method Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl neu-input text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              authMethod === 'email'
                ? 'bg-[#121316] text-white shadow-md'
                : 'text-slate-500 hover:text-black'
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
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              authMethod === 'phone'
                ? 'bg-[#121316] text-white shadow-md'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Телефон</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-100 border border-red-200 text-red-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Ваше имя
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Александр"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {authMethod === 'email' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Электронная почта
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Номер телефона
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Пароль
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-input text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-[#121316] hover:bg-black text-white font-bold text-sm shadow-[0_8px_20px_rgba(18,19,22,0.35)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
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
        <div className="text-center pt-2 border-t border-slate-200/80">
          <p className="text-xs text-slate-500">
            {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-[#121316] font-bold hover:underline ml-1"
            >
              {isRegister ? 'Войти' : 'Создать аккаунт'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
