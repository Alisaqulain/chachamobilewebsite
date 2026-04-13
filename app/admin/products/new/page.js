import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6 text-sm">
        <Link href="/admin/products" className="font-semibold text-brand-dim hover:underline">
          ← Products
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Add product</h1>
      <p className="mt-1 text-sm text-black/60">Fill details and upload images (stored under /public/uploads/products).</p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
