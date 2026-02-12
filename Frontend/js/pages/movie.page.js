import { API_KEY, BASE_URL, IMAGE_BASE } from "../core/config.js";
import { openServerModal, initServerModal } from "../ui/serverModal.js";
import { initHeader, initFooter } from "../ui/layout.ui.js";
import { applySavedTheme } from "../ui/theme.ui.js";
import { addToWatchLater, removeFromWatchLater, isInWatchLater } from "../services/watchlater.service.js";
import { addToWatchlist, removeFromWatchlist, isInWatchlist, toggleWatchlist } from "../services/watchlist.service.js";

/* ===== GET MOVIE ID ===== */
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

if (!movieId) {
  window.location.href = "/";
}

/* ===== FETCH MOVIE DETAILS ===== */
async function fetchMovieDetails(id) {
  const res = await fetch(
    `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,videos,similar`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch movie details");
  }

  return await res.json();
}

/* ===== LOAD MOVIE ===== */
let movieData = null;

if (movieId) {
  applySavedTheme();
  loadMovie();
  initHeader();
  initFooter();
  initServerModal();
}

async function loadMovie() {
  try {
    movieData = await fetchMovieDetails(movieId);
    console.log("Movie data:", movieData);

    if (movieData && movieData.id) {
      renderMovieDetails(movieData);
      renderCast(movieData.credits?.cast || []);
      renderSimilar(movieData.similar?.results || []);
      setupPlayButton();
    } else {
      throw new Error("Invalid movie data");
    }
  } catch (err) {
    console.error("Error loading movie:", err);
    // Show error in a non-intrusive way
    const titleEl = document.getElementById("movie-title");
    if (titleEl && !movieData) {
      titleEl.innerText = "Failed to load movie";
    }
  }
}

/* ===== RENDER MOVIE DETAILS ===== */
function renderMovieDetails(movie) {
  if (!movie) return;

  // Backdrop
  const backdrop = document.getElementById("movie-backdrop");
  if (backdrop && movie.backdrop_path) {
    backdrop.style.backgroundImage = `url('${IMAGE_BASE}/original${movie.backdrop_path}')`;
  }

  // Poster
  const poster = document.getElementById("movie-poster");
  if (poster && movie.poster_path) {
    poster.src = `${IMAGE_BASE}/w500${movie.poster_path}`;
  }

  // Rating Badge
  const ratingText = document.getElementById("rating-text");
  if (ratingText && movie.vote_average) {
    ratingText.textContent = movie.vote_average.toFixed(1);
  }

  // Title - Make sure this always renders
  const titleEl = document.getElementById("movie-title");
  if (titleEl) {
    titleEl.innerText = movie.title || movie.name || "Unknown Title";
    console.log("Title set to:", titleEl.innerText);
  }

  // Meta
  const meta = document.getElementById("movie-meta");
  const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "N/A";
  const genres = movie.genres?.slice(0, 3).map(g => g.name).join(", ") || "N/A";

  meta.innerHTML = `
    <span class="px-3 py-1 border border-white/20 rounded-full">${year}</span>
    <span class="px-3 py-1 border border-white/20 rounded-full">${runtime}</span>
    <span class="px-3 py-1 border border-white/20 rounded-full">${genres}</span>
    <span class="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full font-semibold">HD</span>
  `;

  // Overview
  const overviewEl = document.getElementById("movie-overview");
  if (overviewEl) {
    overviewEl.innerText = movie.overview || "No description available.";
  }

  const runtimeEl = document.getElementById("movie-runtime");
  if (runtimeEl) runtimeEl.innerText = runtime;

  const releaseEl = document.getElementById("movie-release");
  if (releaseEl) {
    releaseEl.innerText = movie.release_date ? new Date(movie.release_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : "N/A";
  }

  const budgetEl = document.getElementById("movie-budget");
  if (budgetEl) budgetEl.innerText = movie.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : "N/A";

  const revenueEl = document.getElementById("movie-revenue");
  if (revenueEl) revenueEl.innerText = movie.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : "N/A";
}

/* ===== RENDER CAST ===== */
function renderCast(cast) {
  const castList = document.getElementById("cast-list");
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

/* ===== RENDER TRAILERS ===== */
function renderTrailers(videos) {
  const trailersList = document.getElementById("trailers-list");
  trailersList.innerHTML = "";

  const trailers = videos.filter(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));

  if (trailers.length === 0) {
    trailersList.innerHTML = '<p class="text-gray-400 text-sm">No trailers available.</p>';
    return;
  }

  trailers.forEach(video => {
    const card = document.createElement("div");
    card.className = "group cursor-pointer";

    card.innerHTML = `
      <div class="relative aspect-video rounded-lg overflow-hidden bg-surface-card mb-2">
        <img src="https://img.youtube.com/vi/${video.key}/hqdefault.jpg" 
             alt="${video.name}" 
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
        <div class="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
          <span class="material-symbols-outlined text-white text-5xl">play_circle</span>
        </div>
      </div>
      <h3 class="text-white text-sm font-medium">${video.name}</h3>
      <p class="text-gray-500 text-xs">${video.type} • ${video.published_at ? new Date(video.published_at).getFullYear() : ""}</p>
    `;

    card.onclick = () => {
      window.open(`https://www.youtube.com/watch?v=${video.key}`, "_blank");
    };

    trailersList.appendChild(card);
  });
}

/* ===== RENDER SIMILAR MOVIES ===== */
function renderSimilar(similar) {
  const similarList = document.getElementById("similar-list");
  similarList.innerHTML = "";

  const topSimilar = similar.slice(0, 18);

  if (topSimilar.length === 0) {
    similarList.innerHTML = '<p class="text-gray-400 text-sm col-span-full">No similar movies found.</p>';
    return;
  }

  topSimilar.forEach(movie => {
    const card = document.createElement("div");
    card.className = "cursor-pointer group relative";

    const imgUrl = movie.poster_path
      ? `${IMAGE_BASE}/w342${movie.poster_path}`
      : "https://via.placeholder.com/342x513?text=No+Poster";

    card.innerHTML = `
      <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-card mb-2 border border-white/5 group-hover:border-primary/50 transition-all">
        ${movie.vote_average ? `
          <div class="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-lg z-10">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            ${movie.vote_average.toFixed(1)}
          </div>
        ` : ''}
        <img src="${imgUrl}" 
             alt="${movie.title}" 
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
      </div>
      <p class="text-white text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">${movie.title}</p>
    `;

    card.onclick = () => {
      window.location.href = `/movie.html?id=${movie.id}`;
    };

    similarList.appendChild(card);
  });
}

/* ===== TABS FUNCTIONALITY ===== */
function setupTabs() {
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active state from all tabs
      tabs.forEach(t => {
        t.classList.remove("text-white", "font-bold");
        t.classList.add("text-gray-400", "font-medium");
        t.querySelector("div")?.remove();
      });

      // Add active state to clicked tab
      tab.classList.remove("text-gray-400", "font-medium");
      tab.classList.add("text-white", "font-bold");

      const indicator = document.createElement("div");
      indicator.className = "absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(79,93,255,0.8)]";
      tab.appendChild(indicator);

      // Hide all content
      contents.forEach(c => c.classList.add("hidden"));

      // Show corresponding content
      const tabId = tab.id.replace("tab-", "content-");
      document.getElementById(tabId)?.classList.remove("hidden");
    });
  });
}

