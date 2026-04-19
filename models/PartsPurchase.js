import mongoose from "mongoose";

const PartsPurchaseSchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    stockGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStockGroup", required: true },
    date: { type: Date, default: Date.now },
    salesCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesCategory", required: true },
    mobileName: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    quality: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: "" },
    lineTotal: { type: Number, required: true, min: 0 },
    linkedProductId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  },
  { timestamps: true }
);

PartsPurchaseSchema.index({ supplierId: 1, date: -1 });

export default mongoose.models.PartsPurchase || mongoose.model("PartsPurchase", PartsPurchaseSchema);
