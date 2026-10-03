const FAVORITES_STORAGE_KEY = 'asukaimmo_saved_favorites_v1';
const LIKES_DELTA_KEY = 'asukaimmo_likes_delta_v1';

export function getSavedFavoriteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isListingFavorite(listingId: string): boolean {
  const favorites = getSavedFavoriteIds();
  return favorites.includes(listingId);
}

/**
 * Toggles favorite state in localStorage and returns the new favorite status and likes delta
 */
export function toggleFavorite(listingId: string): { isFavorite: boolean; delta: number } {
  if (typeof window === 'undefined') return { isFavorite: false, delta: 0 };

  const currentFavorites = getSavedFavoriteIds();
  const exists = currentFavorites.includes(listingId);
  let updatedFavorites: string[];
  let delta: number;

  if (exists) {
    updatedFavorites = currentFavorites.filter((id) => id !== listingId);
    delta = -1;
  } else {
    updatedFavorites = [...currentFavorites, listingId];
    delta = 1;
  }

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites));

    // Store atomic delta for offline/local like count adjustment
    const rawDeltas = localStorage.getItem(LIKES_DELTA_KEY);
    const deltas: Record<string, number> = rawDeltas ? JSON.parse(rawDeltas) : {};
    deltas[listingId] = (deltas[listingId] || 0) + delta;
    localStorage.setItem(LIKES_DELTA_KEY, JSON.stringify(deltas));

    // Broadcast custom event so any component listening can update
    window.dispatchEvent(
      new CustomEvent('asukaimmo_favorite_changed', {
        detail: { listingId, isFavorite: !exists, delta },
      })
    );
  } catch (e) {
    console.error('Error saving favorite to localStorage', e);
  }

  return { isFavorite: !exists, delta };
}

export function toggleFavoriteId(listingId: string): boolean {
  return toggleFavorite(listingId).isFavorite;
}

export function getLikeDelta(listingId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(LIKES_DELTA_KEY);
    const deltas: Record<string, number> = raw ? JSON.parse(raw) : {};
    return deltas[listingId] || 0;
  } catch {
    return 0;
  }
}
