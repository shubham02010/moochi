import { IMAGE_BASE } from "../core/config.js";
import { isInWatchlist, toggleWatchlist } from "../services/watchlist.service.js";

// TMDB Genre ID mapping (from TMDB API documentation)
const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

/**
 * Get genre names from genre IDs
 */
function getGenreNames(genreIds) {
  if (!genreIds || !genreIds.length) return [];
  return genreIds.slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean);
}
/**
 * Render standard poster card row
 */
export function renderRow(title, items, type = "movie", container = document.getElementById("rows")) {
  if (!container) return;
  const row = document.createElement("div");
  row.className = "row content-row";

  row.innerHTML = `
    <div class="row-header">
      <h2 class="row-title">${title}</h2>
    </div>
    <div class="row-list"></div>
  `;

  const list = row.querySelector(".row-list");

  items.slice(0, 15).forEach(item => {
    if (!item.poster_path) return;

    const card = document.createElement("div");
    card.className = "row-item";
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    const displayTitle = item.title || item.name;
    const posterUrl = `${IMAGE_BASE}/w342${item.poster_path}`;
    const year = (item.release_date || item.first_air_date || "").split("-")[0];
    const overview = item.overview
      ? `${item.overview.slice(0, 120)}${item.overview.length > 120 ? "…" : ""}`
      : "No description available.";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
    const resolvedType = type === "mixed" ? item.media_type : type;
    const typeLabel = resolvedType === "tv" ? "Series" : "Movie";
    card.setAttribute("aria-label", `${displayTitle} (${typeLabel})`);

    const inWatchlist = isInWatchlist(item.id, resolvedType);

    card.innerHTML = `
      <div class="row-item-media">
        <div class="skeleton-poster">
          <div class="skeleton-shimmer"></div>
        </div>
        ${rating ? `<span class="row-item-rating">★ ${rating}</span>` : ""}
        <span class="row-item-badge">${typeLabel}</span>
      </div>
      <div class="row-item-info" aria-hidden="true">
        <div class="row-item-meta">
          <span>${year || "N/A"}</span>
          <span>•</span>
          <span>${typeLabel}</span>
        </div>
        <h3>${displayTitle}</h3>
        <p>${overview}</p>
      </div>
      <div class="card-hover-popup">
        <img class="card-hover-popup__image" 
             src="${item.backdrop_path ? `${IMAGE_BASE}/w500${item.backdrop_path}` : posterUrl}" 
             alt="${displayTitle}" />
        <div class="card-hover-popup__content">
          <div class="card-hover-popup__actions">
            <button class="card-hover-popup__play" aria-label="Play">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="card-hover-popup__more" aria-label="More Info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>
          </div>
          <div class="card-hover-popup__meta">
            ${item.vote_average ? `<span class="card-hover-popup__match">${Math.round(item.vote_average * 10)}% Match</span>` : ""}
            <span class="card-hover-popup__year">${year || ""}</span>
            <span class="card-hover-popup__badge">HD</span>
          </div>
          <p class="card-hover-popup__desc">${item.overview || "No description available."}</p>
          <div class="card-hover-popup__genres">
            ${getGenreNames(item.genre_ids || []).map(g => `<span>${g}</span>`).join("")}
          </div>
        </div>
      </div>
    `;

    const skeleton = card.querySelector(".skeleton-poster");
    const media = card.querySelector(".row-item-media");

    const img = document.createElement("img");
    img.src = posterUrl;
    img.alt = displayTitle;
    img.loading = "lazy";
    img.decoding = "async";
    img.style.display = "none";

    img.onload = () => {
      skeleton.style.display = "none";
      img.style.display = "block";
      img.classList.add("loaded");
    };

    img.onerror = () => {
      skeleton.innerHTML = `
        <div class="poster-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="2" y1="7" x2="7" y2="7"/>
            <line x1="2" y1="17" x2="7" y2="17"/>
            <line x1="17" y1="17" x2="22" y2="17"/>
            <line x1="17" y1="7" x2="22" y2="7"/>
          </svg>
          <p>No Image</p>
        </div>
      `;
    };

    media.appendChild(img);

    // Hover popup play button action
    const popupPlayBtn = card.querySelector(".card-hover-popup__play");
    if (popupPlayBtn) {
      popupPlayBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (resolvedType === "tv") {
          window.location.href = `/series.html?id=${item.id}`;
        } else {
          window.location.href = `/movie.html?id=${item.id}`;
        }
      });
    }

    // Hover popup more info button - add to watchlist
    const popupMoreBtn = card.querySelector(".card-hover-popup__more");
    if (popupMoreBtn) {
      popupMoreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasAdded = toggleWatchlist({ ...item, media_type: resolvedType });
        popupMoreBtn.classList.toggle("active", wasAdded);
        window.dispatchEvent(new CustomEvent("watchlistUpdated"));
      });
    }

    card.onclick = () => {
      if (resolvedType === "tv") {
        window.location.href = `/series.html?id=${item.id}`;
      } else {
        window.location.href = `/movie.html?id=${item.id}`;
      }
    };

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });

    list.appendChild(card);
  });

  container.appendChild(row);
}

