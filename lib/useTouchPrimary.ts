"use client";

import { useEffect, useState } from "react";

/** Touch-first device (phones, most tablets) — no hover / coarse pointer. */
export function useTouchPrimary(): boolean {
  const [touchPrimary, setTouchPrimary] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const noHover = window.matchMedia("(hover: none)");
    const update = () => setTouchPrimary(coarse.matches || noHover.matches);
    update();
    coarse.addEventListener("change", update);
    noHover.addEventListener("change", update);
    return () => {
      coarse.removeEventListener("change", update);
      noHover.removeEventListener("change", update);
    };
  }, []);

  return touchPrimary;
}
