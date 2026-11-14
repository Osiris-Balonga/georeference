import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
export default async function Index() {
  const saved = (await cookies()).get("242places-locale")?.value;
  const primary = (await headers())
    .get("accept-language")
    ?.split(",")[0]
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  redirect(
    "/" +
      (saved === "fr" || saved === "en"
        ? saved
        : primary?.startsWith("fr")
          ? "fr"
          : "en"),
  );
}
