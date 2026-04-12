import mongoose from "mongoose";
import { slugify } from "@/utils/slugify";

const PhoneModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    slug: { type: String, lowercase: true, trim: true, default: "" },
  },
  { timestamps: true }
);

PhoneModelSchema.pre("validate", function preValidate() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

PhoneModelSchema.index({ brandId: 1, name: 1 }, { unique: true });

export default mongoose.models.PhoneModel || mongoose.model("PhoneModel", PhoneModelSchema);
