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
          background: "#020617",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            transform: "rotate(45deg)",
            background: "linear-gradient(135deg, #38bdf8, #818cf8)",
            boxShadow: "0 0 28px rgba(56,189,248,0.65)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
