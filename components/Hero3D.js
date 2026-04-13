"use client";

import dynamic from "next/dynamic";

const Hero3DScene = dynamic(() => import("./Hero3DScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-32 w-32 animate-pulse rounded-full bg-brand/15 blur-2xl" />
    </div>
  ),
});

export default function Hero3D() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] select-none">
      <div className="absolute inset-y-8 right-0 w-full md:inset-y-12 md:w-[58%]">
        <Hero3DScene />
      </div>
    </div>
  );
}
