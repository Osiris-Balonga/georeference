"use client";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { label, text, type Locale } from "@/lib/i18n";

type Suggestion = {
  id: string;
  name: string;
  resource: string;
  ancestors: { name: string; resource: string }[];
};
export function PlaceAutocomplete({
  locale,
  value,
  resource,
  onChange,
  onSelect,
}: {
  locale: Locale;
  value: string;
  resource: string;
  onChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const id = useId(),
    [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const [active, setActive] = useState<string>();
  useEffect(() => {
    if (open && active)
      document
        .getElementById(id + active)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, id, open]);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(value.trim()), 250);
    return () => clearTimeout(timer);
  }, [value]);
  const ready = value.trim().length >= 2;
  const current = query === value.trim();
  const params = new URLSearchParams({ q: query, limit: "6" });
  if (resource) params.set("resource", resource);
  const { data, isPending, error } = useQuery<{ data: Suggestion[] }>({
    queryKey: ["place-suggestions", query, resource],
    enabled: open && ready && current,
    queryFn: async ({ signal }) => {
      const response = await fetch("/v1/search?" + params, { signal });
      if (!response.ok) throw new Error("Suggestions unavailable");
      return response.json();
    },
    retry: false,
  });
  const suggestions = current ? (data?.data ?? []) : [];
  const expanded = open && ready;
  const selected = suggestions.find((place) => place.id === active);
  function choose(id: string) {
    setOpen(false);
    setActive(undefined);
    onSelect(id);
  }
  return (
    <div className="place-autocomplete">
      <Input
        name="q"
        value={value}
        maxLength={100}
        autoComplete="off"
        role="combobox"
        aria-label={text(locale, "Rechercher un lieu", "Search for a place")}
        placeholder={text(locale, "Rechercher un lieu…", "Search for a place…")}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        aria-activedescendant={
          expanded && selected ? id + selected.id : undefined
        }
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(undefined);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            setActive(undefined);
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            const index = suggestions.findIndex((place) => place.id === active);
            const next =
              e.key === "ArrowDown"
                ? Math.min(index + 1, suggestions.length - 1)
                : index < 0
                  ? suggestions.length - 1
                  : Math.max(index - 1, 0);
            setActive(suggestions[next]?.id);
          }
          if (e.key === "Enter" && expanded && selected) {
            e.preventDefault();
            choose(selected.id);
          }
        }}
      />
      {expanded && (
        <div className="suggestion-panel">
          <ul
            id={id}
            role="listbox"
            aria-label={text(locale, "Lieux correspondants", "Matching places")}
          >
            {suggestions.map((place) => (
              <li
                key={place.id}
                id={id + place.id}
                role="option"
                aria-selected={place.id === active}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(place.id)}
              >
                <MapPin size={17} aria-hidden="true" />
                <div>
                  <strong>{place.name}</strong>
                  <span>
                    {label(place.resource, locale)}
                    {place.ancestors
                      .filter((a) => a.resource !== "countries")
                      .map(
                        (a) =>
                          " · " +
                          a.name +
                          " (" +
                          label(a.resource, locale) +
                          ")",
                      )
                      .join("")}
                  </span>
                </div>
                <ArrowUpRight size={15} aria-hidden="true" />
              </li>
            ))}
          </ul>
          <div role="status" aria-live="polite">
            {!current || isPending ? (
              <>
                <span className="sr-only">
                  {text(locale, "Recherche de lieux", "Finding places")}
                </span>
                <Skeleton className="h-10 m-3" />
              </>
            ) : error ? (
              <p>
                {text(
                  locale,
                  "Suggestions indisponibles. Appuyez sur Entrée pour rechercher.",
                  "Suggestions unavailable. Press Enter to search.",
                )}
              </p>
            ) : suggestions.length === 0 ? (
              <p>
                {text(
                  locale,
                  "Aucun lieu correspondant. Essayez un autre nom.",
                  "No matching places. Try another name.",
                )}
              </p>
            ) : (
              <span className="sr-only">
                {suggestions.length}{" "}
                {text(
                  locale,
                  suggestions.length === 1 ? "lieu proposé" : "lieux proposés",
                  suggestions.length === 1
                    ? "suggested place"
                    : "suggested places",
                )}
              </span>
            )}
          </div>
          <p className="suggestion-hint">
            {text(
              locale,
              "Touches Haut/Bas pour choisir · Entrée pour ouvrir · Échap pour fermer",
              "Up/Down keys to choose · Enter to open · Escape to close",
            )}
          </p>
        </div>
      )}
    </div>
  );
}
