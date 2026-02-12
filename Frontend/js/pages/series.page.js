import {
  fetchSeriesDetails,
  fetchSeasonEpisodes
} from "../core/tmdb.api.js";
import { IMAGE_BASE } from "../core/config.js";
import { openServerModal, initServerModal } from "../ui/serverModal.js";
import { initHeader, initFooter } from "../ui/layout.ui.js";
import { applySavedTheme } from "../ui/theme.ui.js";
import { addToWatchLater, removeFromWatchLater, isInWatchLater } from "../services/watchlater.service.js";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "../services/watchlist.service.js";

/* ===== GET ID ===== */
const params = new URLSearchParams(window.location.search);
const seriesId = params.get("id");

if (!seriesId) {
  window.location.href = "/";
}

/* ===== STATE ===== */
let seriesData = null;
let currentSeason = 1;

/* ===== LOAD SERIES ===== */
if (seriesId) {
  applySavedTheme();
  loadSeries();
  initHeader();
  initFooter();
  initServerModal();
}

async function loadSeries() {
  try {
    seriesData = await fetchSeriesDetails(seriesId);
    console.log("Series data:", seriesData);

    if (seriesData && seriesData.id) {
      renderSeriesDetails(seriesData);
      renderCast(seriesData.credits?.cast || []);
      renderSimilar(seriesData.similar?.results || []);
      setupSeasonDropdown(seriesData.seasons);

      // Load first season by default
      if (seriesData.seasons && seriesData.seasons.length > 0) {
        const firstSeason = seriesData.seasons.find(s => s.season_number > 0);
        if (firstSeason) {
          currentSeason = firstSeason.season_number;
          loadSeason(currentSeason);
        }
      }

      setupWatchLater();
    }
  } catch (err) {
    console.error("Error loading series:", err);
    const titleEl = document.getElementById("series-title");
    if (titleEl && !seriesData) {
      titleEl.innerText = "Failed to load series";
    }
  }
}

/* ===== RENDER SERIES DETAILS ===== */
function renderSeriesDetails(series) {
  if (!series) return;

  // Backdrop
  const backdrop = document.getElementById("series-backdrop");
  if (backdrop && series.backdrop_path) {
    backdrop.style.backgroundImage = `url('${IMAGE_BASE}/original${series.backdrop_path}')`;
  }

  // Poster
  const poster = document.getElementById("series-poster");
  if (poster && series.poster_path) {
    poster.src = `${IMAGE_BASE}/w500${series.poster_path}`;
  }

  // Rating Badge
  const ratingText = document.getElementById("rating-text");
  if (ratingText && series.vote_average) {
    ratingText.textContent = series.vote_average.toFixed(1);
  }

  // Title
  const titleEl = document.getElementById("series-title");
  if (titleEl) {
    titleEl.innerText = series.name || series.title || "Unknown Series";
    console.log("Series title set to:", titleEl.innerText);
  }

  // Meta
  const meta = document.getElementById("series-meta");
  if (meta) {
    const year = series.first_air_date ? series.first_air_date.split("-")[0] : "N/A";
    const seasons = series.number_of_seasons || 0;
    const genres = series.genres?.slice(0, 3).map(g => g.name).join(", ") || "N/A";

    meta.innerHTML = `
      <span class="px-3 py-1 border border-white/20 rounded-full">${year}</span>
      <span class="px-3 py-1 border border-white/20 rounded-full">${seasons} Season${seasons !== 1 ? 's' : ''}</span>
      <span class="px-3 py-1 border border-white/20 rounded-full">${genres}</span>
      <span class="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full font-semibold">HD</span>
    `;
  }

  // Overview
  const overviewEl = document.getElementById("series-overview");
  if (overviewEl) {
    overviewEl.innerText = series.overview || "No description available.";
  }
}

/* ===== SETUP SEASON DROPDOWN ===== */
function setupSeasonDropdown(seasons) {
  const dropdownBtn = document.getElementById("season-dropdown-btn");
  const dropdownMenu = document.getElementById("season-dropdown-menu");
  const seasonText = document.getElementById("season-text");

  if (!seasons || !dropdownBtn) return;

  // Filter out specials (season 0)
  const regularSeasons = seasons.filter(s => s.season_number > 0);

  // Toggle dropdown
  dropdownBtn.onclick = (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("hidden");
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdownMenu.classList.add("hidden");
  });

  // Render season options
  dropdownMenu.innerHTML = "";
  regularSeasons.forEach(season => {
    const option = document.createElement("button");
    option.className = "w-full text-left px-4 py-2 hover:bg-primary/20 text-white font-medium transition-colors";
    option.innerText = `Season ${season.season_number}`;

    option.onclick = (e) => {
      e.stopPropagation();
      currentSeason = season.season_number;
      seasonText.innerText = `Season ${season.season_number}`;
      dropdownMenu.classList.add("hidden");
      loadSeason(season.season_number);
      updatePlayButton();
    };

    dropdownMenu.appendChild(option);
  });

  // Update play button
  updatePlayButton();
}

