import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import Sale from "@/models/Sale";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import { applyStockDeltas, getProductsMapByIds } from "@/lib/stock";
import { incrementSoldQtyForSaleLineItems, netStock, revertSoldQtyForSaleLineItems } from "@/lib/partsInventory";

function lineTotal(row) {
  return Number(row.quantity || 0) * Number(row.price || 0) + Number(row.gstAmount || 0);
}

/** Each line must have exactly one of productId or stockGroupId (ledger). */
function sanitizeLineItems(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const x of input) {
    const pid = String(x?.productId || "").trim();
    const gid = String(x?.stockGroupId || "").trim();
    const hasP = mongoose.Types.ObjectId.isValid(pid);
    const hasG = mongoose.Types.ObjectId.isValid(gid);
    if ((hasP && hasG) || (!hasP && !hasG)) continue;
    const quantity = Number(x?.quantity ?? 0);
    const price = Number(x?.price ?? 0);
    const gstAmount = Math.max(0, Number(x?.gstAmount ?? 0));
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    if (!Number.isFinite(price) || price < 0) continue;
    out.push({
      productId: hasP ? new mongoose.Types.ObjectId(pid) : null,
      stockGroupId: hasG ? new mongoose.Types.ObjectId(gid) : null,
      quantity,
      price,
      gstAmount,
    });
  }
  return out;
}

function serializeLine(r) {
  const qty = Number(r.quantity || 0);
  const price = Number(r.price || 0);
  const gst = Number(r.gstAmount ?? 0);
  const sg = r.stockGroupId && typeof r.stockGroupId === "object" ? r.stockGroupId : null;
  const pr = r.productId && typeof r.productId === "object" ? r.productId : null;
  return {
    productId: pr ? { _id: String(pr._id), name: pr.name || "" } : null,
    stockGroupId: sg
      ? {
          _id: String(sg._id),
          mobileName: sg.mobileName || "",
          productName: sg.productName || "",
          quality: sg.quality || "",
        }
      : null,
    quantity: qty,
    price,
    gstAmount: gst,
    lineTotal: qty * price + gst,
  };
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const rows = await Sale.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(120)
      .populate("customerId", "name phone")
      .populate("products.productId", "name")
      .populate("products.stockGroupId", "mobileName productName quality salesCategoryId")
      .lean();
    const sales = rows.map((s) => ({
      _id: String(s._id),
      customerId: s.customerId
        ? { _id: String(s.customerId._id), name: s.customerId.name, phone: s.customerId.phone || "" }
        : null,
      walkInName: String(s.walkInName || ""),
      walkInPhone: String(s.walkInPhone || ""),
      customerLabel:
        s.customerId && typeof s.customerId === "object" && s.customerId.name
          ? s.customerId.name
          : [s.walkInName, s.walkInPhone].filter(Boolean).join(" · ") || "Walk-in customer",
      products: (s.products || []).map((r) => serializeLine(r)),
      totalAmount: Number(s.totalAmount || 0),
      date: s.date,
      createdAt: s.createdAt,
    }));
    return NextResponse.json({ sales });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load sales" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const customerIdRaw = String(body?.customerId || "").trim();
    const walkInName = String(body?.walkInName ?? "").trim();
    const walkInPhone = String(body?.walkInPhone ?? "").trim();
    const date = body?.date ? new Date(body.date) : new Date();
    const items = sanitizeLineItems(body?.products);
    const useSavedCustomer = Boolean(customerIdRaw && mongoose.Types.ObjectId.isValid(customerIdRaw));
    if (!useSavedCustomer && customerIdRaw) {
      return NextResponse.json({ error: "Select a valid customer or clear the field for walk-in" }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: "Add at least one line with a ledger row or product" }, { status: 400 });
    }
    if (!useSavedCustomer) {
      if (!walkInName) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const totalAmount = items.reduce((s, r) => s + lineTotal(r), 0);
    await connectDB();
    let customerId = null;
    if (useSavedCustomer) {
      const customer = await Customer.findById(customerIdRaw).lean();
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });
      customerId = customer._id;
    }

    const shopItems = items.filter((x) => x.productId);
    const partsItems = items.filter((x) => x.stockGroupId);

    if (shopItems.length) {
      const productsMap = await getProductsMapByIds(shopItems.map((x) => String(x.productId)));
      for (const row of shopItems) {
        const p = productsMap.get(String(row.productId));
        if (!p) return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
        if (Number(p.stock || 0) < Number(row.quantity || 0)) {
          return NextResponse.json({ error: `Insufficient stock for ${p.name}` }, { status: 400 });
        }
      }
    }

    for (const row of partsItems) {
      const g = await InventoryStockGroup.findById(row.stockGroupId).lean();
      if (!g) return NextResponse.json({ error: "One or more inventory lines not found" }, { status: 400 });
      const avail = netStock(g);
      if (avail < Number(row.quantity || 0)) {
        return NextResponse.json(
          {
            error: `Insufficient ledger stock for ${g.mobileName} — ${g.productName} (${g.quality}). Available: ${avail}`,
          },
          { status: 400 }
        );
      }
    }

    const sale = await Sale.create({
      customerId,
      walkInName: useSavedCustomer ? "" : walkInName,
      walkInPhone: useSavedCustomer ? "" : walkInPhone,
      products: items.map((r) => ({
        productId: r.productId || null,
        stockGroupId: r.stockGroupId || null,
        quantity: r.quantity,
        price: r.price,
        gstAmount: r.gstAmount,
      })),
      totalAmount,
      date,
    });

    if (shopItems.length) {
      await applyStockDeltas(
        shopItems.map((r) => ({
          productId: r.productId,
          delta: -Number(r.quantity || 0),
          reason: "sale",
          refModel: "Sale",
          refId: sale._id,
          note: "Sales entry",
        }))
      );
    }

    await incrementSoldQtyForSaleLineItems(
      items.map((r) => ({
        productId: r.productId ? String(r.productId) : "",
        stockGroupId: r.stockGroupId ? String(r.stockGroupId) : "",
        quantity: r.quantity,
      }))
    );

    return NextResponse.json({ ok: true, saleId: String(sale._id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to save sale" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const sales = await Sale.find().select("_id products").lean();
    if (!sales.length) return NextResponse.json({ ok: true, deleted: 0 });

    let deleted = 0;
    for (const sale of sales) {
      const lines = Array.isArray(sale.products) ? sale.products : [];
      await revertSoldQtyForSaleLineItems(
        lines.map((r) => ({
          stockGroupId: r.stockGroupId || null,
          productId: r.productId || null,
          quantity: r.quantity,
        }))
      );

      const shopLines = lines.filter((r) => r.productId);
      if (shopLines.length) {
        const requestedIds = [
          ...new Set(
            shopLines
              .map((r) => String(r.productId || ""))
              .filter((x) => mongoose.Types.ObjectId.isValid(x))
          ),
        ];
        const existingProducts = await Product.find({ _id: { $in: requestedIds } }).select("_id").lean();
        const existingIdSet = new Set(existingProducts.map((p) => String(p._id)));
        const restorableShopLines = shopLines.filter((r) => existingIdSet.has(String(r.productId)));
        if (restorableShopLines.length) {
          await applyStockDeltas(
            restorableShopLines.map((r) => ({
              productId: r.productId,
              delta: Number(r.quantity || 0),
              reason: "sale_return",
              refModel: "Sale",
              refId: sale._id,
              note: "Sale deleted — stock restored",
            }))
          );
        }
      }

      await Sale.deleteOne({ _id: sale._id });
      deleted += 1;
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed to clear sales" }, { status: 500 });
  }
}
