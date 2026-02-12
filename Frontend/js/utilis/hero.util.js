/**
 * Reusable Hero Utility
 * Provides hero rendering functionality for home, movie, and series pages
 */

import { fetchMediaLogo } from "./tmdb-logo.js";

/**
 * Renders hero title (logo or text fallback) for any media type
 * @param {Object} media - Media object (movie or series)
 * @param {HTMLElement} logoContainer - Container for logo image
 * @param {HTMLElement} titleElement - Container for text fallback
 * @returns {Promise<void>}
 */
export async function renderHeroTitle(media, logoContainer, titleElement) {
  if (!media || !media.id) return;

  // Clear previous content
  if (logoContainer) logoContainer.innerHTML = "";
  if (titleElement) {
    titleElement.textContent = "";
    titleElement.classList.remove("hero-title-fallback");
  }

  // Try to fetch logo
  const logoUrl = await fetchMediaLogo(media);

  if (logoUrl && logoContainer) {
    // Render logo in logo container
    const logoImg = document.createElement("img");
    logoImg.src = logoUrl;
    logoImg.alt = media.title || media.name || "Title";
    logoImg.className = "hero-logo";
    
    // Mark container as having logo
    logoContainer.classList.add("has-logo");
    if (titleElement) {
      titleElement.classList.remove("hero-title-fallback");
    }
    
    // Handle logo load error - fallback to text
    logoImg.onerror = () => {
      logoContainer.innerHTML = "";
      logoContainer.classList.remove("has-logo");
      if (titleElement) {
        titleElement.textContent = media.title || media.name || "Untitled";
        titleElement.classList.add("hero-title-fallback");
      }
    };

    logoContainer.appendChild(logoImg);
  } else {
    // Fallback to text in title element
    if (titleElement) {
      titleElement.textContent = media.title || media.name || "Untitled";
      titleElement.classList.add("hero-title-fallback");
    }
    if (logoContainer) {
      logoContainer.classList.remove("has-logo");
    }
  }
}

/**
 * Sets hero description with proper class for CSS clamping
 * @param {HTMLElement} descriptionElement - Description element
 * @param {string} text - Description text
 */
export function setHeroDescription(descriptionElement, text) {
  if (!descriptionElement) return;
  
  descriptionElement.textContent = text || "";
  descriptionElement.classList.add("hero-description");
}

/**
 * Creates hero structure HTML (for movie/series pages)
 * @returns {string} HTML string for hero structure
 */
export function createHeroStructure() {
  return `
    <div class="hero-content">
      <div class="hero-title-wrapper">
        <div class="hero-logo-container" id="hero-logo-container"></div>
        <h1 id="hero-title" class="hero-title-text"></h1>
      </div>
      <p id="hero-description" class="hero-description"></p>
      <button id="hero-play" class="hero-play-button">
        <img src="/assets/images/icons/play-button.png" alt="Play">
        Play Now
      </button>
    </div>
  `;
}
