"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Page enter: use vertical motion only. Some mobile browsers/WebViews (often when opening a LAN
 * dev URL) fail to composite opacity-from-0 animations and leave the whole main tree invisible —
 * fixed navbar + WhatsApp stay visible on a blank/white body.
 */
export default function Template({ children }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
