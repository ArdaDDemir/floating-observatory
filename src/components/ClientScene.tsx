"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#020617]">
      <div className="rounded-2xl border border-white/10 bg-black/50 px-6 py-3 text-sm text-white/50 backdrop-blur-md">
        Loading island…
      </div>
    </div>
  ),
});

export default function ClientScene() {
  return <Scene />;
}
