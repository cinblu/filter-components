// The social preview image (Open Graph / X / GitHub): the green cone mark and the headline,
// dark, on the site's cutting-mat grid. Rendered by next/og at build time.

import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };
export const socialImageAlt =
  "Filters Framework: a filtering framework for data-heavy products. A green cone icon on a dark grid.";

const BACKGROUND = "#0a0a0a";
const INK = "#fafafa";
const MUTED = "#a3a3a3";
// The site's dark-theme accent (oklch 0.75 0.13 165).
const ACCENT = "#3ccf9b";

export function renderSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: BACKGROUND,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "120px 120px, 120px 120px, 30px 30px, 30px 30px",
          fontFamily: "Geist",
          color: INK,
        }}
      >
        {/* Fade the grid towards the edges, and a soft glow behind the mark. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `radial-gradient(circle at 82% 52%, rgba(60,207,155,0.16) 0%, transparent 34%), radial-gradient(ellipse at 50% 50%, transparent 30%, ${BACKGROUND} 85%)`,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "72px 80px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: MUTED }}>
            <Cone size={34} />
            Filters Framework
          </div>

          <div style={{ display: "flex", flexDirection: "column", fontSize: 64, lineHeight: 1.08, letterSpacing: -1 }}>
            <span>A filtering framework</span>
            <span style={{ color: MUTED }}>for data-heavy products</span>
          </div>

          <div style={{ display: "flex", gap: 14, fontSize: 24, color: MUTED }}>
            <span>shadcn/ui registry</span>
            <span style={{ color: "#525252" }}>·</span>
            <span>Open source</span>
          </div>
        </div>

        {/* The mark, large, on the right. */}
        <div style={{ position: "absolute", right: 88, top: 190, display: "flex" }}>
          <Cone size={240} strokeWidth={0.75} />
        </div>
      </div>
    ),
    socialImageSize,
  );
}

/** Lucide's "cone", in the accent green. */
function Cone({ size, strokeWidth = 2 }: { size: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98" />
      <ellipse cx="12" cy="19" rx="9" ry="3" />
    </svg>
  );
}
