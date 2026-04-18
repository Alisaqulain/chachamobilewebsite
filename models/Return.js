import mongoose from "mongoose";

const RETURN_TYPES = ["purchase_return", "sale_return"];

const ReturnItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ReturnSchema = new mongoose.Schema(
  {
    type: { type: String, enum: RETURN_TYPES, required: true },
    /** Supplier (purchase_return) or Customer (sale_return); null when sale_return is walk-in. */
    partyId: { type: mongoose.Schema.Types.ObjectId, default: null },
    /** Only for sale_return when partyId is null — optional, not saved as Customer. */
    saleWalkInName: { type: String, trim: true, default: "" },
    saleWalkInPhone: { type: String, trim: true, default: "" },
    products: { type: [ReturnItemSchema], default: [] },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ReturnSchema.index({ type: 1, date: -1 });

export const RETURN_ENTRY_TYPES = RETURN_TYPES;

export default mongoose.models.ReturnEntry || mongoose.model("ReturnEntry", ReturnSchema);
