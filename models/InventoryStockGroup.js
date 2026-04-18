import mongoose from "mongoose";

/**
 * One row per distinct inventory line (category + mobile + product + quality).
 * Stock = purchasedQty - returnedQty - soldQty (sold only when linked to Product and sale recorded).
 */
const InventoryStockGroupSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    mobileName: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    quality: { type: String, required: true, trim: true },
    /** Normalized key for uniqueness */
    keyHash: { type: String, required: true, trim: true, unique: true },
    purchasedQty: { type: Number, default: 0, min: 0 },
    returnedQty: { type: Number, default: 0, min: 0 },
    soldQty: { type: Number, default: 0, min: 0 },
    /** Optional link: when set, sales of this Product increment soldQty here. */
    linkedProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    lastPurchaseAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InventoryStockGroupSchema.index({ categoryId: 1, mobileName: 1, productName: 1 });
/** Unique only when linked to a shop product; many rows may omit the link (no duplicate-null errors). */
InventoryStockGroupSchema.index(
  { linkedProductId: 1 },
  {
    unique: true,
    partialFilterExpression: { linkedProductId: { $type: "objectId" } },
  }
);

export default mongoose.models.InventoryStockGroup ||
  mongoose.model("InventoryStockGroup", InventoryStockGroupSchema);
