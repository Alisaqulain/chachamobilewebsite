import mongoose from "mongoose";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import PartsPurchase from "@/models/PartsPurchase";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import StockMovement from "@/models/StockMovement";
import { applyPartsReturnDelete, applyPartsPurchaseDelete } from "@/lib/partsInventory";

/**
 * Removes one parts ledger line: all returns and purchases for the stock group, then the group.
 * Rejects if soldQty > 0 (linked counter sales recorded against this line).
 */
export async function deleteInventoryStockGroupById(stockGroupIdRaw) {
  if (!mongoose.Types.ObjectId.isValid(String(stockGroupIdRaw))) {
    throw new Error("Invalid stock line id");
  }
  const gid = new mongoose.Types.ObjectId(String(stockGroupIdRaw));

  const group = await InventoryStockGroup.findById(gid).lean();
  if (!group) {
    throw new Error("Stock line not found");
  }
  if (Number(group.soldQty || 0) > 0) {
    throw new Error(
      "This line has recorded parts sales (sold qty > 0). You cannot delete it from here without adjusting those sales first."
    );
  }

  const purchases = await PartsPurchase.find({ stockGroupId: gid }).sort({ date: 1 }).lean();
  const purchaseIds = purchases.map((p) => p._id);
  const returnIdsToClean = [];

  for (const p of purchases) {
    const returns = await PartsPurchaseReturn.find({ partsPurchaseId: p._id }).lean();
    for (const ret of returns) {
      returnIdsToClean.push(ret._id);
      await applyPartsReturnDelete(ret, p);
      await PartsPurchaseReturn.deleteOne({ _id: ret._id });
    }
  }

  for (const p of purchases) {
    const fresh = await PartsPurchase.findById(p._id).lean();
    if (!fresh) continue;
    await applyPartsPurchaseDelete(fresh);
    await PartsPurchase.deleteOne({ _id: p._id });
  }

  const movementClauses = [];
  if (purchaseIds.length) {
    movementClauses.push({ refModel: "PartsPurchase", refId: { $in: purchaseIds } });
  }
  if (returnIdsToClean.length) {
    movementClauses.push({ refModel: "PartsPurchaseReturn", refId: { $in: returnIdsToClean } });
  }
  if (movementClauses.length) {
    await StockMovement.deleteMany({ $or: movementClauses });
  }

  await InventoryStockGroup.deleteOne({ _id: gid });
  return { ok: true, purchasesRemoved: purchases.length };
}
