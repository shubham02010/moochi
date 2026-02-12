import { IMAGE_BASE } from "../core/config.js";
import { searchMulti } from "../services/search.service.js";
import { getBrowseRowSources } from "../services/rows.service.js";
import { renderRow } from "../ui/rows.ui.js";
import { showRowSkeletons } from "../ui/skeleton.ui.js";
import { getSettings, updateSettings } from "../services/settings.service.js";
import { initHeader, initFooter } from "../ui/layout.ui.js";
import { applySavedTheme } from "../ui/theme.ui.js";

const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const searchResults = document.getElementById("search-results");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const noResultsState = document.getElementById("no-results-state");
const resultsInfo = document.getElementById("results-info");
const resultsCount = document.getElementById("results-count");
const filterButtons = document.querySelectorAll(".filter-btn");
const defaultNoResultsText = noResultsState?.querySelector("p")?.textContent || "";
const defaultNoResultsTitle = noResultsState?.querySelector("h2")?.textContent || "";
const defaultNoResultsIcon = noResultsState?.querySelector("span")?.textContent || "";
const sentinel = document.getElementById("search-sentinel");
const browseSection = document.getElementById("browse-section");
const browseRows = document.getElementById("browse-rows");

let currentFilter = "all";
const settings = getSettings();
if (settings.content?.preference) {
  currentFilter = settings.content.preference;
}
let currentQuery = "";
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let allResults = [];
let searchTimeout = null;
let requestToken = 0;
let observer = null;
let browseLoaded = false;

applySavedTheme();
initHeader();
bindSearchEvents();
handleQueryFromUrl();
loadBrowseCategories();
applyDefaultFilter();

function bindSearchEvents() {
  if (!searchInput || !searchResults || !searchClear) return;

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      updateSettings({ content: { preference: currentFilter } });
      renderFilteredResults();
    });
  });

  searchInput.addEventListener("input", e => {
    const query = e.target.value.trim();

    if (query) {
      searchClear.classList.remove("hidden");
    } else {
      searchClear.classList.add("hidden");
      requestToken += 1;
      resetSearchState();
      clearSearchUrl();
      showEmptyState();
      return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 500);
  });

  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      if (query) {
        clearTimeout(searchTimeout);
        performSearch(query);
      }
    }
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.classList.add("hidden");
    requestToken += 1;
    resetSearchState();
    clearSearchUrl();
    showEmptyState();
    searchInput.focus();
  });

  setupInfiniteScroll();
}

function applyDefaultFilter() {
  if (!filterButtons.length) return;
  const preferred = Array.from(filterButtons).find(btn => btn.dataset.filter === currentFilter);
  if (preferred) {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    preferred.classList.add("active");
  }
}

function handleQueryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryFromUrl = params.get("q");
  if (queryFromUrl && searchInput) {
    searchInput.value = queryFromUrl;
    if (searchClear) {
      searchClear.classList.remove("hidden");
    }
    performSearch(queryFromUrl);
  } else {
    showEmptyState();
  }
}

async function performSearch(query) {
  if (!query) return;

  requestToken += 1;
  const token = requestToken;
  resetSearchState();
  currentQuery = query;
  updateSearchUrl(query);
  showLoadingState();
  hideBrowseSection();

  await loadSearchPage(1, token);
}

function updateSearchUrl(query) {
  const params = new URLSearchParams(window.location.search);
  params.set("q", query);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function clearSearchUrl() {
  const params = new URLSearchParams(window.location.search);
  params.delete("q");
  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
}

async function loadSearchPage(page, token = requestToken) {
  if (isLoading || !currentQuery) return;

  isLoading = true;
  const loadingMore = page > 1;
  if (loadingMore) showLoadingMore();

  try {
    const data = await searchMulti(currentQuery, page);
    const results = (data.results || []).filter(item =>
      (item.media_type === "movie" || item.media_type === "tv") && item.id
    );

    if (token !== requestToken) {
      return;
    }

    currentPage = data.page || page;
    totalPages = data.total_pages || 1;
    allResults = page === 1 ? results : allResults.concat(results);

    hideLoadingState();
    hideLoadingMore();

    if (allResults.length === 0) {
      showNoResultsState();
      return;
    }

    const newFiltered = results.filter(matchesFilter);
    renderFilteredResults(loadingMore ? newFiltered : null);
  } catch (error) {
    console.error("Search error:", error);
    if (token !== requestToken) {
      return;
    }
    hideLoadingMore();
    hideLoadingState();
    showNoResultsState(error.message);
  } finally {
    isLoading = false;
  }
}

function renderFilteredResults(appendItems = null) {
  const filtered = allResults.filter(matchesFilter);

  if (!currentQuery) {
    showEmptyState();
    showBrowseSection();
    return;
  }

  if (filtered.length === 0) {
    showNoResultsState();
    return;
  }

  showResultsState();
  resultsCount.textContent = `Found ${filtered.length} result${filtered.length !== 1 ? "s" : ""}`;

  if (appendItems && appendItems.length) {
    appendResults(appendItems);
  } else if (appendItems === null) {
    searchResults.innerHTML = filtered.map(renderCard).join("");
    revealLazyImages(searchResults);
  }
}

function appendResults(items) {
  if (!items.length) return;
  const html = items.map(renderCard).join("");
  searchResults.insertAdjacentHTML("beforeend", html);
  revealLazyImages(searchResults);
}

function matchesFilter(item) {
  if (currentFilter === "all") return true;
  return item.media_type === currentFilter;
}

function renderCard(item) {
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const mediaType = item.media_type === "tv" ? "TV Series" : "Movie";
  const description = item.overview || "No description available.";
  const posterUrl = item.poster_path
    ? `${IMAGE_BASE}/w342${item.poster_path}`
    : "https://via.placeholder.com/342x513?text=No+Poster";
  const link = item.media_type === "tv"
    ? `/series.html?id=${item.id}`
    : `/movie.html?id=${item.id}`;

  return `
    <a class="search-card" href="${link}">
      <div class="search-card__poster">
        <img src="${posterUrl}" alt="${title}" loading="lazy" />
        <div class="search-card__gradient"></div>
        <span class="search-card__badge">${mediaType}</span>
        ${item.vote_average ? `<span class="search-card__rating">${item.vote_average.toFixed(1)}</span>` : ""}
      </div>
      <div class="search-card__info">
        <h3>${title}</h3>
        <div class="search-card__meta">
          <span>${year || "N/A"}</span>
          <span>•</span>
          <span>${item.media_type === "tv" ? "Series" : "Movie"}</span>
        </div>
        <p class="search-card__desc">${description}</p>
      </div>
    </a>
  `;
}

function revealLazyImages(scope) {
  const images = scope.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    if (img.complete) {
      img.classList.add("loaded");
      return;
    }
    img.addEventListener(
      "load",
      () => {
        img.classList.add("loaded");
      },
      { once: true }
    );
  });
}

