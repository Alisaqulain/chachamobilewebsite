import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Link from "next/link";

export const dynamic = "force-dynamic";

function readyStateLabel(state) {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

export default async function CheckPage() {
  let connected = false;
  let message = "";
  let dbName = "";
  let host = "";
  let readyState = null;

  try {
    await connectDB();
    readyState = mongoose.connection.readyState;
    connected = readyState === 1;
    dbName = mongoose.connection.name || "";
    host = mongoose.connection.host || "";
    message = connected
      ? "MongoDB connection is healthy."
      : `Unexpected ready state: ${readyStateLabel(readyState)}`;
  } catch (e) {
    message = e?.message || "Failed to connect to MongoDB.";
  }

  return (
    <div className="page-3d-enter mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className="surface-3d-hover rounded-2xl border border-black/10 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-extrabold text-black">Database check</h1>
        <p className="mt-1 text-sm text-black/55">MongoDB Atlas / Mongoose connection test</p>

        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm font-medium ${
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {connected ? "● Connected" : "○ Not connected"}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-black/75">{message}</p>

        {connected && (
          <ul className="mt-4 space-y-1 text-xs text-black/60">
            <li>
              <span className="font-semibold text-black/70">Database:</span> {dbName || "—"}
            </li>
            <li>
              <span className="font-semibold text-black/70">Host:</span> {host || "—"}
            </li>
            <li>
              <span className="font-semibold text-black/70">Ready state:</span>{" "}
              {readyStateLabel(readyState)} ({readyState})
            </li>
          </ul>
        )}

        <p className="mt-6 text-xs text-black/45">
          This page calls <code className="rounded bg-black/5 px-1">connectDB()</code> on the
          server. Remove or protect this route in production if you do not want it public.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-semibold text-brand-dim hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
