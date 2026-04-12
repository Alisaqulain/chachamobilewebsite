import mongoose from "mongoose";
import { slugify } from "@/utils/slugify";

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

BrandSchema.pre("validate", function preValidate() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
