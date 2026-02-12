/**
 * Watch Later Service
 * Manages watch later list using localStorage
 */

const STORAGE_KEY = "moochi_watchlater";

/**
 * Get all watch later items
 * @returns {Array} Array of watch later items
 */
export function getWatchLater() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get watch later:", error);
    return [];
  }
}

/**
 * Add item to watch later
 * @param {Object} item - Movie or series object
 * @returns {boolean} Success status
 */
export function addToWatchLater(item) {
  if (!item || !item.id) return false;

  try {
    const watchLater = getWatchLater();
    
    // Check if already exists
    const exists = watchLater.some(
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

    watchLater.unshift(itemToAdd); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchLater));
    return true;
  } catch (error) {
    console.error("Failed to add to watch later:", error);
    return false;
  }
}

/**
 * Remove item from watch later
 * @param {number} id - Item ID
 * @param {string} mediaType - "movie" or "tv"
 * @returns {boolean} Success status
 */
export function removeFromWatchLater(id, mediaType) {
  if (!id) return false;

  try {
    const watchLater = getWatchLater();
    const filtered = watchLater.filter(
      item => !(item.id === id && item.media_type === mediaType)
    );

    if (filtered.length === watchLater.length) {
      return false; // Item not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to remove from watch later:", error);
    return false;
  }
}

/**
 * Check if item is in watch later
 * @param {number} id - Item ID
 * @param {string} mediaType - "movie" or "tv"
 * @returns {boolean} Whether item is in watch later
 */
export function isInWatchLater(id, mediaType) {
  if (!id) return false;

  const watchLater = getWatchLater();
  return watchLater.some(
    item => item.id === id && item.media_type === mediaType
  );
}

/**
 * Clear all watch later items
 */
export function clearWatchLater() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear watch later:", error);
  }
}
