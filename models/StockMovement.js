import mongoose from "mongoose";

const StockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    delta: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["purchase", "sale", "purchase_return", "sale_return", "manual"],
      required: true,
    },
    refModel: { type: String, default: "" },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

StockMovementSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);
