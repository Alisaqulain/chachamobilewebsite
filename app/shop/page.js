import { Suspense } from "react";
import ShopClient from "./ShopClient";

export const metadata = {
  title: "Shop",
  description: "Browse mobile spare parts by brand, model, category, and quality.",
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-16 sm:px-6">
          <div className="h-10 w-48 rounded-2xl bg-white/10" />
          <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="hidden h-96 rounded-3xl bg-white/10 lg:block" />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
