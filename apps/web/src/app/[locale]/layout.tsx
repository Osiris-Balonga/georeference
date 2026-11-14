import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site-shell";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "fr" && locale !== "en") notFound();
  return (
    <>
      <a className="skip-link" href="#main">
        {locale === "fr" ? "Aller au contenu" : "Skip to content"}
      </a>
      <Header locale={locale} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
