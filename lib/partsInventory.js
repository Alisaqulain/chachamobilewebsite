import mongoose from "mongoose";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import Product from "@/models/Product";
import Supplier from "@/models/Supplier";
import { applyStockDeltas } from "@/lib/stock";

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function buildStockKeyHash(salesCategoryId, mobileName, productName, quality) {
  return [
    String(salesCategoryId),
    norm(mobileName),
    norm(productName),
    norm(quality),
  ].join("|");
}

export function netStock(group) {
  return (
    Number(group.purchasedQty || 0) -
    Number(group.returnedQty || 0) -
    Number(group.soldQty || 0)
  );
}

export async function incrementSoldQtyForSaleLineItems(items) {
  if (!Array.isArray(items) || !items.length) return;
  for (const row of items) {
    const pid = row.productId;
    if (!pid || !mongoose.Types.ObjectId.isValid(String(pid))) continue;
    await InventoryStockGroup.updateOne(
      { linkedProductId: pid },
      { $inc: { soldQty: Number(row.quantity || 0) } }
    );
  }
}

export async function ensureGroupForLine({
  salesCategoryId,
  mobileName,
  productName,
  quality,
  linkedProductId,
}) {
  const keyHash = buildStockKeyHash(salesCategoryId, mobileName, productName, quality);
  let group = await InventoryStockGroup.findOne({ keyHash }).lean();
  const mobile = String(mobileName).trim();
  const prod = String(productName).trim();
  const qual = String(quality).trim();

  if (!group) {
    if (linkedProductId) {
      const clash = await InventoryStockGroup.findOne({ linkedProductId }).lean();
      if (clash) {
        throw new Error(
          "This catalogue product is already linked to another parts line. Unlink it first."
        );
      }
    }
    const created = await InventoryStockGroup.create({
      salesCategoryId,
      mobileName: mobile,
      productName: prod,
      quality: qual,
      keyHash,
      ...(linkedProductId ? { linkedProductId } : {}),
      purchasedQty: 0,
      returnedQty: 0,
      soldQty: 0,
      lastPurchaseAt: null,
    });
    return InventoryStockGroup.findById(created._id).lean();
  }

  if (linkedProductId) {
    const existingLink = group.linkedProductId ? String(group.linkedProductId) : "";
    const incoming = String(linkedProductId);
    if (existingLink && existingLink !== incoming) {
      throw new Error("This inventory line already links to a different product.");
    }
    const taken = await InventoryStockGroup.findOne({
      linkedProductId,
      _id: { $ne: group._id },
    }).lean();
    if (taken) {
      throw new Error("Product is already linked to another inventory line.");
    }
    if (!existingLink) {
      await InventoryStockGroup.updateOne({ _id: group._id }, { $set: { linkedProductId } });
      group = await InventoryStockGroup.findById(group._id).lean();
    }
  }

  return group;
}

export async function incrementGroupPurchased(stockGroupId, quantity, date) {
  await InventoryStockGroup.updateOne(
    { _id: stockGroupId },
    {
      $inc: { purchasedQty: Number(quantity) },
      $set: { lastPurchaseAt: date || new Date() },
    }
  );
}

export async function getReturnedQtyForPurchase(partsPurchaseId) {
  const agg = await PartsPurchaseReturn.aggregate([
    { $match: { partsPurchaseId: new mongoose.Types.ObjectId(String(partsPurchaseId)) } },
    { $group: { _id: null, total: { $sum: "$quantity" } } },
  ]);
  return Number(agg[0]?.total || 0);
}

export async function applyPartsPurchaseDelete(purchaseLean) {
  const returned = await getReturnedQtyForPurchase(purchaseLean._id);
  if (returned > 0) {
    throw new Error("Remove purchase returns first, then delete this purchase.");
  }
  const qty = Number(purchaseLean.quantity || 0);
  const gid = purchaseLean.stockGroupId;
  await InventoryStockGroup.updateOne({ _id: gid }, { $inc: { purchasedQty: -qty } });
  const g = await InventoryStockGroup.findById(gid).lean();
  if (g && Number(g.purchasedQty) < 0) {
    await InventoryStockGroup.updateOne({ _id: gid }, { $set: { purchasedQty: 0 } });
  }
  if (purchaseLean.linkedProductId) {
    await applyStockDeltas([
      {
        productId: purchaseLean.linkedProductId,
        delta: -qty,
        reason: "manual",
        refModel: "PartsPurchase",
        refId: purchaseLean._id,
        note: "Parts purchase deleted",
      },
    ]);
  }
}