function showLoadingState() {
  hideAllStates();
  loadingState.classList.remove("hidden");
  hideBrowseSection();
}

function showLoadingMore() {
  if (!sentinel) return;
  sentinel.classList.add("is-loading");
}

function hideLoadingMore() {
  if (!sentinel) return;
  sentinel.classList.remove("is-loading");
}

function showEmptyState() {
  hideAllStates();
  emptyState.classList.remove("hidden");
  showBrowseSection();
}

function showNoResultsState(message) {
  hideAllStates();
  noResultsState.classList.remove("hidden");
  hideBrowseSection();
  const messageEl = noResultsState.querySelector("p");
  const titleEl = noResultsState.querySelector("h2");
  const iconEl = noResultsState.querySelector("span");
  if (!messageEl || !titleEl || !iconEl) return;

  if (message) {
    iconEl.textContent = "error";
    titleEl.textContent = "Search Error";
    messageEl.textContent = message;
  } else {
    iconEl.textContent = defaultNoResultsIcon;
    titleEl.textContent = defaultNoResultsTitle;
    messageEl.textContent = defaultNoResultsText;
  }
}

function showResultsState() {
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  noResultsState.classList.add("hidden");
  resultsInfo.classList.remove("hidden");
  hideBrowseSection();
}

function hideAllStates() {
  loadingState.classList.add("hidden");
  emptyState.classList.add("hidden");
  noResultsState.classList.add("hidden");
  resultsInfo.classList.add("hidden");
  searchResults.innerHTML = "";
}

function hideLoadingState() {
  loadingState.classList.add("hidden");
}

function resetSearchState() {
  currentQuery = "";
  currentPage = 1;
  totalPages = 1;
  allResults = [];
  isLoading = false;
  searchResults.innerHTML = "";
  hideLoadingMore();
}

function setupInfiniteScroll() {
  if (!sentinel || observer) return;

  observer = new IntersectionObserver(
    entries => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;
      if (!currentQuery || isLoading || currentPage >= totalPages) return;

      loadSearchPage(currentPage + 1);
    },
    {
      rootMargin: "400px"
    }
  );

  observer.observe(sentinel);
}

async function loadBrowseCategories() {
  if (browseLoaded || !browseRows) return;
  browseLoaded = true;

  showRowSkeletons(5, browseRows);
  const sources = getBrowseRowSources();
  let clearedSkeletons = false;

  for (const row of sources) {
    try {
      const data = await row.fetcher();
      
      // Skip watch later row if empty (but show message)
      if (row.isWatchLater) {
        if (!Array.isArray(data) || data.length === 0) {
          if (!clearedSkeletons) {
            browseRows.innerHTML = "";
            clearedSkeletons = true;
          }
          // Show empty watch later message
          const emptyRow = document.createElement("div");
          emptyRow.className = "row";
          emptyRow.innerHTML = `
            <h2>Watch Later</h2>
            <div class="row-list" style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
              <p>Your watch later list is empty. Add movies and series to watch later from their detail pages.</p>
            </div>
          `;
          browseRows.appendChild(emptyRow);
          continue;
        }
      }
      
      if (!Array.isArray(data) || data.length === 0) {
        continue; // Skip empty rows
      }

      if (!clearedSkeletons) {
        browseRows.innerHTML = "";
        clearedSkeletons = true;
      }

      renderRow(row.title, data, row.type, browseRows);
    } catch (error) {
      console.error(`Failed to load ${row.title}:`, error);
    }
  }
}

function showBrowseSection() {
  if (!browseSection) return;
  browseSection.classList.remove("hidden");
}

function hideBrowseSection() {
  if (!browseSection) return;
  browseSection.classList.add("hidden");
}
