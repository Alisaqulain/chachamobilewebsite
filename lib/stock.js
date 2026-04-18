import mongoose from "mongoose";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

function toObjId(v) {
  if (!v || !mongoose.Types.ObjectId.isValid(v)) return null;
  return new mongoose.Types.ObjectId(String(v));
}

export async function getProductsMapByIds(ids) {
  const uniq = [...new Set(ids.map((x) => String(x)).filter(Boolean))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  if (!uniq.length) return new Map();
  const rows = await Product.find({ _id: { $in: uniq } }).lean();
  return new Map(rows.map((r) => [String(r._id), r]));
}

/**
 * items: [{ productId, delta, reason, refModel, refId, note }]
 */
export async function applyStockDeltas(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  const byProduct = new Map();
  for (const item of items) {
    const key = String(item.productId);
    const cur = byProduct.get(key) || 0;
    byProduct.set(key, cur + Number(item.delta || 0));
  }

  const products = await getProductsMapByIds([...byProduct.keys()]);
  for (const [productId, netDelta] of byProduct.entries()) {
    const p = products.get(productId);
    if (!p) throw new Error("Product not found while updating stock");
    const next = Number(p.stock || 0) + Number(netDelta);
    if (next < 0) {
      throw new Error(`Insufficient stock for ${p.name}. Available ${p.stock || 0}`);
    }
  }

  const ops = [...byProduct.entries()].map(([productId, delta]) => ({
    updateOne: {
      filter: { _id: toObjId(productId) },
      update: { $inc: { stock: Number(delta) } },
    },
  }));
  if (ops.length) await Product.bulkWrite(ops);

  const movementDocs = items.map((item) => ({
    productId: toObjId(item.productId),
    delta: Number(item.delta || 0),
    reason: item.reason || "manual",
    refModel: item.refModel || "",
    refId: toObjId(item.refId),
    note: item.note || "",
  }));
  await StockMovement.insertMany(movementDocs);
}
