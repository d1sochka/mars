import { UnifiedTrack, UnifiedTrackSource } from '@/types/music';

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // Remove (Explicit), (Official Audio), etc.
    .replace(/\[.*?\]/g, '') // Remove [Remastered], etc.
    .replace(/[^a-z0-9а-яё]/gi, '') // Remove punctuation and whitespace
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Simple token / length ratio
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;

  if (longerLength === 0) return 1.0;

  let editDistance = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) editDistance++;
  }
  editDistance += longerLength - shorter.length;

  return (longerLength - editDistance) / longerLength;
}

export function areTracksMatching(trackA: UnifiedTrack, trackB: UnifiedTrack): boolean {
  // 1. ISRC Check (exact match)
  if (trackA.isrc && trackB.isrc && trackA.isrc === trackB.isrc) {
    return true;
  }

  // 2. Artist & Title similarity
  const titleSim = calculateSimilarity(trackA.title, trackB.title);
  const artistSim = calculateSimilarity(trackA.artistName, trackB.artistName);

  if (titleSim > 0.8 && artistSim > 0.75) {
    // Also check duration tolerance (within 6 seconds)
    if (trackA.durationMs > 0 && trackB.durationMs > 0) {
      const diffSec = Math.abs(trackA.durationMs - trackB.durationMs) / 1000;
      if (diffSec <= 6) return true;
    } else {
      return true;
    }
  }

  return false;
}

/**
 * Merges track lists from multiple providers into a unified catalog with deduplication
 */
export function mergeTracks(trackLists: UnifiedTrack[][]): UnifiedTrack[] {
  const merged: UnifiedTrack[] = [];

  for (const list of trackLists) {
    for (const track of list) {
      const existing = merged.find((m) => areTracksMatching(m, track));

      if (existing) {
        // Merge sources, avoiding duplicate sources for same provider & external ID
        for (const src of track.sources) {
          const hasSrc = existing.sources.some(
            (s) => s.providerId === src.providerId && s.externalTrackId === src.externalTrackId
          );
          if (!hasSrc) {
            existing.sources.push(src);
          }
        }
        // Prefer explicit artwork or higher resolution artwork
        if (!existing.artworkUrl && track.artworkUrl) {
          existing.artworkUrl = track.artworkUrl;
        }
        // Prefer explicit flag if any source flags it explicit
        if (track.explicit) {
          existing.explicit = true;
        }
      } else {
        // Clone to avoid mutating original
        merged.push({
          ...track,
          sources: [...track.sources],
        });
      }
    }
  }

  return merged;
}
