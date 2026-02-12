import { API_KEY, BASE_URL } from "./config.js";

export async function fetchNowPlaying() {
  const res = await fetch(
    `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch now playing");
  }

  const data = await res.json();
  return data.results.slice(0, 5); // hero = only 5
}

export async function fetchPopular() {
  const res = await fetch(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}`
  );
  return (await res.json()).results;
}

export async function fetchByGenre(genreId) {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`
  );
  return (await res.json()).results;
}

export async function fetchByYear(year) {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${year}&sort_by=popularity.desc`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch movies for year ${year}`);
  }

  return (await res.json()).results;
}

export async function fetchPopularTV() {
  const res = await fetch(
    `${BASE_URL}/tv/popular?api_key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch popular TV");
  }

  return (await res.json()).results;
}

export async function fetchTopRatedTV() {
  const res = await fetch(
    `${BASE_URL}/tv/top_rated?api_key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top rated TV");
  }

  return (await res.json()).results;
}

export async function fetchSeriesDetails(id) {
  const res = await fetch(
    `${BASE_URL}/tv/${id}?api_key=${API_KEY}&append_to_response=credits,similar`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch series details");
  }

  return await res.json();
}

export async function fetchSeasonEpisodes(seriesId, seasonNumber) {
  const res = await fetch(
    `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch season episodes");
  }

  return await res.json();
}

export async function fetchTrendingAll() {
  const res = await fetch(
    `${BASE_URL}/trending/all/week?api_key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch trending");
  }

  return (await res.json()).results;
}

export async function fetchUpcomingMovies() {
  const res = await fetch(
    `${BASE_URL}/movie/upcoming?api_key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch upcoming movies");
  }

  return (await res.json()).results;
}

// Fetch anime using animation genre (16) from TV shows
export async function fetchAnime() {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc&with_original_language=ja`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch anime");
  }

  const data = await res.json();
  return data.results.map(item => ({ ...item, media_type: "tv" }));
}

async function measureLatency(url) {
  const start = performance.now();
  try {
    await fetch(url, { mode: "no-cors" });
    return Math.round(performance.now() - start);
  } catch {
    return Infinity;
  }
}
function getStatus(ms) {
  if (ms < 150) return "green";
  if (ms < 300) return "yellow";
  return "red";
}


