import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 1, phone: 1 }, { unique: true });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
