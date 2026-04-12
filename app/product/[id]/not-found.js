import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-black">Product not found</h1>
      <p className="mt-2 text-sm text-black/60">This item may have been removed from the catalogue.</p>
      <Link
        href="/shop"
        className="mt-8 inline-flex rounded-full bg-[#FFA500] px-6 py-2.5 text-sm font-bold text-black"
      >
        Back to shop
      </Link>
    </div>
  );
}
