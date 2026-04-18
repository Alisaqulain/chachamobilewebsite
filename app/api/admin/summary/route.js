import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Supplier from "@/models/Supplier";
import Customer from "@/models/Customer";
import Purchase from "@/models/Purchase";
import Sale from "@/models/Sale";
import ReturnEntry from "@/models/Return";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const [
      productCount,
      categoryCount,
      supplierCount,
      customerCount,
      purchaseCount,
      saleCount,
      returnCount,
      lowStockCount,
      recentRaw,
      stockAgg,
      todaySalesAgg,
      lowStockRaw,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Supplier.countDocuments(),
      Customer.countDocuments(),
      Purchase.countDocuments(),
      Sale.countDocuments(),
      ReturnEntry.countDocuments(),
      Product.countDocuments({ stock: { $lt: 5 } }),
      Product.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("categoryId", "name slug")
        .lean(),
      Product.aggregate([{ $group: { _id: null, totalStock: { $sum: "$stock" } } }]),
      Sale.aggregate([
        { $match: { date: { $gte: startOfToday, $lt: endOfToday } } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
      ]),
      Product.find({ stock: { $lt: 5 } })
        .sort({ stock: 1 })
        .limit(50)
        .populate("categoryId", "name slug")
        .populate("brandId", "name")
        .populate("modelId", "name")
        .lean(),
    ]);

    const mapProduct = (p) => ({
      ...p,
      _id: p._id.toString(),
      categoryId: p.categoryId
        ? {
            _id: p.categoryId._id.toString(),
            name: p.categoryId.name,
            slug: p.categoryId.slug,
          }
        : null,
      brandId:
        p.brandId && typeof p.brandId === "object"
          ? { _id: p.brandId._id.toString(), name: p.brandId.name }
          : p.brandId,
      modelId:
        p.modelId && typeof p.modelId === "object"
          ? { _id: p.modelId._id.toString(), name: p.modelId.name }
          : p.modelId,
    });

    const recentProducts = recentRaw.map(mapProduct);

    const totalStock = Number(stockAgg[0]?.totalStock ?? 0);
    const todaySalesCount = Number(todaySalesAgg[0]?.count ?? 0);
    const todaySalesAmount = Number(todaySalesAgg[0]?.amount ?? 0);

    const lowStockItems = lowStockRaw.map((p) => {
      const m = mapProduct(p);
      const brand = m.brandId?.name || p.brand || "";
      const model = m.modelId?.name || p.model || "";
      const cat = m.categoryId?.name || "";
      return {
        _id: m._id,
        name: p.name,
        brand,
        model,
        mobileLabel: [brand, model].filter(Boolean).join(" ").trim() || p.name,
        category: cat,
        quality: p.quality,
        stock: Number(p.stock ?? 0),
        sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
      };
    });

    return NextResponse.json({
      productCount,
      categoryCount,
      supplierCount,
      customerCount,
      purchaseCount,
      saleCount,
      returnCount,
      lowStockCount,
      totalStock,
      todaySalesCount,
      todaySalesAmount,
      lowStockItems,
      recentProducts,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
