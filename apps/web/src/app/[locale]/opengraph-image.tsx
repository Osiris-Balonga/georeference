import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const alt = "242Places — Republic of the Congo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const filename = "public/images/skyline-og.png";
  const skyline = await readFile(join(process.cwd(), filename)).catch(() =>
    readFile(join(process.cwd(), "apps/web", filename)),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#faf9f7",
        color: "#191a1c",
        flexDirection: "column",
        padding: "42px 64px",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 42,
          fontWeight: 700,
        }}
      >
        <svg
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#df5138"
          strokeWidth="2"
        >
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        242Places
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 74,
          fontWeight: 700,
          lineHeight: 1.05,
          marginTop: 46,
        }}
      >
        <span>{locale === "fr" ? "Le Congo," : "The Congo,"}</span>
        <span>{locale === "fr" ? "de lieu en lieu." : "place by place."}</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 26,
          color: "#616570",
          marginTop: 20,
        }}
      >
        {locale === "fr"
          ? "Villes, quartiers et villages."
          : "Cities, neighborhoods and villages."}
      </div>
      <img
        src={"data:image/png;base64," + skyline.toString("base64")}
        width={1200}
        height={400}
        alt=""
        style={{ position: "absolute", left: 0, bottom: 0 }}
      />
    </div>,
    size,
  );
}
