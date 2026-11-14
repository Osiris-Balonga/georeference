import type { Metadata } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/inter";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  icons: {icon: '/favicon.svg'},
  title: { default: "242Places · Congo", template: "%s · 242Places" },
  description:
    "Explore the places and administrative relationships of the Republic of the Congo.",
};
const themeScript = `try{let t=localStorage.getItem('242places-theme');if(!['light','dark'].includes(t)){t=typeof matchMedia==='function'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):'dark'}document.documentElement.dataset.theme=t}catch{document.documentElement.dataset.theme='dark'}`;
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  return (
    <html lang={h.get("x-242places-locale") ?? "en"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
