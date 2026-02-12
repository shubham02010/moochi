import { BACKEND_BASE } from "../core/config.js";
import { initHeader, initFooter } from "../ui/layout.ui.js";
import { applyTheme, applySavedTheme } from "../ui/theme.ui.js";
import { getSettings, updateSettings } from "../services/settings.service.js";

const themeInputs = document.querySelectorAll('input[name="theme"]');
const autoplayToggle = document.getElementById("autoplay-toggle");
const defaultServerSelect = document.getElementById("default-server");
const defaultServerStatus = document.getElementById("default-server-status");
const contentInputs = document.querySelectorAll('input[name="content-preference"]');

initHeader();
initFooter();
applySavedTheme();
hydrateSettings();
bindSettingsEvents();
loadServerOptions();

function hydrateSettings() {
  const settings = getSettings();

  themeInputs.forEach(input => {
    input.checked = input.value === settings.theme;
  });

  if (autoplayToggle) {
    autoplayToggle.checked = !!settings.player?.autoplay;
  }

  contentInputs.forEach(input => {
    input.checked = input.value === settings.content?.preference;
  });

  if (defaultServerSelect) {
    defaultServerSelect.value = settings.player?.defaultServer || "";
  }
}

function bindSettingsEvents() {
  themeInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      updateSettings({ theme: input.value });
      applyTheme(input.value);
    });
  });

  if (autoplayToggle) {
    autoplayToggle.addEventListener("change", () => {
      updateSettings({ player: { autoplay: autoplayToggle.checked } });
    });
  }

  if (defaultServerSelect) {
    defaultServerSelect.addEventListener("change", () => {
      updateSettings({ player: { defaultServer: defaultServerSelect.value } });
    });
  }

  contentInputs.forEach(input => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      updateSettings({ content: { preference: input.value } });
    });
  });
}

async function loadServerOptions() {
  if (!defaultServerSelect) return;

  try {
    defaultServerSelect.disabled = true;
    setStatus("Loading servers...");
    const response = await fetch(`${BACKEND_BASE}/api/streams?type=movie&id=1`);

    if (!response.ok) {
      throw new Error(`Server list unavailable (${response.status})`);
    }

    const data = await response.json();
    const providers = Array.isArray(data.providers) ? data.providers : [];

    if (providers.length === 0) {
      throw new Error("No providers found.");
    }

    defaultServerSelect.innerHTML = `
      <option value="">No default server</option>
      ${providers
        .map(provider => `<option value="${provider.id}">${provider.name}</option>`)
        .join("")}
    `;
    defaultServerSelect.disabled = false;

    const settings = getSettings();
    defaultServerSelect.value = settings.player?.defaultServer || "";
    setStatus("Select your preferred streaming server.");
  } catch (error) {
    console.error("Failed to load providers:", error);
    defaultServerSelect.innerHTML = `<option value="">No servers available</option>`;
    defaultServerSelect.disabled = true;
    setStatus("Servers are unavailable right now.");
  }
}

function setStatus(message) {
  if (defaultServerStatus) {
    defaultServerStatus.textContent = message;
  }
}
