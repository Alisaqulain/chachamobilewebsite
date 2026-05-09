import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    /** Website catalogue SKU (optional if selling from parts ledger line). */
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    /** Parts ledger stock group from supplier purchases (optional if productId set). */
    stockGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStockGroup", default: null },
    /** Manual bill line (no stock link): folder / branch label. */
    manualMobileName: { type: String, trim: true, default: "" },
    /** Manual bill line: model or free-text description. */
    manualProductName: { type: String, trim: true, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    /** When false, sale lines are manual-only (no stock / ledger deduction). */
    fromStock: { type: Boolean, default: true },
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

if (mongoose.models.Sale) delete mongoose.models.Sale;
if (mongoose.connection.models.Sale) delete mongoose.connection.models.Sale;

export default mongoose.model("Sale", SaleSchema);
