import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Floating Observatory",
    short_name: "Observatory",
    description:
      "Focus sessions that grow your floating island — Pomodoro with build & upgrade. Works on phone and desktop.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#020617",
    theme_color: "#0f172a",
    lang: "en",
    categories: ["productivity", "games", "utilities"],
    icons: [
      {
        src: "/brand/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
