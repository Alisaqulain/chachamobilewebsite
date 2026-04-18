import mongoose from "mongoose";

const ProductQualitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductQualitySchema.index({ sortOrder: 1, name: 1 });

export default mongoose.models.ProductQuality || mongoose.model("ProductQuality", ProductQualitySchema);
