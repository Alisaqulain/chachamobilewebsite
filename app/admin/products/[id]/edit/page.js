import Link from "next/link";
import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  await connectDB();
  const raw = await Product.findById(id)
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug")
    .populate("modelId", "name slug brandId")
    .lean();
  if (!raw) notFound();

  const initial = {
    ...raw,
    _id: raw._id.toString(),
    brandId: raw.brandId?._id ? String(raw.brandId._id) : raw.brandId ? String(raw.brandId) : "",
    modelId: raw.modelId?._id ? String(raw.modelId._id) : raw.modelId ? String(raw.modelId) : "",
    categoryId: raw.categoryId
      ? {
          _id: raw.categoryId._id.toString(),
          name: raw.categoryId.name,
          slug: raw.categoryId.slug,
        }
      : null,
  };

  return (
    <div>
      <div className="mb-6 text-sm">
        <Link href="/admin/products" className="font-semibold text-brand-dim hover:underline">
          ← Products
        </Link>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Edit product</h1>
      <p className="mt-1 text-sm text-black/60">{initial.name}</p>
      <div className="mt-8">
        <ProductForm productId={initial._id} initial={initial} />
      </div>
    </div>
  );
}
