import { prisma } from '@/lib/prisma';
import { UnifiedTrack } from '@/types/music';
import { JamendoProvider } from '@/lib/providers/jamendo';
import { SoundCloudProvider } from '@/lib/providers/soundcloud';
import { mergeTracks } from '@/lib/matching';

/**
 * Ensure supported providers are seeded in the DB
 */
export async function ensureDefaultProviders() {
  const providers = [
    { id: 'jamendo', name: 'Jamendo Music', priority: 10, authType: 'none' },
    { id: 'soundcloud', name: 'SoundCloud', priority: 8, authType: 'api_key' },
    { id: 'apple_music', name: 'Apple Music', priority: 6, authType: 'oauth2' },
    { id: 'youtube', name: 'YouTube', priority: 5, authType: 'api_key' },
  ];

  for (const prov of providers) {
    await prisma.provider.upsert({
      where: { id: prov.id },
      update: { name: prov.name, priority: prov.priority },
      create: prov,
    });
  }
}

/**
 * Ingest an array of unified tracks into the database, preserving sources and artists
 */
export async function ingestTracks(tracks: UnifiedTrack[]) {
  await ensureDefaultProviders();

  let addedCount = 0;
  let updatedCount = 0;

  for (const track of tracks) {
    try {
      // 1. Ensure artist exists
      let artistId: string | undefined = undefined;
      if (track.artistName) {
        let artist = await prisma.artist.findFirst({
          where: { name: track.artistName },
        });

        if (!artist) {
          artist = await prisma.artist.create({
            data: {
              name: track.artistName,
              avatarUrl: track.artworkUrl,
            },
          });
        }
        artistId = artist.id;
      }

      // 2. Find existing track by ISRC or by title + artist
      let dbTrack = track.isrc
        ? await prisma.track.findUnique({ where: { isrc: track.isrc } })
        : null;

      if (!dbTrack && artistId) {
        dbTrack = await prisma.track.findFirst({
          where: {
            title: track.title,
            artistId: artistId,
          },
        });
      }

      if (!dbTrack) {
        // Create new Track record
        dbTrack = await prisma.track.create({
          data: {
            title: track.title,
            artistId,
            durationMs: track.durationMs || 0,
            explicit: track.explicit || false,
            versionType: track.versionType || 'original',
            artworkUrl: track.artworkUrl,
            isrc: track.isrc || null,
          },
        });
        addedCount++;
      } else {
        // Update existing track with missing artwork or explicit flag
        await prisma.track.update({
          where: { id: dbTrack.id },
          data: {
            artworkUrl: dbTrack.artworkUrl || track.artworkUrl,
            explicit: dbTrack.explicit || track.explicit,
          },
        });
        updatedCount++;
      }

      // 3. Connect sources
      for (const src of track.sources) {
        await prisma.trackSource.upsert({
          where: {
            providerId_externalTrackId: {
              providerId: src.providerId,
              externalTrackId: src.externalTrackId,
            },
          },
          update: {
            streamUrl: src.playback.streamUrl || undefined,
            embedUrl: src.playback.embedUrl || undefined,
            externalUrl: src.playback.externalUrl || undefined,
            quality: src.quality || undefined,
            audioFormat: src.playback.audioFormat || undefined,
            isAvailable: true,
          },
          create: {
            trackId: dbTrack.id,
            providerId: src.providerId,
            externalTrackId: src.externalTrackId,
            streamUrl: src.playback.streamUrl,
            embedUrl: src.playback.embedUrl,
            externalUrl: src.playback.externalUrl,
            quality: src.quality,
            audioFormat: src.playback.audioFormat,
            metadata: src.sourceVersion ? JSON.stringify({ sourceVersion: src.sourceVersion }) : undefined,
            isAvailable: true,
          },
        });
      }
    } catch (err) {
      console.error(`Error ingesting track "${track.title}":`, err);
    }
  }

  const totalInDb = await prisma.track.count();
  return { addedCount, updatedCount, totalInDb };
}

/**
 * Synchronize latest / trending releases across providers into the database
 */
export async function syncLatestCatalog() {
  const jamendo = new JamendoProvider();
  const soundcloud = new SoundCloudProvider();

  const syncQueries = ['electronic', 'rock', 'synthwave', 'chillout', 'ambient', 'soundtrack'];
  const allTracks: UnifiedTrack[][] = [];

  for (const q of syncQueries) {
    try {
      const [jTracks, scTracks] = await Promise.all([
        jamendo.search(q, 15).catch(() => []),
        soundcloud.search(q, 15).catch(() => []),
      ]);
      allTracks.push(jTracks, scTracks);
    } catch (err) {
      console.warn(`Error querying provider for "${q}":`, err);
    }
  }

  const merged = mergeTracks(allTracks);
  const result = await ingestTracks(merged);
  return { ...result, totalProcessed: merged.length };
}
