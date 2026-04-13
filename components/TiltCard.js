"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useTilt } from "@/hooks/useTilt";

/**
 * Pointer-based 3D tilt wrapper. Falls back to a plain div when reduced motion is requested.
 */
export default function TiltCard({ children, className = "" }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const tilt = useTilt(ref);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{ perspective: 1000 }}
      onPointerMove={tilt.onMove}
      onPointerLeave={tilt.onLeave}
    >
      <motion.div
        ref={ref}
        style={{ ...tilt.style, transformStyle: "preserve-3d" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
