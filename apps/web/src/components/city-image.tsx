import type { CityKey } from "@/lib/discovery-cities";
export function CityImage({
  city,
  alt = "",
  sizes = "(max-width: 700px) min(280px, calc(100vw - 84px)), 260px",
  loading = "lazy",
}: {
  city: CityKey;
  alt?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
}) {
  const max = city === "pointe-noire" ? 1200 : 1280;
  return (
    <img
      src={"/images/" + city + "-768.webp"}
      srcSet={[384, 768, max]
        .map((w) => "/images/" + city + "-" + w + ".webp " + w + "w")
        .join(", ")}
      sizes={sizes}
      width={max}
      height={
        city === "brazzaville" ? 720 : city === "pointe-noire" ? 900 : 960
      }
      alt={alt}
      loading={loading}
      fetchPriority={loading === "eager" ? "high" : "auto"}
    />
  );
}
