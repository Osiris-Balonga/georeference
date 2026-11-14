"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  nearbyCity,
  type CityKey,
  type FeaturedPlace,
} from "@/lib/discovery-cities";
import { text, type Locale } from "@/lib/i18n";
import { CityImage } from "./city-image";
export function FeaturedPlaces({
  cities,
  locale,
}: {
  cities: FeaturedPlace[];
  locale: Locale;
}) {
  const [nearby, setNearby] = useState<CityKey>();
  useEffect(() => {
    let active = true;
    // Reuse an existing grant silently; never request permission on arrival.
    try {
      navigator.permissions
        ?.query({ name: "geolocation" })
        .then((permission) => {
          if (
            !active ||
            permission.state !== "granted" ||
            !navigator.geolocation
          )
            return;
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (active) setNearby(nearbyCity(position.coords));
            },
            () => {},
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
          );
        })
        .catch(() => {});
    } catch {}
    return () => {
      active = false;
    };
  }, []);
  const shown = nearby
    ? [
        ...cities.filter((c) => c.key === nearby),
        ...cities.filter((c) => c.key !== nearby),
      ]
    : cities;
  return (
    <div className="featured-discovery">
      <div className="featured-cards">
        {shown.map((city) => (
          <Link
            href={"/" + locale + "/places/" + city.id}
            className="place-preview"
            key={city.key}
          >
            <CityImage city={city.key} alt={city.name} loading="eager" />
            <div>
              <small>{text(locale, "Commune", "Commune")}</small>
              <h2>{city.name}</h2>
              <p>
                {text(locale, "Département de ", "Department of ") +
                  city.department}
              </p>
              <span>
                {city.arrondissements > 0
                  ? city.arrondissements +
                    " " +
                    text(
                      locale,
                      "arrondissements répertoriés",
                      "recorded arrondissements",
                    )
                  : city.neighborhoods +
                    " " +
                    text(
                      locale,
                      "quartiers répertoriés",
                      "recorded neighborhoods",
                    )}
                <ArrowRight size={17} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
