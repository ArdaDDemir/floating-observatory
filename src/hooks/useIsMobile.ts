"use client";

import { useEffect, useState } from "react";

/**
 * True on narrow viewports or coarse pointers (phones / many tablets).
 * SSR-safe: false until mounted.
 */
export function useIsMobile(breakpointPx = 768) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mqWidth = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const update = () => setMobile(mqWidth.matches || mqCoarse.matches);
    update();
    mqWidth.addEventListener("change", update);
    mqCoarse.addEventListener("change", update);
    return () => {
      mqWidth.removeEventListener("change", update);
      mqCoarse.removeEventListener("change", update);
    };
  }, [breakpointPx]);

  return mobile;
}
