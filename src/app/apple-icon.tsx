import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(circle at 50% 40%, #0c4a6e 0%, #020617 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            transform: "rotate(45deg)",
            background: "linear-gradient(135deg, #7dd3fc, #38bdf8, #6366f1)",
            boxShadow: "0 0 28px rgba(56,189,248,0.7)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
