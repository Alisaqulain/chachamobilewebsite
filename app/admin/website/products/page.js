"use client";

import { Suspense } from "react";
import AdminProductsPage from "../../products/page";

export default function WebsiteProductsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-black/50">Loading products...</p>}>
      <AdminProductsPage />
    </Suspense>
  );
}
