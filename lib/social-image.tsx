// The social preview image (Open Graph / X): the headline over a filter band, on the same
// cutting-mat grid as the site. Rendered by next/og at build time.

import { ImageResponse } from "next/og";

export const socialImageSize = { width: 1200, height: 630 };
export const socialImageAlt =
  "Filter Bar: a filtering framework for data-heavy products. A toolbar of filter chips above a table.";

const INK = "#171717";
const MUTED = "#737373";
const LINE = "#e5e5e5";
const ACCENT = "#047857";

function Icon({ d, color = MUTED }: { d: string; color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const PLUS = "M12 5v14M5 12h14";
const X = "M18 6 6 18M6 6l12 12";
const CHEVRON = "m6 9 6 6 6-6";

function Chip({ label, value, set }: { label: string; value?: string; set?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 42,
        padding: "0 12px",
        borderRadius: 10,
        border: `1.5px ${set ? "solid" : "dashed"} ${set ? LINE : "#d4d4d4"}`,
        background: set ? "#ffffff" : "transparent",
        color: set ? INK : MUTED,
        fontSize: 19,
      }}
    >
      <Icon d={set ? X : PLUS} />
      <span>{label}</span>
      {value && <span style={{ color: ACCENT, fontWeight: 600 }}>{value}</span>}
      {value && <Icon d={CHEVRON} color={ACCENT} />}
    </div>
  );
}

export function renderSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          background: "#fafafa",
          backgroundImage:
            "linear-gradient(#ececec 1px, transparent 1px), linear-gradient(90deg, #ececec 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          fontFamily: "Geist",
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 600 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 16, height: 18, borderRadius: 5, border: "2px dashed #a3a3a3" }} />
            <div style={{ width: 18, height: 18, borderRadius: 5, background: ACCENT }} />
          </div>
          Filter Bar
        </div>

        {/* Two set lines, so the headline never breaks inside "data-heavy". The bundled font
            is a single weight, so size and colour carry the emphasis. */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, fontSize: 66, lineHeight: 1.08 }}>
          <span>A filtering framework</span>
          <span style={{ color: MUTED }}>for data-heavy products</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            borderRadius: 18,
            border: `1.5px solid ${LINE}`,
            background: "#ffffff",
            boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", gap: 10, padding: 18, borderBottom: `1.5px solid ${LINE}` }}>
            <Chip label="Created Date" value="1 week ago" set />
            <Chip label="Status" value="2 items" set />
            <Chip label="More Filters" />
            <Chip label="Sort: Date" value="Newest first" set />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "18px 22px" }}>
            {[0.9, 0.7, 0.5].map((opacity, i) => (
              <div key={i} style={{ display: "flex", gap: 40, opacity }}>
                <div style={{ width: 120, height: 12, borderRadius: 6, background: "#ededed" }} />
                <div style={{ width: 220, height: 12, borderRadius: 6, background: "#ededed" }} />
                <div style={{ width: 160, height: 12, borderRadius: 6, background: "#ededed" }} />
                <div style={{ width: 200, height: 12, borderRadius: 6, background: "#ededed" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
