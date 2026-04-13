/**
 * Seed default admin and categories.
 * Usage: node scripts/seed.js
 * Requires MONGODB_URI in environment (e.g. .env.local loaded manually or export).
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
  const bcrypt = require("bcryptjs");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI (e.g. in .env.local) before running seed.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const Admin =
    mongoose.models.Admin ||
    mongoose.model(
      "Admin",
      new mongoose.Schema(
        {
          email: { type: String, required: true, unique: true },
          password: { type: String, required: true },
        },
        { timestamps: true }
      )
    );

  const Category =
    mongoose.models.Category ||
    mongoose.model(
      "Category",
      new mongoose.Schema(
        {
          name: { type: String, required: true },
          slug: { type: String, required: true, unique: true },
          image: { type: String, default: "" },
        },
        { timestamps: true }
      )
    );

  const Brand =
    mongoose.models.Brand ||
    mongoose.model(
      "Brand",
      new mongoose.Schema(
        {
          name: { type: String, required: true, unique: true },
          slug: { type: String, required: true, unique: true },
        },
        { timestamps: true }
      )
    );

  const phoneModelSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
      slug: { type: String, default: "" },
    },
    { timestamps: true }
  );
  phoneModelSchema.index({ brandId: 1, name: 1 }, { unique: true });
  const PhoneModel =
    mongoose.models.PhoneModel || mongoose.model("PhoneModel", phoneModelSchema);

  const slugify = (s) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const email = "yusuf@admin.com";
  const plain = "yusuf@110";
  const hash = await bcrypt.hash(plain, 10);

  await Admin.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, password: hash } },
    { upsert: true, new: true }
  );
  console.log("Admin ready:", email);

  const defaults = [
    { name: "Display", slug: "display" },
    { name: "Battery", slug: "battery" },
    { name: "Charging Jack", slug: "charging-jack" },
    { name: "Folder/Body", slug: "folder-body" },
    { name: "Speaker", slug: "speaker" },
    { name: "Camera", slug: "camera" },
  ];

  /** Keep in sync with `lib/partImages.js` CATEGORY_SLUG_CARD_IMAGE (Unsplash). */
  const CATEGORY_IMAGES = {
    display:
      "https://images.unsplash.com/photo-1592899677859-90f0c5d7c0c8?auto=format&fit=crop&w=500&q=82",
    battery:
      "https://images.unsplash.com/photo-1601784555128-393f09b9b0a5?auto=format&fit=crop&w=500&q=82",
    "charging-jack":
      "https://images.unsplash.com/photo-1583394837333-0879db6f85fa?auto=format&fit=crop&w=500&q=82",
    "folder-body":
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=500&q=82",
    speaker:
      "https://images.unsplash.com/photo-1556656793-08538906a9fa?auto=format&fit=crop&w=500&q=82",
    camera:
      "https://images.unsplash.com/photo-1609091839311-5367944d3491?auto=format&fit=crop&w=500&q=82",
  };

  for (const c of defaults) {
    await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: { name: c.name, slug: c.slug, image: CATEGORY_IMAGES[c.slug] || "" } },
      { upsert: true, new: true }
    );
  }
  console.log("Categories seeded:", defaults.map((d) => d.slug).join(", "));

  const brandModels = {
    Apple: ["iPhone 15 Pro", "iPhone 14", "iPhone 13", "iPhone 12"],
    Samsung: ["Galaxy S24 Ultra", "Galaxy A55", "Galaxy M34"],
    Xiaomi: ["14 Ultra", "Redmi Note 13", "POCO X6"],
    Oppo: ["Reno 11", "F25 Pro", "A79"],
    Vivo: ["V29 Pro", "V27", "Y200"],
    Realme: ["GT 6", "Narzo 70"],
    OnePlus: ["12", "Nord 4"],
    "Google (Pixel)": ["Pixel 9", "Pixel 8a"],
    Huawei: ["Pura 70", "Nova 12"],
    Honor: ["200", "90"],
  };

  for (const brandName of Object.keys(brandModels)) {
    const slug = slugify(brandName);
    let brand = await Brand.findOne({ slug });
    if (!brand) {
      try {
        brand = await Brand.create({ name: brandName, slug });
      } catch (e) {
        if (e?.code === 11000) {
          brand = await Brand.findOne({ slug });
        }
        if (!brand) throw e;
      }
    }
    for (const modelName of brandModels[brandName]) {
      await PhoneModel.findOneAndUpdate(
        { brandId: brand._id, name: modelName },
        { $setOnInsert: { name: modelName, brandId: brand._id, slug: slugify(modelName) } },
        { upsert: true, new: true }
      );
    }
  }
  console.log("Brands & phone models seeded.");

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
