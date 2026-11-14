"use client";
import { useTheme } from "./theme-provider";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { text } from "@/lib/i18n";
export function Preferences({ locale }: { locale: Locale }) {
  const path = usePathname(),
    params = useSearchParams();
  const { theme, cycle } = useTheme();
  const themeAction =
    theme === "dark"
      ? text(locale, "Activer le thème clair", "Switch to light mode")
      : text(locale, "Activer le thème sombre", "Switch to dark mode");
  const target = locale === "fr" ? "en" : "fr";
  return (
    <div className="preferences">
      <Link
        href={
          path.replace(/^\/(fr|en)/, "/" + target) +
          (params.size ? "?" + params.toString() : "")
        }
        hrefLang={target}
        onClick={() => {
          document.cookie =
            "242places-locale=" +
            target +
            "; Path=/; Max-Age=31536000; SameSite=Lax";
        }}
        aria-label={text(locale, "Passer en anglais", "Switch to French")}
      >
        {locale.toUpperCase()} <span>/ {target.toUpperCase()}</span>
      </Link>
      <button
        type="button"
        onClick={cycle}
        aria-label={themeAction}
        title={themeAction}
      >
        {theme === "light" ? <Sun /> : <Moon />}
      </button>
    </div>
  );
}