/**
 * Render Trending Section with featured card + grid layout
 */
export function renderTrendingSection(items, container) {
  if (!container || !items.length) return;

  container.innerHTML = "";

  // Featured (first item - large card)
  const featured = items[0];
  const featuredCard = document.createElement("div");
  featuredCard.className = "trending-featured";
  featuredCard.innerHTML = `
    <img src="${IMAGE_BASE}/w780${featured.backdrop_path || featured.poster_path}" alt="${featured.title || featured.name}" />
    <div class="trending-featured-overlay">
      <span class="trending-badge">#1 TRENDING</span>
      <h3 class="trending-title">${featured.title || featured.name}</h3>
      <span class="trending-rank">Rank #1</span>
    </div>
  `;

  featuredCard.onclick = () => navigateToDetail(featured);
  container.appendChild(featuredCard);

  // Small grid (remaining items)
  const smallGrid = document.createElement("div");
  smallGrid.className = "trending-small-grid";

  items.slice(1, 5).forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "trending-small";
    card.innerHTML = `
      <img src="${IMAGE_BASE}/w500${item.backdrop_path || item.poster_path}" alt="${item.title || item.name}" />
      <div class="trending-small-overlay">
        <span class="trending-badge">#${index + 2} TRENDING</span>
        <h3 class="trending-title">${item.title || item.name}</h3>
        <span class="trending-rank">Rank #${index + 2}</span>
      </div>
    `;
    card.onclick = () => navigateToDetail(item);
    smallGrid.appendChild(card);
  });

  container.appendChild(smallGrid);
}

/**
 * Render Top 10 Grid with numbered cards
 */
/**
 * Render Top 10 Grid with numbered cards
 */
export function renderTop10Grid(items, container) {
  if (!container || !items.length) return;

  container.innerHTML = "";

  items.slice(0, 10).forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "top10-card";
    card.innerHTML = `
      <img src="${IMAGE_BASE}/w342${item.poster_path}" alt="${item.title || item.name}" />
      <div class="top10-overlay">
        <span class="top10-rank">${index + 1}</span>
        <h4 class="top10-title">${item.title || item.name}</h4>
      </div>
    `;
    card.onclick = () => navigateToDetail(item);
    container.appendChild(card);
  });
}

/**
 * Render Latest Episodes row with episode-style cards
 */
/**
 * Render Latest Episodes row with episode-style cards
 */
export function renderLatestEpisodes(items, container) {
  if (!container || !items.length) return;

  container.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;

    const card = document.createElement("div");
    card.className = "episode-card";
    const title = item.name || item.title;

    card.innerHTML = `
      <div class="episode-poster">
        <img src="${IMAGE_BASE}/w185${item.poster_path}" alt="${title}" />
      </div>
      <div class="episode-details">
        <h4 class="episode-title">${title}</h4>
        <span class="episode-meta">TV Series</span>
        <div class="episode-badges">
          <span class="badge badge-sub">EPISODES</span>
        </div>
      </div>
    `;

    card.onclick = () => {
      window.location.href = `/series.html?id=${item.id}`;
    };

    container.appendChild(card);
  });
}

/**
 * Navigate to detail page
 */
function navigateToDetail(item) {
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
  if (mediaType === "tv") {
    window.location.href = `/series.html?id=${item.id}`;
  } else {
    window.location.href = `/movie.html?id=${item.id}`;
  }
}
