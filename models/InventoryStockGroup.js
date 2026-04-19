import mongoose from "mongoose";

/**
 * One row per distinct inventory line (sales category + folder + model + quality).
 * mobileName = folder (brand/family); productName = model. Stock = purchased − returns − sold.
 */
const InventoryStockGroupSchema = new mongoose.Schema(
  {
    salesCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesCategory", required: true },
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

InventoryStockGroupSchema.index({ salesCategoryId: 1, mobileName: 1, productName: 1 });
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
