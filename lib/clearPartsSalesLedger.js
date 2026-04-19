import mongoose from "mongoose";
import PartsPurchase from "../models/PartsPurchase.js";
import PartsPurchaseReturn from "../models/PartsPurchaseReturn.js";
import InventoryStockGroup from "../models/InventoryStockGroup.js";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

async function ensureConnected() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define MONGODB_URI (e.g. in .env.local)");
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { bufferCommands: false });
  }
}

/**
 * Wipes supplier parts ledger: returns, purchases, stock groups, and related stock movements.
 * For purchases linked to shop products, reduces Product.stock by net purchased (qty − returns).
 * Call connectDB() before this from Next.js routes if you want the usual DB migrations to run first.
 */
export async function clearPartsSalesLedger(options = {}) {
  const { dryRun = false } = options;
  await ensureConnected();

  const purchases = await PartsPurchase.find().lean();
  const retAgg = await PartsPurchaseReturn.aggregate([
    { $group: { _id: "$partsPurchaseId", total: { $sum: "$quantity" } } },
  ]);
  const retMap = new Map(retAgg.map((r) => [String(r._id), Number(r.total || 0)]));

  const productUndo = new Map();
  for (const p of purchases) {
    if (!p.linkedProductId) continue;
    const ret = retMap.get(String(p._id)) || 0;
    const net = Number(p.quantity || 0) - ret;
    if (net <= 0) continue;
    const pid = String(p.linkedProductId);
    productUndo.set(pid, (productUndo.get(pid) || 0) + net);
  }

  const counts = {
    partsPurchaseReturns: await PartsPurchaseReturn.countDocuments(),
    partsPurchases: await PartsPurchase.countDocuments(),
    inventoryStockGroups: await InventoryStockGroup.countDocuments(),
    stockMovementsParts: await StockMovement.countDocuments({
      refModel: { $in: ["PartsPurchase", "PartsPurchaseReturn"] },
    }),
  };

  if (dryRun) {
    return { dryRun: true, counts, productUndoTotals: Object.fromEntries(productUndo) };
  }

  for (const [productId, netQty] of productUndo) {
    if (!mongoose.Types.ObjectId.isValid(productId)) continue;
    const id = new mongoose.Types.ObjectId(productId);
    const p = await Product.findById(id).select("stock").lean();
    if (!p) continue;
    const next = Math.max(0, Number(p.stock || 0) - Number(netQty));
    await Product.updateOne({ _id: id }, { $set: { stock: next } });
  }

  await PartsPurchaseReturn.deleteMany({});
  await PartsPurchase.deleteMany({});
  await InventoryStockGroup.deleteMany({});
  await StockMovement.deleteMany({
    refModel: { $in: ["PartsPurchase", "PartsPurchaseReturn"] },
  });

  return { ok: true, deleted: counts };
}
