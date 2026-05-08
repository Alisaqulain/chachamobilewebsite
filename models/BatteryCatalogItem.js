import mongoose from "mongoose";

const BatteryCatalogItemSchema = new mongoose.Schema(
  {
    supplierKey: { type: String, trim: true, default: "genius" },
    brand: { type: String, required: true, trim: true },
    phoneModel: { type: String, required: true, trim: true },
    batteryCode: { type: String, required: true, trim: true },
    listPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BatteryCatalogItemSchema.index(
  { supplierKey: 1, brand: 1, phoneModel: 1, batteryCode: 1 },
  { unique: true }
);
BatteryCatalogItemSchema.index({ supplierKey: 1, brand: 1, phoneModel: 1 });
BatteryCatalogItemSchema.index({ supplierKey: 1, batteryCode: 1 });

export default mongoose.models.BatteryCatalogItem ||
  mongoose.model("BatteryCatalogItem", BatteryCatalogItemSchema);

