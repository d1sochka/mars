import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/navigation/Sidebar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'MARS — Multi-Platform Music Aggregator',
  description: 'Персональная музыкальная платформа, объединяющая музыкальные каталоги и способы воспроизведения в одном интерфейсе.',
  manifest: '/manifest.json',
  themeColor: '#090A0F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-mars-dark text-slate-100 flex min-h-screen antialiased">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-screen overflow-y-auto pb-28">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
