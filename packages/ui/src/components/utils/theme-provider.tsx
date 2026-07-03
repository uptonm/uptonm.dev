"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark";

export type ThemeContextState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Syncs React state with the `dark` class on <html>.
 *
 * The initial class is set by an inline script in the root layout (before first
 * paint) to avoid a flash of the wrong theme, so here we read that class on
 * mount and keep it in sync from then on.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore storage errors (e.g. private mode) */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "light" : "dark",
    );
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextState => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
