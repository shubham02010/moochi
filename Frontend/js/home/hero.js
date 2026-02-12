import { fetchNowPlaying } from "../core/tmdb.api.js";
import { IMAGE_BASE } from "../core/config.js";
import {
  showHeroSkeleton,
  hideHeroSkeleton
} from "../ui/skeleton.ui.js";
import { renderHeroTitle, setHeroDescription } from "../utilis/hero.util.js";

let heroMovies = [];
let currentIndex = 0;
let slideInterval = null;
let progressInterval = null;
const SLIDE_DURATION = 6000; // 6 seconds per slide
const TRANSITION_DURATION = 600; // 600ms for smooth transitions

export async function initHero() {
  showHeroSkeleton();

  try {
    heroMovies = await fetchNowPlaying();

    if (!heroMovies || heroMovies.length === 0) {
      console.warn("No hero movies found");
      hideHeroSkeleton();
      return;
    }

    hideHeroSkeleton();
    renderIndicators();
    await renderHero(heroMovies[0], false); // Initial render without animation
    setupNavigation();
    startAutoSlide();
  } catch (error) {
    console.error("Failed to initialize hero:", error);
    hideHeroSkeleton();
  }
}

/* ===== NAVIGATION CONTROLS ===== */
function setupNavigation() {
  const prevBtn = document.getElementById("hero-prev");
  const nextBtn = document.getElementById("hero-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      goToPrevSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      goToNextSlide();
    });
  }
}

function goToPrevSlide() {
  currentIndex = (currentIndex - 1 + heroMovies.length) % heroMovies.length;
  renderHero(heroMovies[currentIndex], true);
  startAutoSlide(); // Reset auto-slide timer
}

function goToNextSlide() {
  currentIndex = (currentIndex + 1) % heroMovies.length;
  renderHero(heroMovies[currentIndex], true);
  startAutoSlide(); // Reset auto-slide timer
}

/* ===== RENDER HERO ===== */
async function renderHero(movie, animate = true) {
  const img = document.getElementById("hero-image");
  const heroContent = document.querySelector(".hero-content");
  const heroPreview = document.querySelector(".hero-preview");
  const logoContainer = document.getElementById("hero-logo-container");
  const title = document.getElementById("hero-title");
  const overview = document.getElementById("hero-overview");
  const playBtn = document.getElementById("hero-play");
  const infoBtn = document.getElementById("hero-info");
  const heroMeta = document.getElementById("hero-meta");
  const previewImage = document.getElementById("preview-image");
  const previewTitle = document.getElementById("preview-title");
  const previewInfo = document.querySelector(".preview-info");

  if (!img || !movie) return;

  // Update indicators IMMEDIATELY (synchronized with transition start)
  updateIndicators();

  if (animate) {
    // Add transitioning class for synchronized fade
    img.classList.add("hero-transitioning");
    if (heroContent) heroContent.classList.add("hero-content-transitioning");
    if (heroPreview) heroPreview.classList.add("hero-preview-transitioning");
  }

  // Wait for fade out to complete
  await new Promise(resolve => setTimeout(resolve, animate ? TRANSITION_DURATION / 2 : 0));

  // Update all content while faded out
  if (movie.backdrop_path) {
    img.src = `${IMAGE_BASE}/original${movie.backdrop_path}`;
  }

  // Set description
  if (overview) {
    setHeroDescription(overview, movie.overview);
  }

  // Set metadata tags
  if (heroMeta) {
    heroMeta.innerHTML = "";

    // Type tag
    const typeTag = document.createElement("span");
    typeTag.className = "meta-tag";
    typeTag.textContent = movie.media_type === "tv" ? "TV SERIES" : "MOVIE";
    heroMeta.appendChild(typeTag);

    // Release Date
    const dateStr = movie.release_date || movie.first_air_date;
    if (dateStr) {
      const dateTag = document.createElement("span");
      dateTag.className = "meta-tag";
      dateTag.textContent = new Date(dateStr).getFullYear();
      heroMeta.appendChild(dateTag);
    }

    // Rating
    if (movie.vote_average) {
      const ratingTag = document.createElement("span");
      ratingTag.className = "meta-tag";
      ratingTag.innerHTML = `★ ${movie.vote_average.toFixed(1)}`;
      ratingTag.style.color = "#fbbf24";
      heroMeta.appendChild(ratingTag);
    }

    // Language
    if (movie.original_language) {
      const langTag = document.createElement("span");
      langTag.className = "meta-tag";
      langTag.textContent = movie.original_language.toUpperCase();
      heroMeta.appendChild(langTag);
    }
  }

  // Set preview card
  if (previewImage && movie.poster_path) {
    previewImage.src = `${IMAGE_BASE}/w500${movie.poster_path}`;
  }

  // Set preview info
  if (previewInfo) {
    previewInfo.innerHTML = "";
    if (movie.original_language) {
      const langSpan = document.createElement("span");
      langSpan.className = "preview-lang";
      langSpan.textContent = getLanguageName(movie.original_language);
      previewInfo.appendChild(langSpan);
    }
    if (movie.vote_average) {
      const starSpan = document.createElement("span");
      starSpan.className = "preview-star";
      starSpan.innerHTML = `★ ${movie.vote_average.toFixed(1)}`;
      previewInfo.appendChild(starSpan);
    }
  }

  if (previewTitle) {
    previewTitle.textContent = movie.title || movie.name || "Original Title";
  }

  // Play button action
  if (playBtn) {
    playBtn.onclick = () => {
      const mediaType = movie.media_type || "movie";
      if (mediaType === "tv") {
        window.location.href = `/series.html?id=${movie.id}`;
      } else {
        window.location.href = `/movie.html?id=${movie.id}`;
      }
    };
  }

  // Info button action
  if (infoBtn) {
    infoBtn.onclick = () => {
      const mediaType = movie.media_type || "movie";
      if (mediaType === "tv") {
        window.location.href = `/series.html?id=${movie.id}`;
      } else {
        window.location.href = `/movie.html?id=${movie.id}`;
      }
    };
  }

  // Render title/logo
  if (logoContainer && title) {
    await renderHeroTitle({
      id: movie.id,
      media_type: movie.media_type || "movie",
      title: movie.title || movie.name
    }, logoContainer, title);
  }

  // Remove transitioning class to fade back in
  if (animate) {
    img.classList.remove("hero-transitioning");
    if (heroContent) heroContent.classList.remove("hero-content-transitioning");
    if (heroPreview) heroPreview.classList.remove("hero-preview-transitioning");
  }
}

