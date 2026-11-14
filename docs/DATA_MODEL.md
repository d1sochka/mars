# Модель данных MARS (Prisma Schema)

Модель разработана для PostgreSQL и Prisma ORM в соответствии с разделом 6 ТЗ.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Пользователи
model User {
  id            String             @id @default(cuid())
  email         String             @unique
  name          String?
  avatarUrl     String?
  passwordHash  String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  providerAccounts ProviderAccount[]
  playlists        Playlist[]
  favorites        Favorite[]
  history          ListeningHistory[]
  settings         UserSettings?

  @@map("users")
}

// 2. Музыкальные провайдеры (Jamendo, SoundCloud, Apple Music, YouTube и т.д.)
model Provider {
  id          String   @id // 'jamendo' | 'soundcloud' | 'apple_music' | 'youtube' | 'spotify'
  name        String
  isEnabled   Boolean  @default(true)
  priority    Int      @default(0) // Приоритет выбора источника по умолчанию
  authType    String   // 'none' | 'api_key' | 'oauth2'
  createdAt   DateTime @default(now())

  sources     TrackSource[]
  accounts    ProviderAccount[]

  @@map("providers")
}

// 3. Аккаунты провайдеров (OAuth токены пользователя для сервисов)
model ProviderAccount {
  id           String    @id @default(cuid())
  userId       String
  providerId   String
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  profileData  Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider     Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([userId, providerId])
  @@map("provider_accounts")
}

// 4. Композиции (Канонические записи треков)
model Track {
  id             String        @id @default(cuid())
  isrc           String?       @unique // Международный стандартный номер аудиозаписи
  title          String
  artistId       String?
  albumId        String?
  durationMs     Int           @default(0)
  explicit       Boolean       @default(false)
  versionType    String        @default("original") // 'original' | 'remix' | 'live' | 'acoustic' | 'instrumental'
  sourceVersion  String?
  artworkUrl     String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  artist         Artist?       @relation(fields: [artistId], references: [id], onDelete: SetNull)
  album          Album?        @relation(fields: [albumId], references: [id], onDelete: SetNull)
  sources        TrackSource[]
  playlistTracks PlaylistTrack[]
  favorites      Favorite[]
  history        ListeningHistory[]

  @@index([title])
  @@index([isrc])
  @@map("tracks")
}

// 5. Источники композиций (Связи с конкретными внешними платформами)
model TrackSource {
  id              String   @id @default(cuid())
  trackId         String
  providerId      String
  externalTrackId String   // ID трека в стороннем сервисе (напр., ID в Jamendo или SoundCloud)
  streamUrl       String?  // Прямой URL потока (если доступен)
  embedUrl        String?  // URL для iframe / виджета
  externalUrl     String?  // Ссылка на трек на платформе
  quality         String?  // '128k', '320k', 'lossless'
  audioFormat     String?  // 'mp3', 'aac', 'flac', 'opus'
  isAvailable     Boolean  @default(true)
  metadata        Json?    // Сырые метаданные от провайдера
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  track           Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  provider        Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([providerId, externalTrackId])
  @@index([trackId])
  @@map("track_sources")
}

// 6. Исполнители
model Artist {
  id          String   @id @default(cuid())
  name        String
  bio         String?
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tracks      Track[]
  albums      Album[]

  @@index([name])
  @@map("artists")
}

// 7. Альбомы
model Album {
  id          String    @id @default(cuid())
  title       String
  artistId    String?
  coverUrl    String?
  releaseDate DateTime?
  totalTracks Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  artist      Artist?   @relation(fields: [artistId], references: [id], onDelete: SetNull)
  tracks      Track[]

  @@index([title])
  @@map("albums")
}

// 8. Плейлисты
model Playlist {
  id          String          @id @default(cuid())
  userId      String
  title       String
  description String?
  coverUrl    String?
  isPublic    Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks      PlaylistTrack[]

  @@map("playlists")
}

// 9. Треки в плейлистах
model PlaylistTrack {
  id         String   @id @default(cuid())
  playlistId String
  trackId    String
  position   Int      @default(0)
  addedAt    DateTime @default(now())

  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  track      Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@unique([playlistId, trackId])
  @@index([playlistId, position])
  @@map("playlist_tracks")
}

// 10. Избранное
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  trackId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  track     Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@unique([userId, trackId])
  @@index([userId])
  @@map("favorites")
}

// 11. История прослушиваний
model ListeningHistory {
  id            String   @id @default(cuid())
  userId        String
  trackId       String
  sourceUsedId  String?  // ID конкретного TrackSource, который играл
  listenedAt    DateTime @default(now())
  durationSec   Int      @default(0)
  completed     Boolean  @default(false)

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  track         Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)

  @@index([userId, listenedAt])
  @@map("listening_history")
}

// 12. Пользовательские настройки
model UserSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  preferredProviderId   String?  // Предпочитаемый источник по умолчанию
  preferExplicit        Boolean  @default(true) // Раздел 7 ТЗ: отдавать предпочтение Explicit
  audioQuality          String   @default("high") // 'low' | 'medium' | 'high'
  theme                 String   @default("dark") // 'dark' (Dark / Premium)
  autoPlaySimilar       Boolean  @default(false)
  deviceSyncEnabled     Boolean  @default(true)
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```
