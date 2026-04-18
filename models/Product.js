import mongoose from "mongoose";

/** Allowed values come from the ProductQuality collection (admin-managed). */
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneModel",
      default: null,
    },
    /** @deprecated denormalized — kept for migration / display fallback */
    brand: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    /** Legacy storefront price (kept for compatibility, mirrors sellingPrice). */
    price: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    quality: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.pre("validate", function preValidate() {
  const hasSelling = Number.isFinite(Number(this.sellingPrice));
  const hasPrice = Number.isFinite(Number(this.price));
  if (!hasSelling && hasPrice) this.sellingPrice = Number(this.price);
  if (!hasPrice && hasSelling) this.price = Number(this.sellingPrice);
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
