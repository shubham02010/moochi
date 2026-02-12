import { API_KEY, BASE_URL, IMAGE_BASE } from "../core/config.js";

let headerLoaded = false;
let footerLoaded = false;
let sidebarLoaded = false;

export async function initHeader() {
  const container = document.getElementById("header-container");
  if (!container) return;

  if (!headerLoaded) {
    const response = await fetch("/components/header.html");
    if (!response.ok) {
      console.error("Failed to load header:", response.status);
      return;
    }
    container.innerHTML = await response.text();
    headerLoaded = true;
  }

  bindHeaderSearch();
}

function bindHeaderSearch() {
  const searchInput = document.getElementById("header-search-input");
  const searchClear = document.getElementById("header-search-clear");
  const searchResults = document.getElementById("header-search-results");
  const searchContent = document.getElementById("header-search-content");

  if (!searchInput || !searchClear || !searchResults || !searchContent) return;
  if (searchInput.dataset.bound === "true") return;

  searchInput.dataset.bound = "true";

  let searchTimeout = null;

  searchInput.addEventListener("input", e => {
    const query = e.target.value.trim();
    if (query) {
      searchClear.style.display = "block";
    } else {
      searchClear.style.display = "none";
      searchResults.style.display = "none";
      return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query, searchResults, searchContent);
    }, 300);
  });

  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      if (query) {
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
      }
    }
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    searchResults.style.display = "none";
    searchInput.focus();
  });

  document.addEventListener("click", e => {
    const isInsideSearch = e.target.closest("#header-search-results") ||
      e.target.closest("#header-search-input") ||
      e.target.closest("#header-search-clear");

    if (!isInsideSearch) {
      searchResults.style.display = "none";
    }
  });
}

async function performSearch(query, resultsEl, contentEl) {
  try {
    contentEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; padding: 2rem;">
        <div style="width: 2rem; height: 2rem; border: 4px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animation: headerSpin 0.8s linear infinite;"></div>
      </div>
    `;
    resultsEl.style.display = "block";

    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`
    );

    if (!response.ok) {
      throw new Error(`Search failed (${response.status})`);
    }

    const data = await response.json();
    renderHeaderResults(data.results, contentEl, resultsEl);
  } catch (error) {
    console.error("Header search error:", error);
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #a8b2c1;">
        <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 0.5rem; color: #ef4444;">error</span>
        <p>Failed to search. Please try again.</p>
      </div>
    `;
    resultsEl.style.display = "block";
  }
}

function renderHeaderResults(results, contentEl, resultsEl) {
  if (!results || results.length === 0) {
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #a8b2c1;">
        <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">search_off</span>
        <p>No results found</p>
      </div>
    `;
    resultsEl.style.display = "block";
    return;
  }

  const filtered = results
    .filter(item =>
      (item.media_type === "movie" || item.media_type === "tv") && item.id
    )
    .slice(0, 8);

  if (filtered.length === 0) {
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #a8b2c1;">
        <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 0.5rem; opacity: 0.5;">search_off</span>
        <p>No results found</p>
      </div>
    `;
    resultsEl.style.display = "block";
    return;
  }

  contentEl.innerHTML = filtered.map(item => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || "").split("-")[0];
    const mediaType = item.media_type === "tv" ? "TV Series" : "Movie";
    const posterUrl = item.poster_path
      ? `${IMAGE_BASE}/w185${item.poster_path}`
      : "https://via.placeholder.com/185x278?text=No+Image";

    const link = item.media_type === "tv"
      ? `/series.html?id=${item.id}`
      : `/movie.html?id=${item.id}`;

    return `
      <a href="${link}" class="header-search-item">
        <div class="header-search-poster">
          <img src="${posterUrl}" alt="${title}" />
        </div>
        <div style="flex: 1; min-width: 0;">
          <h3 class="header-search-title">${title}</h3>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; font-size: 0.75rem; color: #a8b2c1;">
            <span>${year || "N/A"}</span>
            <span>•</span>
            <span style="color: #3b82f6; font-weight: 600;">${mediaType}</span>
            ${item.vote_average ? `
              <span>•</span>
              <span style="display: flex; align-items: center; gap: 0.25rem;">
                <span class="material-symbols-outlined" style="font-size: 0.75rem; color: #eab308;">star</span>
                ${item.vote_average.toFixed(1)}
              </span>
            ` : ""}
          </div>
          ${item.overview ? `
            <p style="font-size: 0.75rem; color: #6b7788; margin-top: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.overview}</p>
          ` : ""}
        </div>
        <span class="material-symbols-outlined header-search-icon">arrow_forward</span>
      </a>
    `;
  }).join("");
}

/**
 * Initialize footer component
 */
export async function initFooter() {
  const container = document.getElementById("footer-container");
  if (!container) return;

  if (!footerLoaded) {
    try {
      const response = await fetch("/components/footer.html");
      if (!response.ok) {
        console.error("Failed to load footer:", response.status);
        return;
      }
      container.innerHTML = await response.text();
      footerLoaded = true;
    } catch (error) {
      console.error("Error loading footer:", error);
    }
  }
}

/**
 * Initialize sidebar component
 */
export async function initSidebar() {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  if (!sidebarLoaded) {
    try {
      const response = await fetch("/components/sidebar.html");
      if (!response.ok) {
        console.error("Failed to load sidebar:", response.status);
        return;
      }
      container.innerHTML = await response.text();
      sidebarLoaded = true;

      // Setup active nav state
      setupSidebarNav();
    } catch (error) {
      console.error("Error loading sidebar:", error);
    }
  }
}

/**
 * Setup sidebar navigation active states
 */
function setupSidebarNav() {
  const navItems = document.querySelectorAll(".nav-item");
  const currentPath = window.location.pathname;

  navItems.forEach(item => {
    const href = item.getAttribute("href");
    if (href === currentPath || (currentPath === "/" && href === "/")) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}
