import SalesCategory from "@/models/SalesCategory";
import { slugify } from "@/utils/slugify";

const LEDGER_FOLDER_NAME = "Folder";

/** Default sales-ledger category (parts purchases / stock groups). */
export async function ensureSalesLedgerFolderId() {
  const slug = slugify(LEDGER_FOLDER_NAME);
  await SalesCategory.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name: LEDGER_FOLDER_NAME, slug, image: "" } },
    { upsert: true }
  );
  const c = await SalesCategory.findOne({ slug }).select("_id").lean();
  if (!c) throw new Error("Failed to resolve sales ledger Folder category");
  return String(c._id);
}
