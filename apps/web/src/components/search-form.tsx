"use client";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import { PlaceAutocomplete } from "./place-autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { resources } from "@/lib/search-state";
import { label, text, type Locale } from "@/lib/i18n";
export function SearchForm({
  locale,
  scope,
}: {
  locale: Locale;
  scope?: "departments";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(""),
    [resource, setResource] = useState<string>(scope ?? "");
  return (
    <form
      action={"/" + locale + "/explore"}
      className="search-capsule"
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (resource) params.set("resource", resource);
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
      <PlaceAutocomplete
        locale={locale}
        value={query}
        onChange={setQuery}
        resource={resource}
        onSelect={(id) => router.push("/" + locale + "/places/" + id)}
      />
      {!scope && (
        <Select
          value={resource || "all"}
          onValueChange={(value) => setResource(value === "all" ? "" : value)}
        >
          <SelectTrigger
            className="home-category"
            aria-label={text(locale, "Type de lieu", "Place type")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {text(locale, "Tous les lieux", "All places")}
            </SelectItem>
            {resources.map((resource) => (
              <SelectItem key={resource} value={resource}>
                {label(resource, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
