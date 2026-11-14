"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Menu, ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { Preferences } from "./preferences";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { text, type Locale } from "@/lib/i18n";
const github = "https://github.com/Osiris-Balonga/242places";
export function Header({ locale }: { locale: Locale }) {
  const path = usePathname();
  const links = [
    ["explore", text(locale, "Explorer", "Explore")],
    ["congo", text(locale, "Le Congo", "The Congo")],
    ["project", text(locale, "Le projet", "The project")],
  ];
  return (
    <header className="site-header container">
      <Link href={"/" + locale} aria-label="242Places">
        <Brand />
      </Link>
      <nav
        className="desktop-nav"
        aria-label={text(locale, "Navigation principale", "Main navigation")}
      >
        {links.map(([slug, name]) => (
          <Link
            key={slug}
            href={"/" + locale + "/" + slug}
            aria-current={path.includes("/" + slug) ? "page" : undefined}
          >
            {name}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Suspense>
          <Preferences locale={locale} />
        </Suspense>
        <a className="docs-link" href={"/docs/" + locale + "/introduction"}>
          Documentation <ArrowUpRight size={14} />
        </a>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            closeLabel={text(locale, "Fermer", "Close")}
            aria-describedby={undefined}
          >
            <SheetTitle>242Places</SheetTitle>
            <nav className="mobile-nav">
              {links.map(([slug, name]) => (
                <SheetClose asChild key={slug}>
                  <Link href={"/" + locale + "/" + slug}>{name}</Link>
                </SheetClose>
              ))}
              <a href={"/docs/" + locale + "/introduction"}>Documentation ↗</a>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
export function Footer({ locale }: { locale: Locale }) {
  const groups = [
    {
      title: text(locale, "Explorer", "Explore"),
      links: [
        ["departments", text(locale, "Départements", "Departments")],
        ["communes", text(locale, "Communes", "Communes")],
        ["arrondissements", "Arrondissements"],
        ["neighborhoods", text(locale, "Quartiers", "Neighborhoods")],
        ["villages", text(locale, "Villages", "Villages")],
      ],
    },
    {
      title: text(locale, "Le projet", "The project"),
      links: [
        ["project", text(locale, "À propos", "About")],
        [
          "project#sources",
          text(locale, "Sources et couverture", "Sources and coverage"),
        ],
      ],
    },
  ];
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <Link href={"/" + locale}>
          <Brand />
        </Link>
        <div className="footer-intro">
          <div>
            <h2>
              {text(
                locale,
                "Le Congo, de lieu en lieu.",
                "The Congo, place by place.",
              )}
            </h2>
            <p>
              {text(
                locale,
                "Un annuaire pour découvrir les lieux de la République du Congo.",
                "A directory to discover the places of the Republic of the Congo.",
              )}
            </p>
          </div>
          <Link className="outline-link" href={"/" + locale + "/explore"}>
            {text(locale, "Explorer les lieux", "Explore places")}{" "}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="footer-columns">
          {groups.map((group, index) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([slug, name]) => (
                <Link
                  key={slug}
                  href={
                    "/" +
                    locale +
                    "/" +
                    (index === 0 ? "explore?resource=" + slug : slug)
                  }
                >
                  {name}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h3>{text(locale, "Développeurs", "Developers")}</h3>
            <a href={"/docs/" + locale + "/introduction"}>Documentation ↗</a>
            <a href={"/docs/" + locale + "/cli"}>API / CLI</a>
            <a href={github}>GitHub ↗</a>
            <a
              href={
                github +
                "/blob/main/CONTRIBUTING" +
                (locale === "fr" ? ".fr" : "") +
                ".md"
              }
            >
              {text(locale, "Contribuer", "Contribute")} ↗
            </a>
          </div>
          <div>
            <h3>{text(locale, "Préférences", "Preferences")}</h3>
            <Suspense>
              <Preferences locale={locale} />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="footer-panorama">
        <img
          src="/images/skyline.webp"
          alt=""
          width="2176"
          height="726"
          loading="lazy"
        />
        <p className="container">
          {text(
            locale,
            "Évocation illustrée de Brazzaville",
            "An illustrated evocation of Brazzaville",
          )}
        </p>
      </div>
      <div className="container footer-bottom">
        <span>
          242Places ·{" "}
          {text(locale, "République du Congo", "Republic of the Congo")}
        </span>
        <a href={github}>GitHub ↗</a>
      </div>
    </footer>
  );
}
