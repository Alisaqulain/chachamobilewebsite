"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, rotateX: 3 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1100, transformStyle: "preserve-3d" }}
      className="flex min-h-0 flex-1 flex-col [transform-origin:center_top]"
    >
      {children}
    </motion.div>
  );
}
