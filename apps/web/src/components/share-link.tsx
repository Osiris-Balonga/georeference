"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { text, type Locale } from "@/lib/i18n";
export function ShareLink({ locale }: { locale: Locale }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      setState("copied");
    } catch {
      setState("error");
    }
  }
  return (
    <div className="share-link">
      <Button variant="ghost" onClick={copy}>
        {state === "copied" ? <Check size={16} /> : <Copy size={16} />}{" "}
        {state === "copied"
          ? text(locale, "Lien copié", "Link copied")
          : text(locale, "Copier le lien", "Copy link")}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied"
          ? text(
              locale,
              "Lien copié dans le presse-papiers",
              "Link copied to clipboard",
            )
          : state === "error"
            ? text(
                locale,
                "Copiez l’adresse dans la barre du navigateur.",
                "Copy the address from your browser address bar.",
              )
            : ""}
      </span>
    </div>
  );
}
