"use client";

import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useCallback } from "react";

/**
 * Pointer-based 3D tilt for cards (Apple-style depth).
 * Pass a ref from the caller so this hook does not return a ref (eslint react-hooks/refs).
 */
export function useTilt(elementRef, stiffness = 280, damping = 24) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness, damping });
  const springY = useSpring(y, { stiffness, damping });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["9deg", "-9deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-11deg", "11deg"]);

  const onMove = useCallback((e) => {
    const el = elementRef?.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }, [elementRef, x, y]);

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    style: { rotateX, rotateY, transformPerspective: 1000 },
    onMove,
    onLeave,
  };
}
