import mongoose from "mongoose";

/** Sales-system / parts ledger only — not used by the public shop catalogue. */
const SalesCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.SalesCategory || mongoose.model("SalesCategory", SalesCategorySchema);