function getLanguageName(code) {
  const languages = {
    'en': 'ENGLISH',
    'ja': 'JAPANESE',
    'ko': 'KOREAN',
    'es': 'SPANISH',
    'fr': 'FRENCH',
    'de': 'GERMAN',
    'it': 'ITALIAN',
    'zh': 'CHINESE',
    'hi': 'HINDI'
  };
  return languages[code] || code.toUpperCase();
}

/* ===== AUTO SLIDE ===== */
function startAutoSlide() {
  stopAutoSlide();
  resetProgress();

  slideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % heroMovies.length;
    renderHero(heroMovies[currentIndex], true);
    resetProgress();
  }, SLIDE_DURATION);
}

function stopAutoSlide() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

/* ===== PROGRESS INDICATOR ===== */
function resetProgress() {
  // Reset all progress bars
  const dots = document.querySelectorAll(".hero-indicators .dot");
  dots.forEach(dot => {
    const progress = dot.querySelector(".dot-progress");
    if (progress) {
      progress.style.transition = "none";
      progress.style.width = "0%";
    }
  });

  // Animate current dot's progress
  requestAnimationFrame(() => {
    const activeDot = document.querySelector(".hero-indicators .dot.active .dot-progress");
    if (activeDot) {
      activeDot.style.transition = `width ${SLIDE_DURATION}ms linear`;
      activeDot.style.width = "100%";
    }
  });
}

/* ===== INDICATORS ===== */
function renderIndicators() {
  const container = document.getElementById("hero-indicators");
  if (!container) return;

  container.innerHTML = "";

  heroMovies.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = "dot";

    // Add progress bar inside each dot
    const progress = document.createElement("div");
    progress.className = "dot-progress";
    dot.appendChild(progress);

    dot.onclick = () => {
      if (currentIndex === index) return; // Don't restart if clicking current
      currentIndex = index;
      renderHero(heroMovies[currentIndex], true);
      startAutoSlide(); // Reset timer
    };

    container.appendChild(dot);
  });

  updateIndicators();
}

function updateIndicators() {
  const dots = document.querySelectorAll(".hero-indicators .dot");
  dots.forEach((dot, index) => {
    const isActive = index === currentIndex;
    dot.classList.toggle("active", isActive);

    // Reset progress on non-active dots
    const progress = dot.querySelector(".dot-progress");
    if (progress && !isActive) {
      progress.style.transition = "none";
      progress.style.width = "0%";
    }
  });

  // Update spotlight badge with current position
  const spotlightBadge = document.getElementById("spotlight-badge");
  if (spotlightBadge) {
    const badgeText = spotlightBadge.querySelector("span:last-child");
    if (badgeText) {
      badgeText.textContent = `#${currentIndex + 1} SPOTLIGHT`;
    }
  }
}
