import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

export const metadata: Metadata = {
  title: 'MARS — Multi-Platform Music',
  description: 'Персональная музыкальная платформа, объединяющая музыкальные каталоги со всего мира.',
  manifest: '/manifest.json',
  themeColor: '#F2F4F8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-[#F2F4F8] text-[#121316] min-h-screen antialiased">
        <AuthProvider>
          <FavoritesProvider>
            <main className="min-h-screen overflow-x-hidden">
              {children}
            </main>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
