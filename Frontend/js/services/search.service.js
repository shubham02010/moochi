import { API_KEY, BASE_URL } from "../core/config.js";

export async function searchMulti(query, page = 1) {
  if (!query) {
    return { results: [], total_pages: 0, page: 1 };
  }

  const response = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );

  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }

  return response.json();
}