/* ===== LOAD EPISODES ===== */
async function loadSeason(seasonNumber) {
  const episodesGrid = document.getElementById("episodes-grid");
  const episodeCount = document.getElementById("episode-count");

  if (!episodesGrid) return;

  episodesGrid.innerHTML = '<p class="text-gray-400 text-sm col-span-full">Loading episodes...</p>';

  try {
    const data = await fetchSeasonEpisodes(seriesId, seasonNumber);
    if (episodeCount) {
      episodeCount.innerText = `${data.episodes.length} episodes`;
    }
    renderEpisodes(data.episodes, seasonNumber);
  } catch (err) {
    console.error(err);
    episodesGrid.innerHTML = '<p class="text-gray-400 text-sm col-span-full">Failed to load episodes</p>';
  }
}

/* ===== RENDER EPISODES ===== */
function renderEpisodes(episodes, seasonNumber) {
  const episodesGrid = document.getElementById("episodes-grid");
  episodesGrid.innerHTML = "";

  if (episodes.length === 0) {
    episodesGrid.innerHTML = '<p class="text-gray-400 text-sm col-span-full">No episodes available.</p>';
    return;
  }

  episodes.forEach(ep => {
    const card = document.createElement("div");
    card.className = "episode-card bg-bg-card border border-white/5 rounded-xl overflow-hidden cursor-pointer";

    const imgUrl = ep.still_path
      ? `${IMAGE_BASE}/w300${ep.still_path}`
      : "https://via.placeholder.com/300x169?text=No+Image";

    card.innerHTML = `
      <div class="relative aspect-video bg-bg-elevated overflow-hidden group">
        <img src="${imgUrl}" alt="Episode ${ep.episode_number}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
        <div class="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
          <div class="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
          </div>
        </div>
        ${ep.vote_average ? `
          <div class="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-lg">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            ${ep.vote_average.toFixed(1)}
          </div>
        ` : ''}
      </div>
      <div class="p-4">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-white text-base line-clamp-1">
            ${ep.episode_number}. ${ep.name}
          </h3>
          <span class="text-xs text-gray-400 font-mono ml-2 flex-shrink-0">${ep.runtime || '--'}m</span>
        </div>
        <p class="text-sm text-gray-400 leading-relaxed line-clamp-2">
          ${ep.overview || "No description available."}
        </p>
      </div>
    `;

    card.onclick = () => {
      // Navigate to watch page instead of opening modal
      window.location.href = `/watch.html?type=series&id=${seriesId}&s=${seasonNumber}&e=${ep.episode_number}`;
    };

    episodesGrid.appendChild(card);
  });
}

/* ===== UPDATE PLAY BUTTON ===== */
function updatePlayButton() {
  const playButton = document.getElementById("play-season-button");
  if (!playButton) return;

  playButton.innerHTML = `
    <img src="/assets/images/icons/play-button.png" alt="Play" class="w-6 h-6">
    Play Season ${currentSeason}
  `;

  playButton.onclick = () => {
    // Navigate to watch page instead of opening modal
    window.location.href = `/watch.html?type=series&id=${seriesId}&s=${currentSeason}&e=1`;
  };
}

/* ===== RENDER CAST ===== */
function renderCast(cast) {
  const castList = document.getElementById("cast-list");
  if (!castList) return;

  castList.innerHTML = "";

  const topCast = cast.slice(0, 12);

  if (topCast.length === 0) {
    castList.innerHTML = '<p class="text-gray-400 text-sm">No cast information available.</p>';
    return;
  }

  topCast.forEach(person => {
    const card = document.createElement("div");
    card.className = "flex-shrink-0 w-32 cursor-pointer group";

    const imgUrl = person.profile_path
      ? `${IMAGE_BASE}/w185${person.profile_path}`
      : "https://via.placeholder.com/185x278?text=No+Image";

    card.innerHTML = `
      <div class="aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-bg-card border border-white/5 group-hover:border-primary/50 transition-all">
        <img src="${imgUrl}" alt="${person.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
      </div>
      <p class="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">${person.name}</p>
      <p class="text-gray-400 text-xs truncate">${person.character || "Unknown"}</p>
    `;

    castList.appendChild(card);
  });
}

