import { catalog } from "@/lib/catalog";
import { placeSitemap } from "@/lib/seo";
export const revalidate = 86400;
export default async function sitemap() {
  const c = await catalog();
  return placeSitemap(
    Object.values(c.resources).flatMap((rows) => rows.map((row) => row.id)),
  );
}
