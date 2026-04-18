import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    /** Saved customer from master list; null = walk-in / direct sale (not persisted as Customer). */
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    walkInName: { type: String, trim: true, default: "" },
    walkInPhone: { type: String, trim: true, default: "" },
    products: { type: [SaleItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SaleSchema.index({ date: -1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
