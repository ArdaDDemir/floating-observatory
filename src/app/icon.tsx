import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** App / tab icon — matches public/brand/logo.svg mark */
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
          background:
            "radial-gradient(circle at 50% 40%, #0c4a6e 0%, #0f172a 55%, #020617 100%)",
          borderRadius: 96,
        }}
      >
        {/* Orbit */}
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 84,
            top: 290,
            borderRadius: "50%",
            border: "6px solid rgba(34,211,238,0.55)",
          }}
        />
        {/* Island cone */}
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            top: 300,
            borderLeft: "80px solid transparent",
            borderRight: "80px solid transparent",
            borderTop: "130px solid #78350f",
            opacity: 0.9,
          }}
        />
        {/* Island disc */}
        <div
          style={{
            position: "absolute",
            width: 216,
            height: 72,
            top: 268,
            borderRadius: "50%",
            background: "linear-gradient(180deg, #4ade80 0%, #166534 100%)",
          }}
        />
        {/* Core diamond */}
        <div
          style={{
            width: 128,
            height: 128,
            transform: "rotate(45deg)",
            background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 45%, #6366f1 100%)",
            boxShadow: "0 0 48px rgba(56,189,248,0.75)",
            marginBottom: 40,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
