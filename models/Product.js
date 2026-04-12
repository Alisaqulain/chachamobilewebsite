import mongoose from "mongoose";

const QUALITIES = ["Original", "High", "Low"];

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
    price: { type: Number, required: true, min: 0 },
    quality: { type: String, required: true, enum: QUALITIES },
    description: { type: String, default: "" },
    images: [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PRODUCT_QUALITIES = QUALITIES;

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
