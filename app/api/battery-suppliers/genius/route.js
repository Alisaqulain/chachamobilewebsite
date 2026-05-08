import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import BatteryCatalogItem from "@/models/BatteryCatalogItem";
import Supplier from "@/models/Supplier";
import PartsPurchase from "@/models/PartsPurchase";
import SalesCategory from "@/models/SalesCategory";

function asText(v) {
  return String(v ?? "").trim();
}

function normKey(v) {
  return asText(v).toLowerCase();
}

export async function GET(request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const supplierId = asText(searchParams.get("supplierId"));
    const brand = asText(searchParams.get("brand"));
    const q = normKey(searchParams.get("q"));
    const active = searchParams.get("active");

    await connectDB();

    const supplier = supplierId
      ? await Supplier.findById(supplierId).select("_id name").lean()
      : { _id: null, name: "All suppliers" };
    if (supplierId && !supplier?._id) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
    }

    const filter = { supplierKey: "genius" };
    if (brand) filter.brand = brand;
    if (active === "1") filter.active = true;
    if (active === "0") filter.active = false;

    let items = await BatteryCatalogItem.find(filter).sort({ brand: 1, phoneModel: 1, batteryCode: 1 }).lean();
    if (q) {
      items = items.filter((r) => {
        const hay = [r.brand, r.phoneModel, r.batteryCode].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    // If catalog is empty, build a lightweight "virtual catalog" from Battery purchase entries.
    if (items.length === 0) {
      const batteryCats = await SalesCategory.find({ name: /^battery$/i }).select("_id").lean();
      const batteryIds = batteryCats.map((c) => c._id);
      const batteryPurchases =
        batteryIds.length === 0
          ? []
          : await PartsPurchase.find({
              ...(supplier?._id ? { supplierId: supplier._id } : {}),
              salesCategoryId: { $in: batteryIds },
            })
              .select("signatureName mobileName productName purchasePrice")
              .sort({ date: -1, createdAt: -1 })
              .limit(1200)
              .lean();

      const map = new Map();
      for (const p of batteryPurchases) {
        const b = asText(p.mobileName) || "—";
        const m = asText(p.productName) || "—";
        const code = asText(p.signatureName) || m;
        const key = `${b.toLowerCase()}|${m.toLowerCase()}|${code.toLowerCase()}`;
        if (map.has(key)) continue;
        map.set(key, {
          _id: key, // virtual id
          supplierKey: "genius",
          brand: b,
          phoneModel: m,
          batteryCode: code,
          listPrice: Number(p.purchasePrice || 0),
          active: true,
        });
      }

      items = [...map.values()].sort((a, b) =>
        [a.brand, a.phoneModel, a.batteryCode].join("|").localeCompare([b.brand, b.phoneModel, b.batteryCode].join("|"))
      );
    }

    const codes = [...new Set(items.map((x) => normKey(x.batteryCode)).filter(Boolean))];
    const brands = [...new Set(items.map((x) => normKey(x.brand)).filter(Boolean))];
    const models = [...new Set(items.map((x) => normKey(x.phoneModel)).filter(Boolean))];

    // Load recent battery-related purchases for this supplier and match in memory.
    const purchases = await PartsPurchase.find({ ...(supplier?._id ? { supplierId: supplier._id } : {}) })
      .select("signatureName mobileName productName quantity purchasePrice date lineTotal")
      .sort({ date: -1, createdAt: -1 })
      .limit(1200)
      .lean();

    const codeMap = new Map();
    const pairMap = new Map(); // brand|model fallback (for blank signature)

    for (const p of purchases) {
      const b = normKey(p.mobileName);
      const m = normKey(p.productName);
      const codeKey = normKey(p.signatureName);
      const qty = Number(p.quantity || 0);
      const price = Number(p.purchasePrice || 0);
      const total = Number(p.lineTotal || qty * price || 0);

      if (codeKey && codes.includes(codeKey)) {
        const curr = codeMap.get(codeKey) || {
          purchasedQty: 0,
          lastPurchasePrice: null,
          lastPurchaseDate: null,
          lastLineTotal: null,
          weightedTotal: 0,
          weightedQty: 0,
        };
        curr.purchasedQty += qty;
        curr.weightedTotal += qty * price;
        curr.weightedQty += qty;
        if (!curr.lastPurchaseDate || (p.date && new Date(p.date) > new Date(curr.lastPurchaseDate))) {
          curr.lastPurchaseDate = p.date || null;
          curr.lastPurchasePrice = Number.isFinite(price) ? price : null;
          curr.lastLineTotal = Number.isFinite(total) ? total : null;
        }
        codeMap.set(codeKey, curr);
        continue;
      }

      // Fallback match: brand+model (only if those are from our catalog universe)
      if (!codeKey && b && m && brands.includes(b) && models.includes(m)) {
        const pairKey = `${b}|${m}`;
        const curr = pairMap.get(pairKey) || {
          purchasedQty: 0,
          lastPurchasePrice: null,
          lastPurchaseDate: null,
          lastLineTotal: null,
          weightedTotal: 0,
          weightedQty: 0,
        };
        curr.purchasedQty += qty;
        curr.weightedTotal += qty * price;
        curr.weightedQty += qty;
        if (!curr.lastPurchaseDate || (p.date && new Date(p.date) > new Date(curr.lastPurchaseDate))) {
          curr.lastPurchaseDate = p.date || null;
          curr.lastPurchasePrice = Number.isFinite(price) ? price : null;
          curr.lastLineTotal = Number.isFinite(total) ? total : null;
        }
        pairMap.set(pairKey, curr);
      }
    }

    return NextResponse.json({
      supplier: { _id: supplier?._id ? String(supplier._id) : "", name: supplier?.name || "All suppliers" },
      items: items.map((r) => {
        const codeKey = normKey(r.batteryCode);
        const pairKey = `${normKey(r.brand)}|${normKey(r.phoneModel)}`;
        const sum = codeMap.get(codeKey) || pairMap.get(pairKey) || null;
        const avg = sum && sum.weightedQty > 0 ? sum.weightedTotal / sum.weightedQty : null;
        return {
          _id: String(r._id),
          brand: r.brand,
          phoneModel: r.phoneModel,
          batteryCode: r.batteryCode,
          support: asText(r.support),
          listPrice: Number(r.listPrice || 0),
          active: Boolean(r.active),
          purchased: Boolean(sum && sum.purchasedQty > 0),
          purchasedQty: sum ? Number(sum.purchasedQty || 0) : 0,
          lastPurchasePrice: sum?.lastPurchasePrice ?? null,
          lastPurchaseDate: sum?.lastPurchaseDate ?? null,
          lastPurchaseTotal: sum?.lastLineTotal ?? null,
          avgPurchasePrice: avg == null ? null : Math.round(avg * 100) / 100,
        };
      }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load genius battery supplier view" }, { status: 500 });
  }
}

