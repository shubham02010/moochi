import {
  fetchPopular,
  fetchByGenre,
  fetchByYear,
  fetchPopularTV,
  fetchTopRatedTV,
  fetchTrendingAll,
  fetchUpcomingMovies,
  fetchAnime
} from "../core/tmdb.api.js";
import { getCache, setCache } from "../core/cache.js";

function cachedFetch(key, fetcher) {
  return async () => {
    const cached = getCache(key);
    if (cached) return cached;
    const data = await fetcher();
    setCache(key, data);
    return data;
  };
}

export async function getHomeRows() {
  const cached = getCache("home_rows");
  if (cached) return cached;

  const [
    trending,
    popular,
    action,
    drama,
    thriller,
    spotlight2025,
    spotlight2026,
    popularTV,
    topRatedTV,
    upcoming
  ] = await Promise.all([
    fetchTrendingAll(),
    fetchPopular(),
    fetchByGenre(28),
    fetchByGenre(18),
    fetchByGenre(53),
    fetchByYear(2025),
    fetchByYear(2026),
    fetchPopularTV(),
    fetchTopRatedTV(),
    fetchUpcomingMovies()
  ]);

  const rows = [
    { title: "Trending Now", data: trending, type: "mixed" },
    { title: "Popular Movies", data: popular, type: "movie" },
    { title: "Action", data: action, type: "movie" },
    { title: "Drama", data: drama, type: "movie" },
    { title: "Thriller", data: thriller, type: "movie" },
    { title: "Upcoming Spotlight", data: upcoming, type: "movie" },
    { title: "🌟 2025 Spotlight", data: spotlight2025, type: "movie" },
    { title: "🌟 2026 Spotlight", data: spotlight2026, type: "movie" },
    { title: "📺 Popular TV Series", data: popularTV, type: "tv" },
    { title: "📺 Top Rated TV Series", data: topRatedTV, type: "tv" }
  ];

  setCache("home_rows", rows);
  return rows;
}

export function getHomeRowSources() {
  return [
    { title: "Popular Movies", type: "movie", fetcher: cachedFetch("row_popular_movies", fetchPopular) },
    { title: "🎌 Anime", type: "tv", fetcher: cachedFetch("row_anime", fetchAnime) },
    { title: "Action", type: "movie", fetcher: cachedFetch("row_action", () => fetchByGenre(28)) },
    { title: "Drama", type: "movie", fetcher: cachedFetch("row_drama", () => fetchByGenre(18)) },
    { title: "Thriller", type: "movie", fetcher: cachedFetch("row_thriller", () => fetchByGenre(53)) },
    { title: "📺 Popular TV Series", type: "tv", fetcher: cachedFetch("row_popular_tv", fetchPopularTV) },
    { title: "📺 Top Rated TV Series", type: "tv", fetcher: cachedFetch("row_top_tv", fetchTopRatedTV) }
  ];
}

export function getBrowseRowSources() {
  return [
    { title: "Watch Later", type: "mixed", fetcher: getWatchLaterItems, isWatchLater: true },
    { title: "Trending Now", type: "mixed", fetcher: cachedFetch("row_trending", fetchTrendingAll) },
    { title: "Popular Movies", type: "movie", fetcher: cachedFetch("row_popular_movies", fetchPopular) },
    { title: "Popular Series", type: "tv", fetcher: cachedFetch("row_popular_tv", fetchPopularTV) },
    { title: "Upcoming Spotlight", type: "movie", fetcher: cachedFetch("row_upcoming", fetchUpcomingMovies) }
  ];
}

/**
 * Get watch later items for row display
 * @returns {Promise<Array>} Watch later items
 */
async function getWatchLaterItems() {
  const { getWatchLater } = await import("./watchlater.service.js");
  return getWatchLater();
}
