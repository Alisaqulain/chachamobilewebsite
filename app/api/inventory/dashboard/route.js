import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getAdminFromCookies } from "@/lib/auth";
import InventoryStockGroup from "@/models/InventoryStockGroup";
import Supplier from "@/models/Supplier";
import Category from "@/models/Category";
import PartsPurchase from "@/models/PartsPurchase";
import PartsPurchaseReturn from "@/models/PartsPurchaseReturn";
import Sale from "@/models/Sale";
import { netStock } from "@/lib/partsInventory";

const LOW = 5;
/** Day boundaries for rollups (India). */
const TZ = "Asia/Kolkata";

function rollingMonthKeys(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();

    const generatedAt = new Date().toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      groups,
      supplierCount,
      cats,
      purchases,
      retAgg,
      purchaseValueAgg,
      lastPurchaseBySup,
      purchasesByDay,
      recentPurchaseLines,
      recentReturnLines,
      partsByMonth,
      salesByMonth,
    ] = await Promise.all([
      InventoryStockGroup.find().lean(),
      Supplier.countDocuments(),
      Category.find().select("name").lean(),
      PartsPurchase.find().select("supplierId quantity _id").lean(),
      PartsPurchaseReturn.aggregate([
        { $group: { _id: "$partsPurchaseId", q: { $sum: "$quantity" } } },
      ]),
      PartsPurchase.aggregate([
        { $group: { _id: "$supplierId", totalAmount: { $sum: "$lineTotal" }, lines: { $sum: 1 } } },
      ]),
      PartsPurchase.aggregate([
        { $group: { _id: "$supplierId", lastPurchaseAt: { $max: "$date" } } },
      ]),
      PartsPurchase.aggregate([
        { $match: { date: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: TZ } },
            lines: { $sum: 1 },
            amount: { $sum: "$lineTotal" },
            units: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: -1 } },
      ]),
      PartsPurchase.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(20)
        .select("supplierId date productName mobileName quality quantity lineTotal categoryId")
        .lean(),
      PartsPurchaseReturn.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(15)
        .select("partsPurchaseId supplierId quantity date notes")
        .lean(),
      PartsPurchase.aggregate([
        { $match: { date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: TZ } },
            amount: { $sum: "$lineTotal" },
            lines: { $sum: 1 },
            units: { $sum: "$quantity" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Sale.aggregate([
        { $match: { date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: TZ } },
            amount: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const monthKeys = rollingMonthKeys(12);
    const pm = new Map(partsByMonth.map((x) => [x._id, x]));
    const sm = new Map(salesByMonth.map((x) => [x._id, x]));
    const monthlyOverview = monthKeys.map((month) => ({
      month,
      partsPurchaseTotal: Number(pm.get(month)?.amount || 0),
      partsLines: Number(pm.get(month)?.lines || 0),
      partsUnits: Number(pm.get(month)?.units || 0),
      shopSalesTotal: Number(sm.get(month)?.amount || 0),
      shopSalesCount: Number(sm.get(month)?.count || 0),
    }));
    const cur = monthlyOverview[monthlyOverview.length - 1];
    const monthHighlights = {
      month: cur?.month || monthKeys[monthKeys.length - 1],
      partsPurchaseTotal: cur?.partsPurchaseTotal ?? 0,
      partsLines: cur?.partsLines ?? 0,
      shopSalesTotal: cur?.shopSalesTotal ?? 0,
      shopSalesCount: cur?.shopSalesCount ?? 0,
    };

    const lastPurchaseMap = new Map(
      lastPurchaseBySup.map((x) => [String(x._id), x.lastPurchaseAt ? new Date(x.lastPurchaseAt).toISOString() : null])
    );

    const catMap = new Map(cats.map((c) => [String(c._id), c.name]));
    const retByPurchase = new Map(retAgg.map((r) => [String(r._id), Number(r.q || 0)]));

    const supplierNetIn = new Map();
    for (const p of purchases) {
      const sid = String(p.supplierId);
      const ret = retByPurchase.get(String(p._id)) || 0;
      const net = Number(p.quantity || 0) - ret;
      supplierNetIn.set(sid, (supplierNetIn.get(sid) || 0) + net);
    }

    let totalPartsStock = 0;
    const lowStock = [];
    for (const g of groups) {
      const n = netStock(g);
      totalPartsStock += Math.max(0, n);
      if (n < LOW && n >= 0) {
        lowStock.push({
          _id: String(g._id),
          categoryId: String(g.categoryId),
          categoryName: catMap.get(String(g.categoryId)) || "",
          mobileName: g.mobileName,
          productName: g.productName,
          quality: g.quality,
          netStock: n,
        });
      }
    }
    lowStock.sort((a, b) => a.netStock - b.netStock);

    const valueBySup = new Map(
      purchaseValueAgg.map((x) => [String(x._id), { totalAmount: Number(x.totalAmount || 0), lines: Number(x.lines || 0) }])
    );
    const returnUnitsBySup = await PartsPurchaseReturn.aggregate([
      {
        $lookup: {
          from: "partspurchases",
          localField: "partsPurchaseId",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: "$p" },
      { $group: { _id: "$p.supplierId", units: { $sum: "$quantity" } } },
    ]);
    const retUnitsMap = new Map(returnUnitsBySup.map((r) => [String(r._id), Number(r.units || 0)]));

    const supplierRows = await Supplier.find().sort({ name: 1 }).lean();
    const supNameMap = new Map(supplierRows.map((s) => [String(s._id), s.name]));
    const supplierSummary = supplierRows.map((s) => {
      const sid = String(s._id);
      const pv = valueBySup.get(sid) || { totalAmount: 0, lines: 0 };
      return {
        _id: sid,
        name: s.name,
        totalPurchasedAmount: pv.totalAmount,
        purchaseLineCount: pv.lines,
        totalReturnedUnits: retUnitsMap.get(sid) || 0,
        netUnitsFromSupplier: supplierNetIn.get(sid) || 0,
        lastPurchaseAt: lastPurchaseMap.get(sid) || null,
      };
    });

    const recentPurchasesPayload = recentPurchaseLines.map((p) => ({
      _id: String(p._id),
      date: p.date ? new Date(p.date).toISOString() : null,
      supplierName: supNameMap.get(String(p.supplierId)) || "—",
      productName: p.productName,
      mobileName: p.mobileName || "",
      quality: p.quality,
      quantity: Number(p.quantity || 0),
      lineTotal: Number(p.lineTotal || 0),
      categoryName: catMap.get(String(p.categoryId)) || "",
    }));

    const retPurchaseIds = [...new Set(recentReturnLines.map((r) => String(r.partsPurchaseId)))];
    const retPurchaseDocs =
      retPurchaseIds.length > 0
        ? await PartsPurchase.find({ _id: { $in: retPurchaseIds } }).select("productName").lean()
        : [];
    const retProductMap = new Map(retPurchaseDocs.map((p) => [String(p._id), p.productName]));
    const recentReturnsPayload = recentReturnLines.map((r) => ({
      _id: String(r._id),
      date: r.date ? new Date(r.date).toISOString() : null,
      supplierName: supNameMap.get(String(r.supplierId)) || "—",
      productName: retProductMap.get(String(r.partsPurchaseId)) || "—",
      quantity: Number(r.quantity || 0),
      notes: r.notes || "",
    }));

    return NextResponse.json({
      generatedAt,
      timezoneLabel: TZ,
      totalPartsStock,
      supplierCount,
      lowStockItems: lowStock.slice(0, 80),
      lowStockCount: lowStock.length,
      supplierSummary,
      monthlyOverview,
      monthHighlights,
      purchasesByDay: purchasesByDay.map((d) => ({
        day: d._id,
        lines: d.lines,
        units: d.units,
        amount: Number(d.amount || 0),
      })),
      recentPartsPurchases: recentPurchasesPayload,
      recentPartsReturns: recentReturnsPayload,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
