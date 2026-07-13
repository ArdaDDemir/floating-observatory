import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** PWA / tab icon — floating observatory core */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0f172a 0%, #020617 55%, #0c4a6e 100%)",
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 48,
            background: "rgba(56,189,248,0.12)",
            border: "4px solid rgba(56,189,248,0.45)",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              transform: "rotate(45deg)",
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              boxShadow: "0 0 48px rgba(56,189,248,0.7)",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
