import { BACKEND_BASE, BASE_URL, API_KEY, IMAGE_BASE } from "../core/config.js";
import { applySavedTheme } from "../ui/theme.ui.js";

/* ===== URL PARAMS ===== */
const params = new URLSearchParams(window.location.search);
const mediaType = params.get("type") || "movie"; // "movie" or "series"
const mediaId = params.get("id");
const seasonNum = parseInt(params.get("s")) || 1;
const episodeNum = parseInt(params.get("e")) || 1;

if (!mediaId) {
    window.location.href = "/";
}

/* ===== STATE ===== */
let mediaData = null;
let episodes = [];
let currentSeason = seasonNum;
let currentEpisode = episodeNum;
let currentAudio = "sub"; // "sub" or "dub"
let providers = [];
let currentServer = null;

/* ===== ELEMENTS ===== */
const mediaTitle = document.getElementById("media-title");
const watchViews = document.getElementById("watch-views");
const videoIframe = document.getElementById("video-iframe");
const playerLoading = document.getElementById("player-loading");
const loadingText = document.getElementById("loading-text");
const episodeLabel = document.getElementById("episode-label");
const episodeList = document.getElementById("episode-list");
const episodeCount = document.getElementById("episode-count");
const watchSidebar = document.getElementById("watch-sidebar");
const serverOptions = document.getElementById("server-options");
const audioOptions = document.getElementById("audio-options");
const prevEpBtn = document.getElementById("prev-ep-btn");
const nextEpBtn = document.getElementById("next-ep-btn");

/* ===== INIT ===== */
applySavedTheme();
init();

async function init() {
    try {
        // Fetch media details from TMDB
        if (mediaType === "series" || mediaType === "tv") {
            const res = await fetch(`${BASE_URL}/tv/${mediaId}?api_key=${API_KEY}&append_to_response=credits`);
            mediaData = await res.json();

            // Show sidebar for series
            watchSidebar.classList.remove("hidden");

            // Fetch season episodes
            await loadSeasonEpisodes(currentSeason);
        } else {
            const res = await fetch(`${BASE_URL}/movie/${mediaId}?api_key=${API_KEY}`);
            mediaData = await res.json();

            // Hide sidebar for movies
            watchSidebar.classList.add("hidden");
        }

        // Update title
        const title = mediaData.title || mediaData.name;
        mediaTitle.textContent = title;
        document.title = `${title} - Moochi`;

        // Fetch and play stream
        await loadStream();

        // Setup audio toggle
        setupAudioToggle();

    } catch (err) {
        console.error("Failed to load media:", err);
        showError("Failed to load media. Please try again.");
    }
}

/* ===== LOAD SEASON EPISODES ===== */
async function loadSeasonEpisodes(seasonNumber) {
    try {
        const res = await fetch(`${BASE_URL}/tv/${mediaId}/season/${seasonNumber}?api_key=${API_KEY}`);
        const data = await res.json();

        episodes = data.episodes || [];
        currentSeason = seasonNumber;

        // Update episode count
        episodeCount.textContent = episodes.length;

        // Render episode list
        renderEpisodeList();

        // Update episode label
        updateEpisodeLabel();

        // Setup navigation buttons
        setupNavigation();

    } catch (err) {
        console.error("Failed to load episodes:", err);
    }
}

/* ===== RENDER EPISODE LIST ===== */
function renderEpisodeList() {
    episodeList.innerHTML = "";

    episodes.forEach((ep, index) => {
        const epNum = index + 1;
        const isActive = epNum === currentEpisode;

        const item = document.createElement("div");
        item.className = `episode-item ${isActive ? "episode-item--active" : ""}`;
        item.innerHTML = `
      <div class="episode-item__play">
        <span class="material-symbols-outlined">play_arrow</span>
      </div>
      <div class="episode-item__info">
        <div class="episode-item__number">EP ${epNum}</div>
        <div class="episode-item__title">${ep.name || `Episode ${epNum}`}</div>
      </div>
    `;

        item.onclick = () => {
            currentEpisode = epNum;
            loadStream();
            renderEpisodeList();
            updateEpisodeLabel();
            setupNavigation();
            updateUrl();
        };

        episodeList.appendChild(item);
    });
}

