/**
 * Dummy data for Sales System testing (purchases, sales, returns, stock).
 *
 * Usage:
 *   node scripts/seed-sales-dummy.js
 *   node scripts/seed-sales-dummy.js --force   (re-run: removes prior demo vouchers + movements for demo SKUs, then re-seeds)
 *
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

const DEMO_PREFIX = "[DEMO]";
const DEMO_SUPPLIER_NAME = `${DEMO_PREFIX} Wholesale Traders`;
const DEMO_SUPPLIER_B_NAME = `${DEMO_PREFIX} Metro Parts`;
const DEMO_CUSTOMER_NAME = `${DEMO_PREFIX} Neha Mobiles`;
const DEMO_CUSTOMER_B_NAME = `${DEMO_PREFIX} A1 Repairs`;

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function applyStockDeltas(Product, StockMovement, items) {
  if (!items.length) return;
  const byProduct = new Map();
  for (const item of items) {
    const key = String(item.productId);
    byProduct.set(key, (byProduct.get(key) || 0) + Number(item.delta || 0));
  }
  const ids = [...byProduct.keys()].filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const map = new Map(products.map((p) => [String(p._id), p]));
  for (const [productId, netDelta] of byProduct.entries()) {
    const p = map.get(productId);
    if (!p) throw new Error(`Product not found: ${productId}`);
    const next = Number(p.stock || 0) + Number(netDelta);
    if (next < 0) throw new Error(`Insufficient stock for ${p.name}`);
  }
  const { Types } = require("mongoose");
  const ops = [...byProduct.entries()].map(([productId, delta]) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(String(productId)) },
      update: { $inc: { stock: Number(delta) } },
    },
  }));
  if (ops.length) await Product.bulkWrite(ops);
  await StockMovement.insertMany(
    items.map((item) => ({
      productId: new Types.ObjectId(String(item.productId)),
      delta: Number(item.delta || 0),
      reason: item.reason,
      refModel: item.refModel || "",
      refId: item.refId ? new Types.ObjectId(String(item.refId)) : null,
      note: item.note || "",
    }))
  );
}

async function main() {
  const force = process.argv.includes("--force");
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI (e.g. in .env.local).");
    process.exit(1);
  }

  const mongoose = require("mongoose");
  await mongoose.connect(uri);

  const CategorySchema = new mongoose.Schema(
    { name: String, slug: { type: String, unique: true }, image: { type: String, default: "" } },
    { timestamps: true }
  );
  const BrandSchema = new mongoose.Schema(
    { name: { type: String, unique: true }, slug: { type: String, unique: true } },
    { timestamps: true }
  );
  const PhoneModelSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
      slug: { type: String, default: "" },
    },
    { timestamps: true }
  );
  PhoneModelSchema.index({ brandId: 1, name: 1 }, { unique: true });

  const ProductSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
      brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
      modelId: { type: mongoose.Schema.Types.ObjectId, ref: "PhoneModel", default: null },
      brand: { type: String, trim: true, default: "" },
      model: { type: String, trim: true, default: "" },
      price: { type: Number, required: true, min: 0 },
      purchasePrice: { type: Number, default: 0, min: 0 },
      sellingPrice: { type: Number, default: 0, min: 0 },
      stock: { type: Number, default: 0, min: 0 },
      quality: { type: String, required: true, trim: true },
      description: { type: String, default: "" },
      images: [{ type: String }],
      featured: { type: Boolean, default: false },
    },
    { timestamps: true }
  );

  const SupplierSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
  );
  SupplierSchema.index({ name: 1 }, { unique: true });

  const CustomerSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
  );
  CustomerSchema.index({ name: 1, phone: 1 }, { unique: true });

  const PurchaseItemSchema = new mongoose.Schema(
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
  );
  const PurchaseSchema = new mongoose.Schema(
    {
      supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
      products: { type: [PurchaseItemSchema], default: [] },
      totalAmount: { type: Number, required: true, min: 0 },
      date: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );

  const SaleItemSchema = new mongoose.Schema(
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
  );
  const SaleSchema = new mongoose.Schema(
    {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
      products: { type: [SaleItemSchema], default: [] },
      totalAmount: { type: Number, required: true, min: 0 },
      date: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );

  const ReturnItemSchema = new mongoose.Schema(
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      qty: { type: Number, required: true, min: 1 },
    },
    { _id: false }
  );
  const ReturnSchema = new mongoose.Schema(
    {
      type: { type: String, enum: ["purchase_return", "sale_return"], required: true },
      partyId: { type: mongoose.Schema.Types.ObjectId, required: true },
      products: { type: [ReturnItemSchema], default: [] },
      date: { type: Date, default: Date.now },
    },
    { timestamps: true }
  );

  const StockMovementSchema = new mongoose.Schema(
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      delta: { type: Number, required: true },
      reason: {
        type: String,
        enum: ["purchase", "sale", "purchase_return", "sale_return", "manual"],
        required: true,
      },
      refModel: { type: String, default: "" },
      refId: { type: mongoose.Schema.Types.ObjectId, default: null },
      note: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
  );

  const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
  const Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
  const PhoneModel = mongoose.models.PhoneModel || mongoose.model("PhoneModel", PhoneModelSchema);
  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
  const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);
  const Customer = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
  const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);
  const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
  const ReturnEntry = mongoose.models.ReturnEntry || mongoose.model("ReturnEntry", ReturnSchema);
  const StockMovement = mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);

  let catBattery = await Category.findOne({ slug: "battery" });
  if (!catBattery) {
    catBattery = await Category.create({ name: "Battery", slug: "battery", image: "" });
  }
  let catDisplay = await Category.findOne({ slug: "display" });
  if (!catDisplay) {
    catDisplay = await Category.create({ name: "Display", slug: "display", image: "" });
  }

  let brandApple = await Brand.findOne({ slug: "apple" });
  if (!brandApple) {
    brandApple = await Brand.create({ name: "Apple", slug: "apple" });
  }
  let brandSamsung = await Brand.findOne({ slug: "samsung" });
  if (!brandSamsung) {
    brandSamsung = await Brand.create({ name: "Samsung", slug: "samsung" });
  }

  let mIphone12 = await PhoneModel.findOne({ brandId: brandApple._id, name: "iPhone 12" });
  if (!mIphone12) {
    mIphone12 = await PhoneModel.create({
      name: "iPhone 12",
      brandId: brandApple._id,
      slug: slugify("iPhone 12"),
    });
  }
  let mS24 = await PhoneModel.findOne({ brandId: brandSamsung._id, name: "Galaxy S24 Ultra" });
  if (!mS24) {
    mS24 = await PhoneModel.create({
      name: "Galaxy S24 Ultra",
      brandId: brandSamsung._id,
      slug: slugify("Galaxy S24 Ultra"),
    });
  }

  const demoProductSpecs = [
    {
      name: `${DEMO_PREFIX} iPhone 12 — Battery (Original)`,
      categoryId: catBattery._id,
      brandId: brandApple._id,
      modelId: mIphone12._id,
      brand: "Apple",
      model: "iPhone 12",
      purchasePrice: 800,
      sellingPrice: 1299,
      quality: "Original",
    },
    {
      name: `${DEMO_PREFIX} iPhone 12 — Display (Original)`,
      categoryId: catDisplay._id,
      brandId: brandApple._id,
      modelId: mIphone12._id,
      brand: "Apple",
      model: "iPhone 12",
      purchasePrice: 4500,
      sellingPrice: 6999,
      quality: "Original",
    },
    {
      name: `${DEMO_PREFIX} Galaxy S24 Ultra — Battery (High)`,
      categoryId: catBattery._id,
      brandId: brandSamsung._id,
      modelId: mS24._id,
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      purchasePrice: 950,
      sellingPrice: 1599,
      quality: "High",
    },
  ];

  const demoProducts = [];
  for (const spec of demoProductSpecs) {
    let p = await Product.findOne({ name: spec.name });
    if (!p) {
      p = await Product.create({
        ...spec,
        price: spec.sellingPrice,
        stock: 0,
        description: "Seeded demo SKU for sales system UI testing.",
        images: [],
        featured: false,
      });
    } else {
      await Product.updateOne(
        { _id: p._id },
        {
          $set: {
            purchasePrice: spec.purchasePrice,
            sellingPrice: spec.sellingPrice,
            price: spec.sellingPrice,
            categoryId: spec.categoryId,
            brandId: spec.brandId,
            modelId: spec.modelId,
            quality: spec.quality,
          },
        }
      );
      p = await Product.findById(p._id);
    }
    demoProducts.push(p);
  }

  const supplierA = await Supplier.findOneAndUpdate(
    { name: DEMO_SUPPLIER_NAME },
    {
      $setOnInsert: {
        name: DEMO_SUPPLIER_NAME,
        phone: "9876500100",
        address: "Lamington Road, Mumbai",
      },
    },
    { upsert: true, new: true }
  );
  const supplierB = await Supplier.findOneAndUpdate(
    { name: DEMO_SUPPLIER_B_NAME },
    {
      $setOnInsert: {
        name: DEMO_SUPPLIER_B_NAME,
        phone: "9876500200",
        address: "SP Road, Hyderabad",
      },
    },
    { upsert: true, new: true }
  );

  const customerA = await Customer.findOneAndUpdate(
    { name: DEMO_CUSTOMER_NAME, phone: "9123400100" },
    { $setOnInsert: { name: DEMO_CUSTOMER_NAME, phone: "9123400100" } },
    { upsert: true, new: true }
  );
  const customerB = await Customer.findOneAndUpdate(
    { name: DEMO_CUSTOMER_B_NAME, phone: "9123400200" },
    { $setOnInsert: { name: DEMO_CUSTOMER_B_NAME, phone: "9123400200" } },
    { upsert: true, new: true }
  );

  const demoProductIds = demoProducts.map((p) => p._id);

  async function wipeDemoVouchers() {
    const purchases = await Purchase.find({ supplierId: { $in: [supplierA._id, supplierB._id] } }).lean();
    const sales = await Sale.find({ customerId: { $in: [customerA._id, customerB._id] } }).lean();
    const returns = await ReturnEntry.find({
      $or: [{ partyId: supplierA._id }, { partyId: supplierB._id }, { partyId: customerA._id }, { partyId: customerB._id }],
    }).lean();
    const refIds = [
      ...purchases.map((p) => p._id),
      ...sales.map((s) => s._id),
      ...returns.map((r) => r._id),
    ];
    if (refIds.length) {
      await StockMovement.deleteMany({
        refId: { $in: refIds },
      });
    }
    await Purchase.deleteMany({ _id: { $in: purchases.map((p) => p._id) } });
    await Sale.deleteMany({ _id: { $in: sales.map((s) => s._id) } });
    await ReturnEntry.deleteMany({ _id: { $in: returns.map((r) => r._id) } });
    await StockMovement.deleteMany({ productId: { $in: demoProductIds } });
    await Product.updateMany({ _id: { $in: demoProductIds } }, { $set: { stock: 0 } });
    console.log("Cleared previous demo purchases/sales/returns and reset demo SKU stock.");
  }

  const already = await Purchase.exists({ supplierId: supplierA._id });
  if (already && !force) {
    console.log("Demo sales data already present. Run with --force to reset and re-seed.");
    await mongoose.disconnect();
    return;
  }
  if (force && already) {
    await wipeDemoVouchers();
  }

  const [p1, p2, p3] = demoProducts;

  const purchaseItems = [
    { productId: p1._id, quantity: 25, price: 800 },
    { productId: p2._id, quantity: 8, price: 4500 },
    { productId: p3._id, quantity: 15, price: 900 },
  ];
  const purchaseTotal = purchaseItems.reduce((s, r) => s + r.quantity * r.price, 0);
  const purchase = await Purchase.create({
    supplierId: supplierA._id,
    products: purchaseItems,
    totalAmount: purchaseTotal,
    date: new Date(Date.now() - 86400000 * 2),
  });
  await applyStockDeltas(
    Product,
    StockMovement,
    purchaseItems.map((r) => ({
      productId: r.productId,
      delta: r.quantity,
      reason: "purchase",
      refModel: "Purchase",
      refId: purchase._id,
      note: "Demo purchase",
    }))
  );

  const purchase2Items = [{ productId: p1._id, quantity: 10, price: 780 }];
  const purchase2Total = purchase2Items.reduce((s, r) => s + r.quantity * r.price, 0);
  const purchase2 = await Purchase.create({
    supplierId: supplierB._id,
    products: purchase2Items,
    totalAmount: purchase2Total,
    date: new Date(Date.now() - 86400000),
  });
  await applyStockDeltas(
    Product,
    StockMovement,
    purchase2Items.map((r) => ({
      productId: r.productId,
      delta: r.quantity,
      reason: "purchase",
      refModel: "Purchase",
      refId: purchase2._id,
      note: "Demo purchase 2",
    }))
  );

  const saleItems = [
    { productId: p1._id, quantity: 5, price: 1299 },
    { productId: p3._id, quantity: 3, price: 1599 },
  ];
  const saleTotal = saleItems.reduce((s, r) => s + r.quantity * r.price, 0);
  const sale = await Sale.create({
    customerId: customerA._id,
    products: saleItems,
    totalAmount: saleTotal,
    date: new Date(Date.now() - 3600000 * 6),
  });
  await applyStockDeltas(
    Product,
    StockMovement,
    saleItems.map((r) => ({
      productId: r.productId,
      delta: -r.quantity,
      reason: "sale",
      refModel: "Sale",
      refId: sale._id,
      note: "Demo sale",
    }))
  );

  const prItems = [{ productId: p1._id, qty: 2 }];
  const pr = await ReturnEntry.create({
    type: "purchase_return",
    partyId: supplierA._id,
    products: prItems,
    date: new Date(Date.now() - 3600000 * 3),
  });
  await applyStockDeltas(
    Product,
    StockMovement,
    prItems.map((r) => ({
      productId: r.productId,
      delta: -r.qty,
      reason: "purchase_return",
      refModel: "ReturnEntry",
      refId: pr._id,
      note: "Demo purchase return",
    }))
  );

  const srItems = [{ productId: p3._id, qty: 1 }];
  const sr = await ReturnEntry.create({
    type: "sale_return",
    partyId: customerA._id,
    products: srItems,
    date: new Date(Date.now() - 3600000 * 2),
  });
  await applyStockDeltas(
    Product,
    StockMovement,
    srItems.map((r) => ({
      productId: r.productId,
      delta: r.qty,
      reason: "sale_return",
      refModel: "ReturnEntry",
      refId: sr._id,
      note: "Demo sale return",
    }))
  );

  const refreshed = await Product.find({ _id: { $in: demoProductIds } }).lean();
  console.log("Demo sales seed complete.");
  console.log("Suppliers:", DEMO_SUPPLIER_NAME, ",", DEMO_SUPPLIER_B_NAME);
  console.log("Customers:", DEMO_CUSTOMER_NAME, ",", DEMO_CUSTOMER_B_NAME);
  console.log("Demo SKUs stock:", refreshed.map((x) => `${x.name}: ${x.stock}`).join(" | "));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
