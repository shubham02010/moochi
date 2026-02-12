/**
 * Profile Page
 * Coming Soon page for profile functionality
 */

import { initHeader } from "../ui/layout.ui.js";
import { applySavedTheme } from "../ui/theme.ui.js";
import { initFooter } from "../ui/layout.ui.js";

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();
  initHeader();
  initFooter();
});
