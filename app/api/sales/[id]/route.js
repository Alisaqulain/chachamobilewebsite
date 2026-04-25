import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import { applyStockDeltas } from "@/lib/stock";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import { netStock, revertSoldQtyForSaleLineItems } from "@/lib/partsInventory";

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

function lineTotal(row) {
  return Number(row.quantity || 0) * Number(row.price || 0) + Number(row.gstAmount || 0);
}

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

function toKey(row) {
  if (row.productId) return `p:${String(row.productId)}`;
  if (row.stockGroupId) return `g:${String(row.stockGroupId)}`;
  return "";
}

function aggregateQtyByKey(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const key = toKey(row);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + Number(row.quantity || 0));
  }
  return map;
}

export async function GET(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const s = await Sale.findById(id)
      .populate("customerId", "name phone")
      .populate("products.productId", "name")
      .populate("products.stockGroupId", "mobileName productName quality salesCategoryId")
      .lean();
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const sale = {
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
    };
    return NextResponse.json({ sale });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await request.json();
    await connectDB();
    const prev = await Sale.findById(id).lean();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const date = body?.date ? new Date(body.date) : prev.date;
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const useSaved = Boolean(prev.customerId);
    if (useSaved) {
      await Sale.updateOne({ _id: id }, { $set: { date } });
    } else {
      const walkInName = String(body?.walkInName ?? prev.walkInName ?? "").trim();
      const walkInPhone = String(body?.walkInPhone ?? prev.walkInPhone ?? "").trim();
      if (!walkInName) return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
      await Sale.updateOne({ _id: id }, { $set: { walkInName, walkInPhone, date } });
    }

    let nextProducts = null;
    if (Array.isArray(body?.products)) {
      nextProducts = sanitizeLineItems(body.products);
      if (!nextProducts.length) {
        return NextResponse.json({ error: "Add at least one valid line item" }, { status: 400 });
      }

      const prevProducts = Array.isArray(prev.products) ? prev.products : [];
      const prevByKey = aggregateQtyByKey(prevProducts);
      const nextByKey = aggregateQtyByKey(nextProducts);

      const allKeys = new Set([...prevByKey.keys(), ...nextByKey.keys()]);
      const shopDeltas = [];
      const groupDeltas = [];
      for (const key of allKeys) {
        const prevQty = Number(prevByKey.get(key) || 0);
        const nextQty = Number(nextByKey.get(key) || 0);
        const diff = nextQty - prevQty;
        if (!diff) continue;
        if (key.startsWith("p:")) {
          const productId = key.slice(2);
          shopDeltas.push({ productId, diff, prevQty, nextQty });
        } else if (key.startsWith("g:")) {
          const stockGroupId = key.slice(2);
          groupDeltas.push({ stockGroupId, diff, prevQty, nextQty });
        }
      }

      if (shopDeltas.length) {
        const products = await Product.find({
          _id: { $in: shopDeltas.map((x) => new mongoose.Types.ObjectId(x.productId)) },
        }).lean();
        const productsMap = new Map(products.map((p) => [String(p._id), p]));
        for (const row of shopDeltas) {
          const p = productsMap.get(String(row.productId));
          if (!p) return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
          const availableAfterRevert = Number(p.stock || 0) + row.prevQty;
          if (availableAfterRevert < row.nextQty) {
            return NextResponse.json(
              { error: `Insufficient stock for ${p.name}. Available: ${availableAfterRevert}` },
              { status: 400 }
            );
          }
        }
      }

      if (groupDeltas.length) {
        const groups = await InventoryStockGroup.find({
          _id: { $in: groupDeltas.map((x) => new mongoose.Types.ObjectId(x.stockGroupId)) },
        }).lean();
        const groupsMap = new Map(groups.map((g) => [String(g._id), g]));
        for (const row of groupDeltas) {
          const g = groupsMap.get(String(row.stockGroupId));
          if (!g) return NextResponse.json({ error: "One or more inventory lines not found" }, { status: 400 });
          const availableAfterRevert = netStock(g) + row.prevQty;
          if (availableAfterRevert < row.nextQty) {
            return NextResponse.json(
              {
                error: `Insufficient ledger stock for ${g.mobileName} — ${g.productName} (${g.quality}). Available: ${availableAfterRevert}`,
              },
              { status: 400 }
            );
          }
        }
      }

      if (shopDeltas.length) {
        await applyStockDeltas(
          shopDeltas.map((row) => ({
            productId: row.productId,
            delta: -row.diff,
            reason: "sale_edit",
            refModel: "Sale",
            refId: prev._id,
            note: "Sale edited",
          }))
        );
      }

      for (const row of groupDeltas) {
        await InventoryStockGroup.updateOne(
          { _id: new mongoose.Types.ObjectId(row.stockGroupId) },
          { $inc: { soldQty: row.diff } }
        );
      }

      await Sale.updateOne(
        { _id: id },
        {
          $set: {
            products: nextProducts.map((r) => ({
              productId: r.productId || null,
              stockGroupId: r.stockGroupId || null,
              quantity: r.quantity,
              price: r.price,
              gstAmount: r.gstAmount,
            })),
            totalAmount: nextProducts.reduce((sum, r) => sum + lineTotal(r), 0),
          },
        }
      );
    }

    const updated = await Sale.findById(id)
      .populate("customerId", "name phone")
      .populate("products.productId", "name")
      .populate("products.stockGroupId", "mobileName productName quality salesCategoryId")
      .lean();
    const sale = {
      _id: String(updated._id),
      customerId: updated.customerId
        ? { _id: String(updated.customerId._id), name: updated.customerId.name, phone: updated.customerId.phone || "" }
        : null,
      walkInName: String(updated.walkInName || ""),
      walkInPhone: String(updated.walkInPhone || ""),
      customerLabel:
        updated.customerId && typeof updated.customerId === "object" && updated.customerId.name
          ? updated.customerId.name
          : [updated.walkInName, updated.walkInPhone].filter(Boolean).join(" · ") || "Walk-in customer",
      products: (updated.products || []).map((r) => serializeLine(r)),
      totalAmount: Number(updated.totalAmount || 0),
      date: updated.date,
      createdAt: updated.createdAt,
    };
    return NextResponse.json({ sale });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const prev = await Sale.findById(id).lean();
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await revertSoldQtyForSaleLineItems(
      (prev.products || []).map((r) => ({
        stockGroupId: r.stockGroupId || null,
        productId: r.productId || null,
        quantity: r.quantity,
      }))
    );

    const shopLines = (prev.products || []).filter((r) => r.productId);
    if (shopLines.length) {
      await applyStockDeltas(
        shopLines.map((r) => ({
          productId: r.productId,
          delta: Number(r.quantity || 0),
          reason: "sale_delete",
          refModel: "Sale",
          refId: prev._id,
          note: "Sale deleted — stock restored",
        }))
      );
    }

    await Sale.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