/* ===== RENDER SIMILAR SERIES ===== */
function renderSimilar(similar) {
  const similarList = document.getElementById("similar-list");
  if (!similarList) return;

  similarList.innerHTML = "";

  const topSimilar = similar.slice(0, 18);

  if (topSimilar.length === 0) {
    similarList.innerHTML = '<p class="text-gray-400 text-sm col-span-full">No similar series found.</p>';
    return;
  }

  topSimilar.forEach(series => {
    const card = document.createElement("div");
    card.className = "cursor-pointer group relative";

    const imgUrl = series.poster_path
      ? `${IMAGE_BASE}/w342${series.poster_path}`
      : "https://via.placeholder.com/342x513?text=No+Poster";

    card.innerHTML = `
      <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-card mb-2 border border-white/5 group-hover:border-primary/50 transition-all">
        ${series.vote_average ? `
          <div class="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-lg z-10">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            ${series.vote_average.toFixed(1)}
          </div>
        ` : ''}
        <img src="${imgUrl}" 
             alt="${series.name || series.title}" 
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
      </div>
      <p class="text-white text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">${series.name || series.title}</p>
    `;

    card.onclick = () => {
      window.location.href = `/series.html?id=${series.id}`;
    };

    similarList.appendChild(card);
  });
}

/* ===== WATCH LATER FUNCTIONALITY ===== */
function setupWatchLater() {
  const watchLaterBtn = document.getElementById("watch-later-btn");

  if (!watchLaterBtn || !seriesData) return;

  // Check if already in watch later
  const inWatchLater = isInWatchLater(seriesData.id, "tv");
  updateWatchLaterButton(watchLaterBtn, inWatchLater);

  // Watch Later click handler
  watchLaterBtn.onclick = () => {
    const currentlyInList = isInWatchLater(seriesData.id, "tv");

    if (currentlyInList) {
      // Remove from watch later
      if (removeFromWatchLater(seriesData.id, "tv")) {
        updateWatchLaterButton(watchLaterBtn, false);
        showToast("Removed from Watch Later", "info");
      }
    } else {
      // Add to watch later
      if (addToWatchLater({ ...seriesData, media_type: "tv" })) {
        updateWatchLaterButton(watchLaterBtn, true);
        showToast("Added to Watch Later", "success");
      }
    }
  };
}

/* ===== WATCHLIST FUNCTIONALITY ===== */
function setupWatchlist() {
  const watchlistBtn = document.getElementById("watchlist-btn");

  if (!watchlistBtn || !seriesData) return;

  // Check if already in watchlist
  const inWatchlist = isInWatchlist(seriesData.id, "tv");
  updateWatchlistButton(watchlistBtn, inWatchlist);

  // Watchlist click handler
  watchlistBtn.onclick = () => {
    const currentlyInList = isInWatchlist(seriesData.id, "tv");

    if (currentlyInList) {
      // Remove from watchlist
      if (removeFromWatchlist(seriesData.id, "tv")) {
        updateWatchlistButton(watchlistBtn, false);
        showToast("Removed from Watchlist", "info");
      }
    } else {
      // Add to watchlist
      if (addToWatchlist({ ...seriesData, media_type: "tv" })) {
        updateWatchlistButton(watchlistBtn, true);
        showToast("Added to Watchlist", "success");
      }
    }
  };
}

function updateWatchlistButton(btn, isAdded) {
  if (!btn) return;

  const svg = btn.querySelector("svg");
  const textNode = Array.from(btn.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');

  if (isAdded) {
    if (svg) {
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>`;
    }
    btn.classList.add("bg-primary/20", "border-primary");
  } else {
    if (svg) {
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`;
    }
    btn.classList.remove("bg-primary/20", "border-primary");
  }
}

function updateWatchLaterButton(btn, isAdded) {
  if (!btn) return;

  if (isAdded) {
    btn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Added
    `;
    btn.classList.add("bg-primary/20", "border-primary");
  } else {
    btn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Watch Later
    `;
    btn.classList.remove("bg-primary/20", "border-primary");
  }
}

function showToast(message, type = "info") {
  const existingToast = document.getElementById("toast-notification");
  if (existingToast) existingToast.remove();

  const bgColor = type === "success" ? "#22c55e" :
    type === "error" ? "#ef4444" :
      "#1a1f2e";

  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.style.cssText = `
    position: fixed;
    top: 5rem;
    right: 1rem;
    z-index: 10000;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    background: ${bgColor};
    color: white;
    font-weight: 600;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  // Slide in
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 10);

  // Slide out and remove
  setTimeout(() => {
    toast.style.transform = "translateX(400px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