/* ===== PLAY BUTTON ===== */
function setupPlayButton() {
  const playButton = document.getElementById("play-button");

  playButton.onclick = () => {
    // Navigate to watch page instead of opening modal
    window.location.href = `/watch.html?type=movie&id=${movieId}`;
  };

  // Setup Watch Later button
  setupWatchLater();

  // Setup Watchlist button
  setupWatchlist();
}

/* ===== WATCH LATER FUNCTIONALITY ===== */
function setupWatchLater() {
  const watchLaterBtn = document.getElementById("watch-later-btn");

  if (!watchLaterBtn || !movieData) return;

  // Check if already in watch later
  const inWatchLater = isInWatchLater(movieData.id, "movie");
  updateWatchLaterButton(watchLaterBtn, inWatchLater);

  // Watch Later click handler
  watchLaterBtn.onclick = () => {
    const currentlyInList = isInWatchLater(movieData.id, "movie");

    if (currentlyInList) {
      // Remove from watch later
      if (removeFromWatchLater(movieData.id, "movie")) {
        updateWatchLaterButton(watchLaterBtn, false);
        showToast("Removed from Watch Later", "info");
      }
    } else {
      // Add to watch later
      if (addToWatchLater({ ...movieData, media_type: "movie" })) {
        updateWatchLaterButton(watchLaterBtn, true);
        showToast("Added to Watch Later", "success");
      }
    }
  };
}

/* ===== WATCHLIST FUNCTIONALITY ===== */
function setupWatchlist() {
  const watchlistBtn = document.getElementById("watchlist-btn");

  if (!watchlistBtn || !movieData) return;

  // Check if already in watchlist
  const inWatchlist = isInWatchlist(movieData.id, "movie");
  updateWatchlistButton(watchlistBtn, inWatchlist);

  // Watchlist click handler
  watchlistBtn.onclick = () => {
    const currentlyInList = isInWatchlist(movieData.id, "movie");

    if (currentlyInList) {
      // Remove from watchlist
      if (removeFromWatchlist(movieData.id, "movie")) {
        updateWatchlistButton(watchlistBtn, false);
        showToast("Removed from Watchlist", "info");
      }
    } else {
      // Add to watchlist
      if (addToWatchlist({ ...movieData, media_type: "movie" })) {
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

  const svg = btn.querySelector("svg");

  if (isAdded) {
    if (svg) {
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>`;
    }
    btn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Added
    `;
    btn.classList.add("bg-primary/20", "border-primary");
  } else {
    if (svg) {
      svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
    }
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

  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.className = `fixed top-20 right-4 z-[10000] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 transform translate-x-full transition-all duration-300 ${type === "success" ? "bg-good text-white" :
      type === "error" ? "bg-bad text-white" :
        "bg-surface-card text-white border border-white/10"
    }`;

  const icon = type === "success" ? "check_circle" :
    type === "error" ? "error" :
      "info";

  toast.innerHTML = `
    <span class="material-symbols-outlined text-xl">${icon}</span>
    <span class="font-medium">${message}</span>
  `;

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
