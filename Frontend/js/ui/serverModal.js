import { BACKEND_BASE } from "../core/config.js";
import { getSettings } from "../services/settings.service.js";

const modal = document.getElementById("server-modal");
const modalContent = document.getElementById("server-modal-content");
const list = document.getElementById("server-list");

let providers = [];
let timer = null;

function hasModal() {
  return !!(modal && modalContent && list);
}

export function initServerModal() {
  if (!hasModal()) return;

  modal.querySelectorAll("[data-server-modal-close]").forEach(btn => {
    btn.addEventListener("click", closeServerModal);
  });
}

export function closeServerModal() {
  if (!hasModal()) return;
  stop();

  modalContent.classList.remove("scale-100", "opacity-100");
  modalContent.classList.add("scale-95", "opacity-0");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

export async function openServerModal(params) {
  if (!hasModal()) return;
  // Show modal with fade-in animation
  modal.classList.remove("hidden");
  
  // Trigger animation after a frame
  requestAnimationFrame(() => {
    modalContent.classList.remove("scale-95", "opacity-0");
    modalContent.classList.add("scale-100", "opacity-100");
  });
  
  // Show loading state
  list.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 space-y-4">
      <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p class="text-text-muted text-sm">Scanning servers...</p>
    </div>
  `;

  try {
    const res = await fetch(`${BACKEND_BASE}/api/streams?${params}`);
    if (!res.ok) {
      throw new Error(`Server request failed (${res.status})`);
    }
    const data = await res.json();

    providers = Array.isArray(data.providers) ? data.providers : [];
    if (providers.length === 0) {
      throw new Error("No streaming providers available");
    }
    render();

    const settings = getSettings();
    const preferredId = settings.player?.defaultServer;
    const shouldAutoplay = settings.player?.autoplay;
    const preferredProvider = preferredId
      ? providers.find(p => p.id === preferredId)
      : null;

    if (shouldAutoplay && preferredProvider) {
      play(preferredProvider.embedUrl, preferredProvider.name);
      return;
    }

    start();
  } catch (err) {
    console.error("Failed to fetch servers:", err);
    providers = [];
    list.innerHTML = `
      <div class="flex flex-col items-center justify-center py-8 space-y-4 text-center">
        <span class="material-symbols-outlined text-4xl text-bad">error</span>
        <p class="text-text-muted text-sm">Failed to load servers. Please try again.</p>
      </div>
    `;
  }
}

function render() {
  list.innerHTML = "";
  const preferredId = getSettings().player?.defaultServer;
  
  providers.forEach((p, index) => {
    const el = document.createElement("div");
    el.className = "server-item group cursor-pointer relative overflow-hidden bg-surface-card rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20";
    el.dataset.id = p.id;
    el.style.animationDelay = `${index * 50}ms`;
    el.classList.add("animate-slideIn");

    if (preferredId && p.id === preferredId) {
      el.classList.add("ring-1", "ring-primary/60", "ring-offset-2", "ring-offset-background-dark");
    }

    el.innerHTML = `
      <!-- Server Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
            </svg>
          </div>
          <div>
            <h3 class="text-white font-bold text-base">${p.name}</h3>
            <p class="server-latency text-gray-400 text-xs font-medium">Checking connection...</p>
          </div>
        </div>
        <div class="server-badge hidden items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg shadow-green-500/40">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
          </svg>
          FASTEST
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="relative h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
        <div class="server-progress absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-lg" style="width: 0%"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      </div>
      
      <!-- Quality Indicator -->
      <div class="flex items-center justify-between mt-2.5">
        <span class="server-quality text-sm font-semibold text-gray-300">Testing...</span>
        <span class="server-ms text-sm font-mono font-bold text-blue-400"></span>
      </div>
      
      <!-- Hover Effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
    `;

    el.onclick = () => play(p.embedUrl, p.name);
    list.appendChild(el);
  });
}

function start() {
  stop();
  scan();
  timer = setInterval(scan, 10000);
}

function stop() {
  if (timer) clearInterval(timer);
}

async function scan() {
  if (!providers.length) return;

  let best = null;
  const results = [];

  for (const p of providers) {
    const ms = await measure(new URL(p.embedUrl).origin);
    results.push({ id: p.id, ms });
    
    if (!best || ms < best.ms) {
      best = { id: p.id, ms };
    }
    
    update(p.id, ms);
  }

  // Update best server indicator
  if (!best) return;

  document.querySelectorAll(".server-item").forEach(el => {
    const badge = el.querySelector(".server-badge");
    if (el.dataset.id === best.id) {
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background-dark");
      badge.classList.remove("hidden");
      badge.classList.add("flex");
    } else {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background-dark");
      badge.classList.remove("flex");
      badge.classList.add("hidden");
    }
  });
}

function measure(origin) {
  const t = performance.now();
  const l = document.createElement("link");
  l.rel = "preconnect";
  l.href = origin;
  document.head.appendChild(l);

  return new Promise(r =>
    setTimeout(() => {
      l.remove();
      r(Math.round(performance.now() - t));
    }, 150)
  );
}

function update(id, ms) {
  const el = document.querySelector(`.server-item[data-id="${id}"]`);
  if (!el) return;
  
  const latency = el.querySelector(".server-latency");
  const quality = el.querySelector(".server-quality");
  const msLabel = el.querySelector(".server-ms");
  const progress = el.querySelector(".server-progress");

  msLabel.textContent = `${ms}ms`;

  if (ms < 180) {
    latency.textContent = "⚡ Excellent Connection";
    latency.className = "server-latency text-green-400 text-xs font-bold";
    quality.textContent = "⚡ Excellent";
    quality.className = "server-quality text-sm font-bold text-green-400";
    progress.style.width = "95%";
    progress.className = "server-progress absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-emerald-400 to-green-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-green-500/50";
  } else if (ms < 350) {
    latency.textContent = "✓ Stable Connection";
    latency.className = "server-latency text-yellow-400 text-xs font-bold";
    quality.textContent = "✓ Good";
    quality.className = "server-quality text-sm font-bold text-yellow-400";
    progress.style.width = "65%";
    progress.className = "server-progress absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-yellow-500/50";
  } else {
    latency.textContent = "⚠ Limited Connection";
    latency.className = "server-latency text-red-400 text-xs font-bold";
    quality.textContent = "⚠ Slow";
    quality.className = "server-quality text-sm font-bold text-red-400";
    progress.style.width = "35%";
    progress.className = "server-progress absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-red-500/50";
  }
}

function play(url, serverName) {
  stop();
  
  // Animate modal close
  modalContent.classList.remove("scale-100", "opacity-100");
  modalContent.classList.add("scale-95", "opacity-0");
  
  setTimeout(() => {
    modal.classList.add("hidden");
    
    // Show success notification (optional)
    console.log(`Playing on ${serverName}...`);
    
    // Play video inline instead of new window
    playVideoInline(url, serverName);
  }, 300);
}

// Play video inline at the top
function playVideoInline(url, serverName) {
  const playerContainer = document.getElementById("video-player-container");
  const playerIframe = document.getElementById("video-player-iframe");
  const backdropContainer = document.getElementById("movie-backdrop") || 
                           document.getElementById("series-backdrop");
  const closeButton = document.getElementById("close-player");
  
  if (!playerContainer || !playerIframe) {
    // Fallback to new window if elements not found
    window.open(url, "_blank");
    return;
  }
  
  // Smooth transition - fade in player
  playerContainer.style.opacity = "0";
  playerContainer.classList.remove("hidden");
  playerContainer.style.transition = "opacity 0.5s ease";
  
  // Set iframe source
  playerIframe.src = url;
  
  // Fade in
  setTimeout(() => {
    playerContainer.style.opacity = "1";
    playerContainer.style.pointerEvents = "auto";
  }, 50);
  
  // Hide backdrop with fade
  if (backdropContainer) {
    backdropContainer.style.transition = "opacity 0.5s ease";
    backdropContainer.style.opacity = "0";
    setTimeout(() => {
      backdropContainer.style.display = "none";
    }, 500);
  }
  
  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
  
  // Add "More Servers" button below player
  addMoreServersButton();
  
  // Setup close button and keyboard shortcuts
  const closePlayer = () => {
    // Fade out player
    playerContainer.style.opacity = "0";
    
    setTimeout(() => {
      playerIframe.src = "";
      playerContainer.classList.add("hidden");
      playerContainer.style.pointerEvents = "none";
      
      // Remove more servers button
      const moreServersBtn = document.getElementById("more-servers-btn");
      if (moreServersBtn) moreServersBtn.remove();
      
      // Restore backdrop
      if (backdropContainer) {
        backdropContainer.style.display = "block";
        setTimeout(() => {
          backdropContainer.style.opacity = "1";
        }, 10);
      }
      
      // Remove keyboard listener
      document.removeEventListener('keydown', handleKeyPress);
    }, 500);
  };
  
  // Close button handler
  if (closeButton) {
    closeButton.onclick = closePlayer;
  }
  
  // Keyboard shortcuts handler
  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      closePlayer();
    }
    if (e.key === 'f' || e.key === 'F') {
      if (playerIframe.requestFullscreen) {
        playerIframe.requestFullscreen();
      }
    }
  };
  
  document.addEventListener('keydown', handleKeyPress);
  showToast(`Now playing on ${serverName}`, "success");
}

// Add "More Servers" button below player
function addMoreServersButton() {
  // Remove existing button if any
  const existing = document.getElementById("more-servers-btn");
  if (existing) existing.remove();
  
  const playerContainer = document.getElementById("video-player-container");
  if (!playerContainer) return;
  
  const btn = document.createElement("button");
  btn.id = "more-servers-btn";
  btn.className = "absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-2xl flex items-center gap-2 transition-all hover:scale-105 z-50";
  btn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
    </svg>
    More Servers
  `;
  
  btn.onclick = () => {
    // Get current movie/series ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = window.location.pathname.includes('series') ? 'series' : 'movie';
    
    if (type === 'series') {
      // For series, need season and episode - show modal to re-select
      showToast("Please select an episode to change server", "info");
    } else {
      openServerModal(`type=${type}&id=${id}`);
    }
  };
  
  const shell = playerContainer.querySelector("[data-player-shell]");
  (shell || playerContainer.querySelector("div") || playerContainer).appendChild(btn);
}

// Toast notification function
function showToast(message, type = "info") {
  const existingToast = document.getElementById("toast-notification");
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement("div");
  toast.id = "toast-notification";
  toast.className = `fixed top-20 right-4 z-[10000] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 transform translate-x-0 transition-all duration-300 ${
    type === "success" ? "bg-good text-white" : 
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

// Add custom CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.4s ease-out forwards;
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
document.head.appendChild(style);
