"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Theme = "system" | "light" | "dark";
const Context = createContext<{ theme: Theme; cycle: () => void }>({
  theme: "system",
  cycle: () => {},
});
const storedTheme = (): Theme => {
  try {
    const value = localStorage.getItem("242places-theme");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};
function apply(theme: Theme) {
  let resolved: Theme = theme;
  if (theme === "system") {
    try {
      resolved =
        typeof matchMedia === "function" &&
        matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    } catch {
      resolved = "dark";
    }
  }
  document.documentElement.dataset.theme = resolved;
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    const saved = storedTheme();
    setTheme(saved);
    apply(saved);
    const storage = (event: StorageEvent) => {
      if (event.key === "242places-theme") {
        const saved = storedTheme();
        setTheme(saved);
        apply(saved);
      }
    };
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, []);
  useEffect(() => {
    apply(theme);
    if (theme !== "system" || typeof matchMedia !== "function") return;
    const media = matchMedia("(prefers-color-scheme: light)");
    const sync = () => apply("system");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [theme]);
  function cycle() {
    const next =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    apply(next);
    try {
      next === "system"
        ? localStorage.removeItem("242places-theme")
        : localStorage.setItem("242places-theme", next);
    } catch {}
  }
  return (
    <Context.Provider value={{ theme, cycle }}>{children}</Context.Provider>
  );
}
export const useTheme = () => useContext(Context);