/** Update quantity / link only (same stock group line). */
export async function applyPartsPurchaseLimitedUpdate(prevLean, body) {
  const nextQty = Number(body.quantity ?? prevLean.quantity);
  const prevQty = Number(prevLean.quantity || 0);
  const dq = nextQty - prevQty;
  const prevLink = prevLean.linkedProductId ? String(prevLean.linkedProductId) : "";
  const nextLink = body.linkedProductId ? String(body.linkedProductId) : "";

  if (nextQty < 1) throw new Error("Quantity must be at least 1");

  const returned = await getReturnedQtyForPurchase(prevLean._id);
  if (nextQty < returned) {
    throw new Error(`Quantity cannot be below returns already recorded (${returned}).`);
  }

  if (prevLink !== nextLink) {
    if (returned > 0) throw new Error("Cannot change linked product when returns exist.");
    if (prevLink) {
      await applyStockDeltas([
        {
          productId: prevLink,
          delta: -prevQty,
          reason: "manual",
          refModel: "PartsPurchase",
          refId: prevLean._id,
          note: "Unlink product from parts purchase",
        },
      ]);
    }
    if (nextLink) {
      await assertProductExists(nextLink);
      const taken = await InventoryStockGroup.findOne({
        linkedProductId: nextLink,
        _id: { $ne: prevLean.stockGroupId },
      }).lean();
      if (taken) throw new Error("Product already linked to another line.");
      await InventoryStockGroup.updateOne(
        { _id: prevLean.stockGroupId },
        { $set: { linkedProductId: nextLink } }
      );
      await applyStockDeltas([
        {
          productId: nextLink,
          delta: nextQty,
          reason: "purchase",
          refModel: "PartsPurchase",
          refId: prevLean._id,
          note: "Link product to parts purchase",
        },
      ]);
    } else {
      await InventoryStockGroup.updateOne(
        { _id: prevLean.stockGroupId },
        { $unset: { linkedProductId: "" } }
      );
    }
  } else if (dq !== 0 && nextLink) {
    await applyStockDeltas([
      {
        productId: nextLink,
        delta: dq,
        reason: "purchase",
        refModel: "PartsPurchase",
        refId: prevLean._id,
        note: "Parts purchase qty changed",
      },
    ]);
  }

  if (dq !== 0) {
    await InventoryStockGroup.updateOne(
      { _id: prevLean.stockGroupId },
      {
        $inc: { purchasedQty: dq },
        $set: { lastPurchaseAt: body.date ? new Date(body.date) : new Date() },
      }
    );
  }
}

export async function validatePartsReturnQuantity(purchaseLean, quantity) {
  const already = await getReturnedQtyForPurchase(purchaseLean._id);
  const maxRet = Number(purchaseLean.quantity || 0) - already;
  if (quantity > maxRet) {
    throw new Error(`Return quantity too high. Max returnable: ${maxRet}`);
  }
}

/** Call after PartsPurchaseReturn document is saved (returnDocId for stock ledger). */
export async function applyPartsReturnLedger(purchaseLean, quantity, returnDocId) {
  await InventoryStockGroup.updateOne(
    { _id: purchaseLean.stockGroupId },
    { $inc: { returnedQty: Number(quantity) } }
  );
  if (purchaseLean.linkedProductId) {
    await applyStockDeltas([
      {
        productId: purchaseLean.linkedProductId,
        delta: -Number(quantity),
        reason: "purchase_return",
        refModel: "PartsPurchaseReturn",
        refId: returnDocId,
        note: "Parts purchase return",
      },
    ]);
  }
}

export async function applyPartsReturnDelete(retLean, purchaseLean) {
  await InventoryStockGroup.updateOne(
    { _id: retLean.stockGroupId },
    { $inc: { returnedQty: -Number(retLean.quantity || 0) } }
  );
  if (purchaseLean.linkedProductId) {
    await applyStockDeltas([
      {
        productId: purchaseLean.linkedProductId,
        delta: Number(retLean.quantity || 0),
        reason: "manual",
        refModel: "PartsPurchaseReturn",
        refId: retLean._id,
        note: "Parts return deleted",
      },
    ]);
  }
}

export function toProductId(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return s;
}

export async function assertProductExists(productId) {
  if (!productId) return;
  const p = await Product.findById(productId).select("_id").lean();
  if (!p) throw new Error("Linked product not found");
}

export const UNKNOWN_SUPPLIER_NAME = "Unknown Supplier";

export async function ensureUnknownSupplier() {
  await Supplier.findOneAndUpdate(
    { name: UNKNOWN_SUPPLIER_NAME },
    { $setOnInsert: { name: UNKNOWN_SUPPLIER_NAME, phone: "", address: "" } },
    { upsert: true }
  );
}
