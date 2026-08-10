export const THEME_STORAGE_KEY = "devision-theme";

export type ThemePreference = "light" | "dark";

export function getSystemTheme(): ThemePreference {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    // Ignore private-mode / blocked storage.
  }
  return null;
}

export function resolveTheme(
  stored: ThemePreference | null,
): ThemePreference {
  return stored ?? getSystemTheme();
}

export function applyThemeClass(theme: ThemePreference) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}
