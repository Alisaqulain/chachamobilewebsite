import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

SupplierSchema.index({ name: 1 }, { unique: true });

export default mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
