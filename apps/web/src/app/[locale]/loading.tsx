import { headers } from "next/headers";
import { Skeleton } from "@/components/ui/skeleton";
export default async function Loading() {
  const fr = (await headers()).get("x-242places-locale") === "fr";
  return (
    <div
      className="container loading"
      aria-busy="true"
      aria-label={fr ? "Chargement" : "Loading"}
    >
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-12 w-1/2" />
    </div>
  );
}
