import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  await runOnceMigrations();

  return cached.conn;
}

/** Normalize legacy quality labels after schema change. */
async function runOnceMigrations() {
  if (global.__chachaDbMigrations) return;
  global.__chachaDbMigrations = true;
  try {
    const { default: Product } = await import("@/models/Product");
    await Product.updateMany({ quality: "High Copy" }, { $set: { quality: "High" } });
    await Product.updateMany({ quality: "Low Copy" }, { $set: { quality: "Low" } });
    const { migrateProductRefsOnce } = await import("@/lib/migrateProductRefs");
    await migrateProductRefsOnce();
  } catch (e) {
    console.error("DB migration (quality labels):", e);
  }
}
