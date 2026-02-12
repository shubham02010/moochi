const STORAGE_KEY = "mikasa_settings";

const DEFAULT_SETTINGS = {
  theme: "dark",
  player: {
    defaultServer: "",
    autoplay: false
  },
  content: {
    preference: "all"
  }
};

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function mergeSettings(base, overrides) {
  const result = { ...base };
  if (!isObject(overrides)) return result;

  Object.keys(overrides).forEach(key => {
    if (isObject(overrides[key]) && isObject(base[key])) {
      result[key] = mergeSettings(base[key], overrides[key]);
    } else if (overrides[key] !== undefined) {
      result[key] = overrides[key];
    }
  });

  return result;
}

export function getSettings() {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return mergeSettings(DEFAULT_SETTINGS, parsed);
  } catch (error) {
    console.error("Failed to read settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(nextSettings) {
  if (typeof window === "undefined") return nextSettings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  return nextSettings;
}

export function updateSettings(patch) {
  const current = getSettings();
  const next = mergeSettings(current, patch);
  return saveSettings(next);
}
