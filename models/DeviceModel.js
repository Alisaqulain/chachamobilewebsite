import mongoose from "mongoose";

const DeviceModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

DeviceModelSchema.index({ brandId: 1, name: 1 }, { unique: true });

export default mongoose.models.DeviceModel || mongoose.model("DeviceModel", DeviceModelSchema);
