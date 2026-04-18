/**
 * Replace linkedProductId unique index so unlinked rows (null / missing) are not forced unique.
 * Run once after upgrading the InventoryStockGroup schema:
 *   npm run fix:inventory-linked-index
 * Requires MONGODB_URI (e.g. from .env.local).
 */

const path = require("path");
const fs = require("fs");

const dotenvPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(dotenvPath)) {
  const content = fs.readFileSync(dotenvPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].replace(/^["']|["']$/g, "");
      process.env[m[1]] = v;
    }
  }
}

async function main() {
  const mongoose = require("mongoose");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI (e.g. in .env.local).");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const col = mongoose.connection.collection("inventorystockgroups");

  try {
    await col.dropIndex("linkedProductId_1");
    console.log("Dropped index: linkedProductId_1");
  } catch (e) {
    if (e.code === 27 || e.codeName === "IndexNotFound") {
      console.log("Index linkedProductId_1 was not present (ok).");
    } else {
      throw e;
    }
  }

  await col.createIndex(
    { linkedProductId: 1 },
    {
      unique: true,
      name: "linkedProductId_1",
      partialFilterExpression: { linkedProductId: { $type: "objectId" } },
    }
  );
  console.log("Created partial unique index on linkedProductId (ObjectId only).");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