/* ===== UPDATE EPISODE LABEL ===== */
function updateEpisodeLabel() {
    if (mediaType === "series" || mediaType === "tv") {
        const ep = episodes[currentEpisode - 1];
        const epName = ep?.name || `Episode ${currentEpisode}`;
        episodeLabel.textContent = `Episode ${currentEpisode} - ${epName}`;
    } else {
        episodeLabel.textContent = mediaData?.title || "";
    }
}

/* ===== SETUP NAVIGATION ===== */
function setupNavigation() {
    if (mediaType === "series" || mediaType === "tv") {
        const hasPrev = currentEpisode > 1;
        const hasNext = currentEpisode < episodes.length;

        prevEpBtn.disabled = !hasPrev;
        nextEpBtn.disabled = !hasNext;

        prevEpBtn.onclick = () => {
            if (hasPrev) {
                currentEpisode--;
                loadStream();
                renderEpisodeList();
                updateEpisodeLabel();
                setupNavigation();
                updateUrl();
            }
        };

        nextEpBtn.onclick = () => {
            if (hasNext) {
                currentEpisode++;
                loadStream();
                renderEpisodeList();
                updateEpisodeLabel();
                setupNavigation();
                updateUrl();
            }
        };
    }
}

/* ===== UPDATE URL ===== */
function updateUrl() {
    const url = new URL(window.location);
    url.searchParams.set("s", currentSeason);
    url.searchParams.set("e", currentEpisode);
    window.history.replaceState({}, "", url);
}

/* ===== LOAD STREAM ===== */
async function loadStream() {
    showLoading("Loading stream...");

    try {
        let apiUrl;
        if (mediaType === "series" || mediaType === "tv") {
            apiUrl = `${BACKEND_BASE}/api/streams?type=series&id=${mediaId}&s=${currentSeason}&e=${currentEpisode}`;
        } else {
            apiUrl = `${BACKEND_BASE}/api/streams?type=movie&id=${mediaId}`;
        }

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();
        providers = Array.isArray(data.providers) ? data.providers : [];

        if (providers.length === 0) {
            throw new Error("No streaming providers available");
        }

        // Render server options
        renderServerOptions();

        // Auto-select first server (or preferred)
        const defaultServer = providers[0];
        selectServer(defaultServer);

    } catch (err) {
        console.error("Failed to load stream:", err);
        showError("Failed to load stream. Please try again.");
    }
}

/* ===== RENDER SERVER OPTIONS ===== */
function renderServerOptions() {
    serverOptions.innerHTML = "";

    providers.forEach((p, index) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = p.name;
        btn.dataset.id = p.id;

        btn.onclick = () => {
            selectServer(p);
        };

        serverOptions.appendChild(btn);
    });
}

/* ===== SELECT SERVER ===== */
function selectServer(provider) {
    currentServer = provider;

    // Update active state
    serverOptions.querySelectorAll(".option-btn").forEach(btn => {
        btn.classList.toggle("option-btn--active", btn.dataset.id === provider.id);
    });

    // Update loading text
    showLoading(`Loading ${provider.name}...`);

    // Set iframe source
    videoIframe.src = provider.embedUrl;

    // Hide loading after iframe loads
    videoIframe.onload = () => {
        hideLoading();
    };

    // Timeout fallback
    setTimeout(hideLoading, 5000);
}

/* ===== SETUP AUDIO TOGGLE ===== */
function setupAudioToggle() {
    audioOptions.querySelectorAll(".option-btn").forEach(btn => {
        btn.onclick = () => {
            currentAudio = btn.dataset.audio;

            // Update active state
            audioOptions.querySelectorAll(".option-btn").forEach(b => {
                b.classList.toggle("option-btn--active", b.dataset.audio === currentAudio);
            });

            // Reload stream with new audio preference
            loadStream();
        };
    });
}

/* ===== LOADING STATES ===== */
function showLoading(text = "Loading...") {
    loadingText.textContent = text;
    playerLoading.classList.remove("hidden");
}

function hideLoading() {
    playerLoading.classList.add("hidden");
}

function showError(message) {
    loadingText.textContent = message;
    playerLoading.querySelector(".watch-player__spinner").style.display = "none";
}
