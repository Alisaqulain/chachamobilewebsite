import Brand from "@/models/Brand";
import PhoneModel from "@/models/PhoneModel";
import Product from "@/models/Product";
import { slugify } from "@/utils/slugify";

/**
 * Backfill brandId / modelId from legacy string brand + model fields.
 */
export async function migrateProductRefsOnce() {
  if (global.__chachaProductRefsMigrated) return;
  global.__chachaProductRefsMigrated = true;

  const products = await Product.find({
    $or: [
      { brandId: { $exists: false } },
      { brandId: null },
      { modelId: { $exists: false } },
      { modelId: null },
    ],
  }).lean();

  for (const p of products) {
    const bName = (p.brand || "").trim();
    const mName = (p.model || "").trim();
    if (!bName || !mName) continue;

    let brand = await Brand.findOne({ name: new RegExp(`^${escapeRx(bName)}$`, "i") });
    if (!brand) {
      try {
        brand = await Brand.create({ name: bName });
      } catch (e) {
        if (e?.code === 11000) {
          brand = await Brand.findOne({ slug: slugify(bName) });
        }
        if (!brand) {
          brand = await Brand.findOne({ name: new RegExp(`^${escapeRx(bName)}$`, "i") });
        }
        if (!brand) throw e;
      }
    }

    let pm = await PhoneModel.findOne({
      brandId: brand._id,
      name: new RegExp(`^${escapeRx(mName)}$`, "i"),
    });
    if (!pm) {
      try {
        pm = await PhoneModel.create({ name: mName, brandId: brand._id });
      } catch (e) {
        if (e?.code === 11000) {
          pm = await PhoneModel.findOne({
            brandId: brand._id,
            name: new RegExp(`^${escapeRx(mName)}$`, "i"),
          });
        }
        if (!pm) throw e;
      }
    }

    await Product.updateOne(
      { _id: p._id },
      {
        $set: {
          brandId: brand._id,
          modelId: pm._id,
          brand: bName,
          model: mName,
        },
      }
    );
  }
}

function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
