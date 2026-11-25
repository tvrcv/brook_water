import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Brook — water on autopilot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await readFile(join(process.cwd(), "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07090d", color: "#f2f5f8", padding: 72, fontFamily: "Space Grotesk" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 24 24">
            <path d="M12 2.5c3.6 4.3 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.5 2.9-7.2 6.5-11.5z" fill="#5ce1ff" />
          </svg>
          <span style={{ fontSize: 48, letterSpacing: -2 }}>brook</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 104, lineHeight: 0.95, letterSpacing: -5 }}>Stop watering</span>
          <span style={{ fontSize: 104, lineHeight: 0.95, letterSpacing: -5, color: "#5ce1ff" }}>on a timer.</span>
        </div>
        <span style={{ fontSize: 30, color: "#c9d2dc" }}>Smart irrigation for golf, stadiums, factories, stations and campuses</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Space Grotesk", data: font, style: "normal", weight: 700 }] },
  );
}
