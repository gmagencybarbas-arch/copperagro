"use client";

import { useEffect, useState } from "react";

const MOBILE_MAX = 768;

/**
 * `true` quando `window.innerWidth < 768`. No SSR / primeiro paint: `false`.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_MAX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
