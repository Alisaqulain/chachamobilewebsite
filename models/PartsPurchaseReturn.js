import mongoose from "mongoose";

const PartsPurchaseReturnSchema = new mongoose.Schema(
  {
    partsPurchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "PartsPurchase", required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    stockGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryStockGroup", required: true },
    quantity: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

PartsPurchaseReturnSchema.index({ partsPurchaseId: 1 });

export default mongoose.models.PartsPurchaseReturn ||
  mongoose.model("PartsPurchaseReturn", PartsPurchaseReturnSchema);
