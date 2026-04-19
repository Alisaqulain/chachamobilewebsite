import mongoose from "mongoose";
import "@/models/SalesCategory";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import PartsPurchase from "@/models/PartsPurchase";
import { buildStockKeyHash } from "@/lib/partsInventory";
import { ensureSalesLedgerFolderId } from "@/lib/salesCategoryHelpers";

/**
 * Move parts ledger off website Category onto SalesCategory.
 * Assigns all lines to the sales "Folder" row and recomputes keyHash.
 */
export async function migrateSalesLedgerCategoriesOnce() {
  if (global.__chachaSalesLedgerCatMigrated) return;

  try {
    const folderId = await ensureSalesLedgerFolderId();
    const folderOid = new mongoose.Types.ObjectId(folderId);

    const igCol = InventoryStockGroup.collection;
    const legacyGroups = await igCol
      .find({
        $or: [{ salesCategoryId: { $exists: false } }, { categoryId: { $exists: true } }],
      })
      .toArray();

    for (const g of legacyGroups) {
      const keyHash = buildStockKeyHash(folderId, g.mobileName, g.productName, g.quality);
      try {
        await igCol.updateOne(
          { _id: g._id },
          {
            $set: { salesCategoryId: folderOid, keyHash },
            $unset: { categoryId: "" },
          }
        );
      } catch (e) {
        if (e?.code === 11000) {
          console.warn(
            "[migrateSalesLedgerCategories] keyHash collision for stock group",
            String(g._id),
            keyHash
          );
        } else {
          throw e;
        }
      }
    }

    await PartsPurchase.collection.updateMany(
      { $or: [{ salesCategoryId: { $exists: false } }, { categoryId: { $exists: true } }] },
      { $set: { salesCategoryId: folderOid }, $unset: { categoryId: "" } }
    );

    await InventoryStockGroup.syncIndexes().catch(() => {});
    global.__chachaSalesLedgerCatMigrated = true;
  } catch (e) {
    console.error("migrateSalesLedgerCategoriesOnce:", e);
  }
}
