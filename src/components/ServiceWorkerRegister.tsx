"use client";

import { useEffect, useState } from "react";

/**
 * Registers the offline shell SW in production only (avoids breaking HMR).
 * After the first online visit, navigations can fall back to cached shell / offline.html.
 */
export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Dev: skip — Turbopack/HMR + SW = pain
    if (process.env.NODE_ENV !== "production") return;

    let reg: ServiceWorkerRegistration | null = null;
    let cancelled = false;

    const onControllerChange = () => {
      // New SW took over — optional hard reload once
      // window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (cancelled) return;
        reg = registration;

        const checkWaiting = () => {
          if (registration.waiting) setUpdateReady(true);
        };
        checkWaiting();

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateReady(true);
            }
          });
        });

        // Periodic update check when tab is focused
        const onVis = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVis);
        // store cleanup on registration
        (registration as ServiceWorkerRegistration & { _onVis?: () => void })._onVis =
          onVis;
      })
      .catch(() => {
        /* private mode / blocked */
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      if (reg) {
        const onVis = (
          reg as ServiceWorkerRegistration & { _onVis?: () => void }
        )._onVis;
        if (onVis) document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div className="pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(calc(100%-2rem),20rem)] -translate-x-1/2 rounded-2xl border border-sky-400/30 bg-black/85 p-3 text-center shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-xs text-white/70">
        A new observatory build is ready.
      </p>
      <button
        type="button"
        className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white touch-manipulation active:scale-[0.98]"
        onClick={() => {
          const w = navigator.serviceWorker?.controller;
          // Ask waiting worker via registration
          navigator.serviceWorker.getRegistration().then((r) => {
            r?.waiting?.postMessage({ type: "SKIP_WAITING" });
            // If no waiting, just reload
            window.location.reload();
          });
          void w;
        }}
      >
        Update & reload
      </button>
    </div>
  );
}
