"use client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const fr = useParams().locale === "fr";
  return (
    <section className="container page-head">
      <h1>
        {fr
          ? "Impossible de charger cette page."
          : "This page could not be loaded."}
      </h1>
      <p>{fr ? "Réessayez dans un instant." : "Try again in a moment."}</p>
      <Button onClick={reset}>{fr ? "Réessayer" : "Try again"}</Button>
    </section>
  );
}
