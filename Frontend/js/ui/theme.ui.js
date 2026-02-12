import { getSettings } from "../services/settings.service.js";

const themeMap = {
  dark: "dark",
  ice: "ice",
  rose: "rose"
};

export function applyTheme(themeKey) {
  const theme = themeMap[themeKey] || "dark";
  document.documentElement.setAttribute("data-theme", theme);
}

export function applySavedTheme() {
  const settings = getSettings();
  applyTheme(settings.theme);
}
