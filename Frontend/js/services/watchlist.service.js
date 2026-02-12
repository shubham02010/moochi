/**
 * Watchlist Service
 * Manages user watchlist using localStorage (browser-based, no backend)
 */

const STORAGE_KEY = "moochi_watchlist";

/**
 * Get all watchlist items
 * @returns {Array} Array of watchlist items
 */
export function getWatchlist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get watchlist:", error);
    return [];
  }
}

/**
 * Add item to watchlist
 * @param {Object} item - Movie or series object
 * @returns {boolean} Success status
 */
export function addToWatchlist(item) {
  if (!item || !item.id) return false;

  try {
    const watchlist = getWatchlist();
    
    // Check if already exists
    const exists = watchlist.some(
      existing => existing.id === item.id && existing.media_type === (item.media_type || (item.title ? "movie" : "tv"))
    );

    if (exists) {
      return false; // Already in list
    }

    // Add item with metadata
    const itemToAdd = {
      id: item.id,
      title: item.title || item.name,
      name: item.name || item.title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      overview: item.overview,
      release_date: item.release_date || item.first_air_date,
      first_air_date: item.first_air_date || item.release_date,
      vote_average: item.vote_average,
      media_type: item.media_type || (item.title ? "movie" : "tv"),
      added_at: new Date().toISOString()
    };

    watchlist.unshift(itemToAdd); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    return true;
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
    return false;
  }
}

/**
 * Remove item from watchlist
 * @param {number} id - Item ID
 * @param {string} mediaType - "movie" or "tv"
 * @returns {boolean} Success status
 */
export function removeFromWatchlist(id, mediaType) {
  if (!id) return false;

  try {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(
      item => !(item.id === id && item.media_type === mediaType)
    );

    if (filtered.length === watchlist.length) {
      return false; // Item not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to remove from watchlist:", error);
    return false;
  }
}

/**
 * Check if item is in watchlist
 * @param {number} id - Item ID
 * @param {string} mediaType - "movie" or "tv"
 * @returns {boolean} Whether item is in watchlist
 */
export function isInWatchlist(id, mediaType) {
  if (!id) return false;

  const watchlist = getWatchlist();
  return watchlist.some(
    item => item.id === id && item.media_type === mediaType
  );
}

/**
 * Toggle item in watchlist (add if not present, remove if present)
 * @param {Object} item - Movie or series object
 * @returns {boolean} True if added, false if removed
 */
export function toggleWatchlist(item) {
  if (!item || !item.id) return false;

  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const inList = isInWatchlist(item.id, mediaType);

  if (inList) {
    return removeFromWatchlist(item.id, mediaType);
  } else {
    return addToWatchlist(item);
  }
}

/**
 * Clear all watchlist items
 */
export function clearWatchlist() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear watchlist:", error);
  }
}
