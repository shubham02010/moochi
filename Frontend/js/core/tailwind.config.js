const themeConfig = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        "primary-hover": "#60a5fa",
        "bg-main": "#000000",
        "bg-card": "#11151f",
        "bg-elevated": "#1a1f2e"
      }
    }
  }
};

window.tailwind = { config: themeConfig };

export {};
