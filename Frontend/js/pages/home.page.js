import { initHero } from "../home/hero.js";
import { getHomeRowSources } from "../services/rows.service.js";
import { renderRow, renderTrendingSection, renderTop10Grid, renderLatestEpisodes } from "../ui/rows.ui.js";
import { showRowSkeletons } from "../ui/skeleton.ui.js";
import { initHeader, initFooter } from "../ui/layout.ui.js";
import { applySavedTheme } from "../ui/theme.ui.js";
import { fetchTrendingAll, fetchAnime, fetchPopularTV } from "../core/tmdb.api.js";
import "../utilis/mouseEffect.js";

document.addEventListener("DOMContentLoaded", async () => {
  applySavedTheme();
  initHeader();
  initFooter();
  initHero();

  // Initialize special sections
  await initTrendingSection();
  await initTop10Section();
  await initLatestEpisodes();

  // Initialize standard rows
  await initContentRows();

  // Initialize time tabs
  initTimeTabs();
});

/* ===== TRENDING SECTION ===== */
async function initTrendingSection() {
  const container = document.getElementById("trending-grid");
  if (!container) return;

  try {
    const trending = await fetchTrendingAll();
    if (trending && trending.length > 0) {
      renderTrendingSection(trending.slice(0, 5), container);
    }
  } catch (error) {
    console.error("Failed to load trending section:", error);
  }
}

/* ===== TOP 10 SECTION ===== */
async function initTop10Section() {
  const container = document.getElementById("top10-grid");
  if (!container) return;

  try {
    // Use anime genre for top 10 anime
    const anime = await fetchAnime();
    if (anime && anime.length > 0) {
      renderTop10Grid(anime.slice(0, 10), container);
    }
  } catch (error) {
    console.error("Failed to load top 10 section:", error);
  }
}

/* ===== LATEST EPISODES ===== */
async function initLatestEpisodes() {
  const container = document.getElementById("latest-episodes");
  if (!container) return;

  try {
    const tvShows = await fetchPopularTV();
    if (tvShows && tvShows.length > 0) {
      renderLatestEpisodes(tvShows.slice(0, 10), container);
    }
  } catch (error) {
    console.error("Failed to load latest episodes:", error);
  }
}

/* ===== STANDARD CONTENT ROWS ===== */
async function initContentRows() {
  const rowsContainer = document.getElementById("rows");
  if (!rowsContainer) return;

  showRowSkeletons(4, rowsContainer);

  const sources = getHomeRowSources();
  let clearedSkeletons = false;

  for (const row of sources) {
    try {
      const data = await row.fetcher();
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`No data for ${row.title}`);
        continue;
      }

      if (!clearedSkeletons && rowsContainer) {
        rowsContainer.innerHTML = "";
        clearedSkeletons = true;
      }

      renderRow(row.title, data, row.type, rowsContainer);
    } catch (error) {
      console.error(`Failed to load ${row.title}:`, error);
    }
  }
}

/* ===== TIME TABS ===== */
function initTimeTabs() {
  const tabs = document.querySelectorAll(".time-tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", async () => {
      // Update active state
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Could fetch different data based on period
      // For now, just visual feedback
      const period = tab.dataset.period;
      console.log("Selected time period:", period);
    });
  });
}
