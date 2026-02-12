/**
 * TMDB Logo Fetcher
 * Fetches logo images from TMDB API with language priority (English first)
 */

import { API_KEY, BASE_URL, IMAGE_BASE } from "../core/config.js";

/**
 * Fetches logos for a movie from TMDB
 * @param {number} movieId - The TMDB movie ID
 * @returns {Promise<string|null>} - Logo URL or null if not found
 */
export async function fetchMovieLogo(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movie images: ${response.status}`);
    }

    const data = await response.json();
    return selectBestLogo(data.logos || []);
  } catch (error) {
    console.warn(`Failed to fetch logo for movie ${movieId}:`, error);
    return null;
  }
}

/**
 * Fetches logos for a TV series from TMDB
 * @param {number} tvId - The TMDB TV series ID
 * @returns {Promise<string|null>} - Logo URL or null if not found
 */
export async function fetchTVLogo(tvId) {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${tvId}/images?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch TV images: ${response.status}`);
    }

    const data = await response.json();
    return selectBestLogo(data.logos || []);
  } catch (error) {
    console.warn(`Failed to fetch logo for TV ${tvId}:`, error);
    return null;
  }
}

/**
 * Selects the best logo based on language priority
 * Priority: English (en) first, then any available logo
 * @param {Array} logos - Array of logo objects from TMDB
 * @returns {string|null} - Logo URL or null
 */
function selectBestLogo(logos) {
  if (!logos || logos.length === 0) {
    return null;
  }

  // Filter for transparent PNG logos only
  const validLogos = logos.filter(
    logo => logo.file_path && logo.file_path.endsWith('.png')
  );

  if (validLogos.length === 0) {
    return null;
  }

  // First priority: English logos
  const englishLogo = validLogos.find(
    logo => logo.iso_639_1 === "en"
  );

  if (englishLogo) {
    return `${IMAGE_BASE}/original${englishLogo.file_path}`;
  }

  // Fallback: Any available logo
  const fallbackLogo = validLogos[0];
  return `${IMAGE_BASE}/original${fallbackLogo.file_path}`;
}

/**
 * Fetches logo for a media item (movie or TV)
 * @param {Object} media - Media object with id and media_type
 * @returns {Promise<string|null>} - Logo URL or null
 */
export async function fetchMediaLogo(media) {
  if (!media || !media.id) {
    return null;
  }

  // Determine if it's a movie or TV show
  const mediaType = media.media_type || (media.title ? 'movie' : 'tv');

  if (mediaType === 'movie' || media.title) {
    return await fetchMovieLogo(media.id);
  } else if (mediaType === 'tv' || media.name) {
    return await fetchTVLogo(media.id);
  }

  return null;
}
