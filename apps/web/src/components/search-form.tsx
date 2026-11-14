"use client";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { text, type Locale } from "@/lib/i18n";
export function SearchForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  return (
    <form
      action={"/" + locale + "/explore"}
      className="search-capsule"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        for (const key of ["q", "resource"]) {
          const value = String(data.get(key) ?? "").trim();
          if (value) params.set(key, value);
        }
        router.push(
          "/" +
            locale +
            "/explore" +
            (params.size ? "?" + params.toString() : ""),
        );
      }}
      role="search"
    >
      <Search size={20} aria-hidden="true" />
      <Input
        name="q"
        maxLength={100}
        placeholder={text(locale, "Rechercher un lieu…", "Search for a place…")}
        aria-label={text(locale, "Rechercher un lieu", "Search for a place")}
      />
      <select
        name="resource"
        aria-label={text(locale, "Type de lieu", "Place type")}
        defaultValue=""
      >
        <option value="">{text(locale, "Tous les lieux", "All places")}</option>
        <option value="communes">{text(locale, "Communes", "Communes")}</option>
        <option value="neighborhoods">
          {text(locale, "Quartiers", "Neighborhoods")}
        </option>
        <option value="villages">{text(locale, "Villages", "Villages")}</option>
      </select>
      <Button
        type="submit"
        size="icon"
        className="round-button"
        aria-label={text(locale, "Rechercher", "Search")}
      >
        <ArrowRight />
      </Button>
    </form>
  );
}
