"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Theme = "light" | "dark";
type Preference = Theme | "system";
const Context = createContext<{ theme: Theme; cycle: () => void }>({
  theme: "dark",
  cycle: () => {},
});
function storedTheme(): Preference {
  try {
    const saved = localStorage.getItem("242places-theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}
function resolveTheme(preference: Preference): Theme {
  if (preference !== "system") return preference;
  try {
    return typeof matchMedia === "function" &&
      matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<Preference>();
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setPreference(storedTheme());
    const sync = (event: StorageEvent) => {
      if (event.key === "242places-theme" || event.key === null)
        setPreference(storedTheme());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!preference) return;
    const sync = () => {
      const next = resolveTheme(preference);
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    sync();
    if (preference !== "system" || typeof matchMedia !== "function") return;
    try {
      const media = matchMedia("(prefers-color-scheme: light)");
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    } catch {}
  }, [preference]);
  function cycle() {
    const next = theme === "light" ? "dark" : "light";
    setPreference(next);
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("242places-theme", next);
    } catch {}
  }
  return (
    <Context.Provider value={{ theme, cycle }}>{children}</Context.Provider>
  );
}
export const useTheme = () => useContext(Context);
