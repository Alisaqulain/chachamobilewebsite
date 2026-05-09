"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DownloadExports from "@/components/admin/DownloadExports";

const BILL_COMPANY = process.env.NEXT_PUBLIC_BILL_COMPANY_NAME || "Chacha Mobile";
const BILL_TAGLINE = process.env.NEXT_PUBLIC_BILL_TAGLINE || "Spare parts · Sales invoice";
const BILL_ADDRESS = process.env.NEXT_PUBLIC_BILL_ADDRESS || "";
const BILL_PHONE = process.env.NEXT_PUBLIC_BILL_PHONE || "";
const BILL_GSTIN = process.env.NEXT_PUBLIC_BILL_GSTIN || "";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newRow() {
  return {
    salesCategoryId: "",
    branch: "",
    modelQuery: "",
    signatureQuery: "",
    stockGroupId: "",
    netStock: 0,
    quantity: 1,
    unitPrice: 0,
    gstAmount: 0,
    lineOptions: [],
    optionsLoading: false,
  };
}

function newManualRow() {
  return {
    branch: "",
    model: "",
    quantity: 1,
    unitPrice: 0,
    gstAmount: 0,
  };
}

function lineDescription(p) {
  const mm = String(p?.manualMobileName ?? "").trim();
  const mp = String(p?.manualProductName ?? "").trim();
  if (mp || mm) {
    return [mm, mp].filter(Boolean).join(" — ") || mp || "Manual line";
  }
  if (p?.stockGroupId) {
    const s = p.stockGroupId;
    return `${s.mobileName || ""} — ${s.productName || ""} (${s.quality || ""})`;
  }
  if (p?.productId?.name) return p.productId.name;
  return "—";
}

function filterSuggestionsByQuery(values, query, limit = 100) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return values.slice(0, limit);
  const starts = [];
  const contains = [];
  for (const raw of values || []) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const lower = value.toLowerCase();
    if (lower.startsWith(q)) starts.push(value);
    else if (lower.includes(q)) contains.push(value);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Sales history subsection: one table (no mixed stock/manual rows). */
function SalesHistorySection({
  title,
  hint,
  emptyLabel,
  sales,
  exportFilenameBase,
  exportTitle,
  exportSubtitle,
  exportColumns,
  exportRows,
  selectedSaleIds,
  onToggleRow,
  onToggleSelectAll,
  allSelected,
  onEdit,
  onDelete,
  onPrint,
  deletingId,
}) {
  const colCount = 8;
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-zinc-50/80 px-4 py-3">
        <div>
          <h3 className="text-base font-bold text-black">{title}</h3>
          <p className="text-xs text-black/50">{hint}</p>
        </div>
        <DownloadExports
          filenameBase={exportFilenameBase}
          title={exportTitle}
          subtitle={exportSubtitle}
          metaLines={[`Rows: ${sales.length}`]}
          columns={exportColumns}
          rows={exportRows}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label={`Select all in ${title}`}
                  disabled={!sales.length}
                  className="h-4 w-4 rounded border-black/25 disabled:opacity-40"
                />
              </th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-sm text-black/55">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              sales.map((h) => (
                <tr key={h._id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedSaleIds.includes(String(h._id))}
                      onChange={() => onToggleRow(h._id)}
                      aria-label={`Select sale ${h._id}`}
                      className="h-4 w-4 rounded border-black/25"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-black">{h.customerLabel || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-md text-xs text-black/80">
                      {(h.products || []).slice(0, 3).map((p, idx) => (
                        <div key={idx}>
                          {lineDescription(p)} × {Number(p.quantity || 0)}
                        </div>
                      ))}
                      {(h.products || []).length > 3 ? (
                        <div className="font-semibold text-black/50">+{(h.products || []).length - 3} more</div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{(h.products || []).length}</td>
                  <td className="px-4 py-3">
                    {(h.products || []).reduce((sum, p) => sum + Number(p.quantity || 0), 0)}
                  </td>
                  <td className="px-4 py-3 font-bold">₹{Number(h.totalAmount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEdit(h)}
                      className="mr-2 text-xs font-bold text-brand-dim hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(h)}
                      disabled={deletingId === h._id}
                      className="mr-2 text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === h._id ? "…" : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrint(h)}
                      className="text-xs font-bold text-black hover:underline"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminSalesPage() {
  const [saleMode, setSaleMode] = useState("stock"); // "stock" | "manual"
  const [ledgerCategories, setLedgerCategories] = useState([]);
  const [rows, setRows] = useState([newRow()]);
  const [manualRows, setManualRows] = useState([newManualRow()]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);
  const [editingSale, setEditingSale] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editItems, setEditItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState([]);
  const [branchSuggestions, setBranchSuggestions] = useState([]);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [signatureSuggestions, setSignatureSuggestions] = useState([]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const loadMaster = useCallback(async () => {
    const [catRes, hRes] = await Promise.all([fetch("/api/sales-categories"), fetch("/api/sales")]);
    const catJson = await catRes.json();
    const hJson = await hRes.json();
    if (!catRes.ok) throw new Error(catJson.error || "Failed to load ledger categories");
    if (!hRes.ok) throw new Error(hJson.error || "Failed to load sales");
    setLedgerCategories(catJson.categories || []);
    setHistory(hJson.sales || []);
  }, []);

  useEffect(() => {
    loadMaster().catch((e) => setError(e.message));
  }, [loadMaster]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/inventory/suggestions");
        const json = await res.json();
        if (!res.ok) return;
        setBranchSuggestions(Array.isArray(json.branches) ? json.branches : []);
        setModelSuggestions(Array.isArray(json.models) ? json.models : []);
        setSignatureSuggestions(Array.isArray(json.signatures) ? json.signatures : []);
      } catch {
        /* ignore suggestion load failure */
      }
    })();
  }, []);

  const grandTotal = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + Number(r.quantity || 0) * Number(r.unitPrice || 0) + Number(r.gstAmount || 0),
        0
      ),
    [rows]
  );

  const grandTotalManual = useMemo(
    () =>
      manualRows.reduce(
        (sum, r) => sum + Number(r.quantity || 0) * Number(r.unitPrice || 0) + Number(r.gstAmount || 0),
        0
      ),
    [manualRows]
  );

  const exportColumns = useMemo(
    () => [
      { header: "Date", key: "date", width: 12 },
      { header: "Customer", key: "customer", width: 18 },
      { header: "Items", key: "items", width: 8 },
      { header: "Total", key: "total", width: 12 },
    ],
    []
  );

  const historyFromStock = useMemo(
    () => (history || []).filter((h) => h.fromStock !== false),
    [history]
  );
  const historyManual = useMemo(
    () => (history || []).filter((h) => h.fromStock === false),
    [history]
  );

  const exportRowsStock = useMemo(
    () =>
      historyFromStock.map((h) => ({
        date: h.date ? new Date(h.date).toLocaleDateString() : "—",
        customer: h.customerLabel || "—",
        items: String((h.products || []).length),
        total: `₹${Number(h.totalAmount || 0).toLocaleString("en-IN")}`,
      })),
    [historyFromStock]
  );
  const exportRowsManual = useMemo(
    () =>
      historyManual.map((h) => ({
        date: h.date ? new Date(h.date).toLocaleDateString() : "—",
        customer: h.customerLabel || "—",
        items: String((h.products || []).length),
        total: `₹${Number(h.totalAmount || 0).toLocaleString("en-IN")}`,
      })),
    [historyManual]
  );

  const selectedSales = useMemo(() => {
    if (!selectedSaleIds.length) return [];
    const idSet = new Set(selectedSaleIds);
    return history.filter((h) => idSet.has(String(h._id)));
  }, [history, selectedSaleIds]);
  const selectedSalesAmount = useMemo(
    () => selectedSales.reduce((sum, h) => sum + Number(h.totalAmount || 0), 0),
    [selectedSales]
  );
  const selectedSalesQty = useMemo(
    () =>
      selectedSales.reduce(
        (sum, h) => sum + (h.products || []).reduce((lineSum, p) => lineSum + Number(p.quantity || 0), 0),
        0
      ),
    [selectedSales]
  );
  const allStockSelected = useMemo(
    () =>
      historyFromStock.length > 0 &&
      historyFromStock.every((h) => selectedSaleIds.includes(String(h._id))),
    [historyFromStock, selectedSaleIds]
  );
  const allManualSelected = useMemo(
    () =>
      historyManual.length > 0 &&
      historyManual.every((h) => selectedSaleIds.includes(String(h._id))),
    [historyManual, selectedSaleIds]
  );

  function updateRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((r) => [...r, newRow()]);
  }

  function removeRow(i) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function updateManualRow(i, patch) {
    setManualRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addManualRow() {
    setManualRows((r) => [...r, newManualRow()]);
  }

  function removeManualRow(i) {
    setManualRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  const loadRowOptions = useCallback(async (i) => {
    const row = rowsRef.current[i];
    if (!row?.salesCategoryId) {
      setError("Select ledger category first");
      return;
    }
    updateRow(i, { optionsLoading: true });
    try {
      const p = new URLSearchParams();
      p.set("salesCategoryId", row.salesCategoryId);
      if (row.branch.trim()) p.set("branch", row.branch.trim());
      if (row.modelQuery.trim()) p.set("q", row.modelQuery.trim());
      if (row.signatureQuery?.trim()) p.set("signature", row.signatureQuery.trim());
      const res = await fetch(`/api/inventory/sale-stock-lines?${p.toString()}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load lines");
      const lines = j.lines || [];
      const next = { lineOptions: lines, optionsLoading: false };
      if (row.stockGroupId && !lines.some((x) => x.stockGroupId === row.stockGroupId)) {
        next.stockGroupId = "";
        next.netStock = 0;
      }
      updateRow(i, next);
      setError("");
    } catch (e) {
      updateRow(i, { lineOptions: [], optionsLoading: false });
      setError(e.message || "Failed to load stock lines");
    }
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!customerName.trim()) throw new Error("Enter customer name");

      if (saleMode === "manual") {
        const products = [];
        for (let i = 0; i < manualRows.length; i++) {
          const r = manualRows[i];
          const model = String(r.model || "").trim();
          if (!model) throw new Error(`Line ${i + 1}: enter model / description`);
          const qty = Number(r.quantity || 0);
          const price = Number(r.unitPrice || 0);
          const gst = Number(r.gstAmount || 0);
          if (qty < 1) throw new Error(`Line ${i + 1}: quantity at least 1`);
          if (price < 0) throw new Error(`Line ${i + 1}: invalid price`);
          products.push({
            manualMobileName: String(r.branch || "").trim(),
            manualProductName: model,
            quantity: qty,
            price,
            gstAmount: Math.max(0, gst),
          });
        }

        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walkInName: customerName.trim(),
            walkInPhone: customerPhone.trim(),
            fromStock: false,
            products,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save sale");
        setManualRows([newManualRow()]);
        setNotice("Manual bill saved (stock not changed).");
        await loadMaster();
        return;
      }

      const products = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.salesCategoryId) throw new Error(`Line ${i + 1}: select ledger category`);
        if (!r.stockGroupId) throw new Error(`Line ${i + 1}: pick a stock line from purchase inventory`);
        const qty = Number(r.quantity || 0);
        const price = Number(r.unitPrice || 0);
        const gst = Number(r.gstAmount || 0);
        if (qty < 1) throw new Error(`Line ${i + 1}: quantity at least 1`);
        if (price < 0) throw new Error(`Line ${i + 1}: invalid price`);
        if (qty > r.netStock) throw new Error(`Line ${i + 1}: only ${r.netStock} pcs available`);
        products.push({
          stockGroupId: r.stockGroupId,
          quantity: qty,
          price,
          gstAmount: Math.max(0, gst),
        });
      }

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkInName: customerName.trim(),
          walkInPhone: customerPhone.trim(),
          fromStock: true,
          products,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save sale");
      setRows([newRow()]);
      setNotice("Sale saved. Ledger stock updated.");
      await loadMaster();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  function printBill(sale) {
    const d = sale.date ? new Date(sale.date) : new Date();
    const dateStr = d.toLocaleDateString("en-IN", { dateStyle: "long" });
    const timeStr = d.toLocaleTimeString("en-IN", { timeStyle: "short" });
    const billNo = String(sale._id).slice(-10).toUpperCase();
    let subtotal = 0;
    let totalGst = 0;
    const rowsHtml = (sale.products || [])
      .map((p, idx) => {
        const desc = escapeHtml(lineDescription(p));
        const qty = Number(p.quantity || 0);
        const rate = Number(p.price || 0);
        const gst = Number(p.gstAmount ?? 0);
        const taxable = qty * rate;
        const line = taxable + gst;
        subtotal += taxable;
        totalGst += gst;
        return `<tr>
          <td class="c">${idx + 1}</td>
          <td class="item">${desc}</td>
          <td class="r">${qty}</td>
          <td class="r">₹${rate.toLocaleString("en-IN")}</td>
          <td class="r">₹${taxable.toLocaleString("en-IN")}</td>
          <td class="r">₹${gst.toLocaleString("en-IN")}</td>
          <td class="r strong">₹${line.toLocaleString("en-IN")}</td>
        </tr>`;
      })
      .join("");
    const grand = Number(sale.totalAmount || 0);
    const addrBlock = [BILL_ADDRESS, BILL_PHONE ? `Phone: ${BILL_PHONE}` : "", BILL_GSTIN ? `GSTIN: ${BILL_GSTIN}` : ""]
      .filter(Boolean)
      .map((x) => escapeHtml(x))
      .join("<br/>");
    const w = window.open("", "_blank", "width=880,height=960");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="en"><head>
      <meta charset="utf-8"/><title>Invoice ${billNo}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; margin: 0; color: #0a0a0a; background: #fff; }
        .sheet { max-width: 800px; margin: 0 auto; padding: 28px 32px 40px; }
        .head { border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
        .company { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
        .tagline { font-size: 0.8rem; color: #525252; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.12em; }
        .co-meta { font-size: 0.8rem; color: #404040; line-height: 1.5; margin-top: 10px; }
        .inv-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin: 22px 0 18px; }
        .inv-title h2 { margin: 0; font-size: 1.05rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
        .bill-meta { text-align: right; font-size: 0.85rem; line-height: 1.65; }
        .bill-meta strong { color: #171717; }
        .cust { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; }
        .cust-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #737373; margin-bottom: 6px; }
        .cust-body { font-size: 0.95rem; font-weight: 600; }
        table.inv { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        table.inv th { text-align: left; background: #171717; color: #fff; padding: 10px 8px; font-weight: 700; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; }
        table.inv th.r, table.inv td.r { text-align: right; }
        table.inv th.c, table.inv td.c { text-align: center; width: 36px; }
        table.inv td { padding: 10px 8px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
        table.inv td.item { font-weight: 500; }
        table.inv td.strong { font-weight: 700; }
        table.inv tr:nth-child(even) td { background: #fafafa; }
        .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
        .totals-inner { min-width: 280px; font-size: 0.88rem; }
        .totals-inner .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
        .totals-inner .row.grand { border-bottom: none; border-top: 2px solid #111; margin-top: 8px; padding-top: 12px; font-size: 1.15rem; font-weight: 800; }
        .foot { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 0.78rem; color: #737373; text-align: center; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { padding: 12px 16px; max-width: none; }
        }
      </style></head><body>
      <div class="sheet">
        <header class="head">
          <h1 class="company">${escapeHtml(BILL_COMPANY)}</h1>
          <p class="tagline">${escapeHtml(BILL_TAGLINE)}</p>
          ${addrBlock ? `<div class="co-meta">${addrBlock}</div>` : ""}
        </header>
        <div class="inv-title">
          <h2>Tax invoice</h2>
          <div class="bill-meta">
            <div><strong>Invoice no.</strong> ${billNo}</div>
            <div><strong>Date</strong> ${escapeHtml(dateStr)}</div>
            <div><strong>Time</strong> ${escapeHtml(timeStr)}</div>
          </div>
        </div>
        <div class="cust">
          <div class="cust-label">Bill to</div>
          <div class="cust-body">${escapeHtml(sale.customerLabel || "—")}</div>
        </div>
        <table class="inv">
          <thead>
            <tr>
              <th class="c">#</th>
              <th>Description</th>
              <th class="r">Qty</th>
              <th class="r">Rate</th>
              <th class="r">Taxable</th>
              <th class="r">GST</th>
              <th class="r">Amount</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="totals">
          <div class="totals-inner">
            <div class="row"><span>Taxable value</span><span>₹${subtotal.toLocaleString("en-IN")}</span></div>
            <div class="row"><span>GST total</span><span>₹${totalGst.toLocaleString("en-IN")}</span></div>
            <div class="row grand"><span>Grand total</span><span>₹${grand.toLocaleString("en-IN")}</span></div>
          </div>
        </div>
        <p class="foot">This is a computer-generated invoice. Thank you for your business.</p>
      </div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`);
    w.document.close();
  }

  function openEdit(sale) {
    setEditingSale(sale);
    setEditName(sale.walkInName || "");
    setEditPhone(sale.walkInPhone || "");
    setEditDate(sale.date ? String(sale.date).slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditItems(
      (sale.products || []).map((p) => ({
        productId: p.productId?._id || "",
        stockGroupId: p.stockGroupId?._id || "",
        manualMobileName: String(p.manualMobileName || "").trim(),
        manualProductName: String(p.manualProductName || "").trim(),
        label: lineDescription(p),
        quantity: Number(p.quantity || 1),
        price: Number(p.price || 0),
        gstAmount: Number(p.gstAmount || 0),
      }))
    );
    setError("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingSale) return;
    setSavingEdit(true);
    setError("");
    try {
      const body = { date: editDate };
      if (!editingSale.customerId) {
        if (!editName.trim()) throw new Error("Customer name is required");
        body.walkInName = editName.trim();
        body.walkInPhone = editPhone.trim();
      }
      if (!editItems.length) throw new Error("At least one line item is required");
      body.products = editItems.map((line, idx) => {
        const quantity = Number(line.quantity || 0);
        const price = Number(line.price || 0);
        const gstAmount = Number(line.gstAmount || 0);
        if (quantity < 1) throw new Error(`Line ${idx + 1}: quantity must be at least 1`);
        if (price < 0) throw new Error(`Line ${idx + 1}: amount must be 0 or more`);
        if (gstAmount < 0) throw new Error(`Line ${idx + 1}: GST must be 0 or more`);
        if (editingSale.fromStock === false) {
          const manualProductName = String(line.manualProductName ?? "").trim();
          if (!manualProductName) throw new Error(`Line ${idx + 1}: model / description is required`);
          return {
            manualMobileName: String(line.manualMobileName ?? "").trim(),
            manualProductName,
            quantity,
            price,
            gstAmount,
          };
        }
        return {
          productId: line.productId || undefined,
          stockGroupId: line.stockGroupId || undefined,
          quantity,
          price,
          gstAmount,
        };
      });
      const res = await fetch(`/api/sales/${editingSale._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");
      setEditingSale(null);
      setNotice("Sale updated.");
      await loadMaster();
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeSale(sale) {
    const manual = sale.fromStock === false;
    if (
      !confirm(
        manual
          ? `Delete this manual bill for ${sale.customerLabel || "customer"}?`
          : `Delete this sale for ${sale.customerLabel || "customer"}? Stock will be restored.`
      )
    )
      return;
    setDeletingId(sale._id);
    setError("");
    try {
      const res = await fetch(`/api/sales/${sale._id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Delete failed");
      setNotice(manual ? "Manual bill deleted." : "Sale deleted · stock restored.");
      setSelectedSaleIds((prev) => prev.filter((x) => x !== String(sale._id)));
      await loadMaster();
    } catch (err) {
      setError(err.message || "Failed");
    } finally {
      setDeletingId("");
    }
  }

  async function deleteSelectedSales() {
    if (!selectedSaleIds.length) return;
    const selectedSet = new Set(selectedSaleIds);
    const preview = history.filter((h) => selectedSet.has(String(h._id)));
    const restoresStock = preview.some((h) => h.fromStock !== false);
    if (
      !confirm(
        `Delete ${selectedSaleIds.length} selected sale(s)?${
          restoresStock ? " Stock will be restored for stock-backed sales." : ""
        }`
      )
    )
      return;
    setBulkDeleting(true);
    setError("");
    try {
      let okCount = 0;
      let failCount = 0;
      for (const sale of preview) {
        const res = await fetch(`/api/sales/${sale._id}`, { method: "DELETE" });
        if (res.ok) okCount += 1;
        else failCount += 1;
      }
      setSelectedSaleIds([]);
      setNotice(
        failCount
          ? `${okCount} deleted, ${failCount} failed.`
          : restoresStock
            ? `${okCount} sale(s) deleted · stock restored for stock-backed entries.`
            : `${okCount} sale(s) deleted.`
      );
      await loadMaster();
    } catch (err) {
      setError(err.message || "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function deleteAllSales() {
    if (!history.length) return;
    if (!confirm(`Delete ALL ${history.length} sales entries? Stock will be restored where possible.`)) return;
    setBulkDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/sales", { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Clear failed");
      setSelectedSaleIds([]);
      setNotice(`${Number(j.deleted || 0)} sale(s) cleared.`);
      await loadMaster();
    } catch (err) {
      setError(err.message || "Clear failed");
    } finally {
      setBulkDeleting(false);
    }
  }

  function toggleSaleSelection(saleId) {
    const id = String(saleId);
    setSelectedSaleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllInList(list) {
    const ids = list.map((h) => String(h._id));
    setSelectedSaleIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      if (allSelected) {
        const removeSet = new Set(ids);
        return prev.filter((x) => !removeSet.has(x));
      }
      const merged = new Set(prev);
      ids.forEach((id) => merged.add(id));
      return [...merged];
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-black">Sales entry</h1>
      <p className="mt-1 text-sm text-black/60">
        <strong>Sell from stock</strong> uses the same ledger lines as supplier purchases.
        <strong> Sell without stock</strong> records a manual bill only — inventory is not reduced.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSaleMode("stock");
            setError("");
          }}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            saleMode === "stock" ? "bg-black text-brand" : "border border-black/15 bg-white text-black/70 hover:bg-zinc-50"
          }`}
        >
          Sell from stock
        </button>
        <button
          type="button"
          onClick={() => {
            setSaleMode("manual");
            setError("");
          }}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            saleMode === "manual" ? "bg-black text-brand" : "border border-black/15 bg-white text-black/70 hover:bg-zinc-50"
          }`}
        >
          Sell without stock (manual bill)
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-black">Customer</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase text-black/45">Name</label>
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-black/45">Phone (optional)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full min-h-12 rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-black/45">Sale date is recorded automatically (today).</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-black">Line items</p>
          {saleMode === "stock" ? (
            <p className="mt-1 text-xs text-black/50">
              Choose <strong>ledger category</strong>, type <strong>branch</strong> (e.g. Oppo), search <strong>model</strong>,
              optional <strong>signature</strong>, then select a line that has available qty from purchase entry.
            </p>
          ) : (
            <p className="mt-1 text-xs text-black/50">
              Type <strong>branch / folder</strong> (optional) and <strong>model or description</strong> (required). This bill does{" "}
              <strong>not</strong> reduce inventory.
            </p>
          )}

          {saleMode === "stock" ? (
          <div className="mt-4 space-y-6">
            {rows.map((row, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-zinc-50/80 p-4">
                {(() => {
                  const branchListId = `sales-branch-suggestions-${i}`;
                  const branchMatches = filterSuggestionsByQuery(branchSuggestions, row.branch, 120);
                  return (
                    <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="lg:col-span-3">
                    <label className="text-xs font-bold uppercase text-black/45">Ledger category</label>
                    <select
                      required
                      value={row.salesCategoryId}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateRow(i, {
                          salesCategoryId: v,
                          stockGroupId: "",
                          netStock: 0,
                          lineOptions: [],
                        });
                      }}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    >
                      <option value="">Select category…</option>
                      {ledgerCategories.map((c) => (
                        <option key={c._id} value={String(c._id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Branch / folder</label>
                    <input
                      value={row.branch}
                      onChange={(e) => updateRow(i, { branch: e.target.value, stockGroupId: "", netStock: 0 })}
                      placeholder="e.g. Oppo"
                      list={branchListId}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Model search</label>
                    <input
                      value={row.modelQuery}
                      onChange={(e) => updateRow(i, { modelQuery: e.target.value, stockGroupId: "", netStock: 0 })}
                      placeholder="e.g. a23"
                      list="sales-model-suggestions"
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Signature search</label>
                    <input
                      value={row.signatureQuery}
                      onChange={(e) => updateRow(i, { signatureQuery: e.target.value, stockGroupId: "", netStock: 0 })}
                      placeholder="e.g. realme 8i"
                      list="sales-signature-suggestions"
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div className="lg:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                    <label className="text-xs font-bold uppercase text-black/45">Stock line (from purchases)</label>
                    <select
                      required
                      value={row.stockGroupId}
                      onFocus={() => {
                        if (row.salesCategoryId && !row.lineOptions.length && !row.optionsLoading) {
                          void loadRowOptions(i);
                        }
                      }}
                      onChange={(e) => {
                        const id = e.target.value;
                        const opt = row.lineOptions.find((x) => x.stockGroupId === id);
                        updateRow(i, {
                          stockGroupId: id,
                          netStock: opt ? opt.netStock : 0,
                        });
                      }}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    >
                      <option value="">
                        {row.optionsLoading
                          ? "Loading…"
                          : row.salesCategoryId
                            ? row.lineOptions.length
                              ? "Select line…"
                              : "No stock — adjust branch/model or add purchase"
                            : "Select ledger category first"}
                      </option>
                      {row.lineOptions.map((opt) => (
                        <option key={opt.stockGroupId} value={opt.stockGroupId}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadRowOptions(i)}
                      disabled={!row.salesCategoryId || row.optionsLoading}
                      className="min-h-12 shrink-0 rounded-xl border border-black/15 bg-white px-4 text-sm font-bold text-black hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {row.optionsLoading ? "Loading…" : "Load lines"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Available</label>
                    <p className="mt-1 text-lg font-black text-emerald-800">{row.stockGroupId ? row.netStock : "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Qty</label>
                    <input
                      type="number"
                      min={1}
                      max={row.netStock > 0 ? row.netStock : undefined}
                      value={row.quantity}
                      onChange={(e) => updateRow(i, { quantity: Number(e.target.value || 0) })}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Amount (unit)</label>
                    <input
                      type="number"
                      min={0}
                      value={row.unitPrice}
                      onChange={(e) => updateRow(i, { unitPrice: Number(e.target.value || 0) })}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">GST (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={row.gstAmount}
                      onChange={(e) => updateRow(i, { gstAmount: Number(e.target.value || 0) })}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-black">
                    Line: ₹
                    {(Number(row.quantity || 0) * Number(row.unitPrice || 0) + Number(row.gstAmount || 0)).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                  >
                    Remove line
                  </button>
                </div>
                <datalist id={branchListId}>
                  {branchMatches.map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
          ) : (
          <div className="mt-4 space-y-6">
            {manualRows.map((row, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-zinc-50/80 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Branch / folder (optional)</label>
                    <input
                      value={row.branch}
                      onChange={(e) => updateManualRow(i, { branch: e.target.value })}
                      placeholder="e.g. Oppo"
                      list={`manual-branch-${i}`}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                    <datalist id={`manual-branch-${i}`}>
                      {filterSuggestionsByQuery(branchSuggestions, row.branch, 120).map((x) => (
                        <option key={x} value={x} />
                      ))}
                    </datalist>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase text-black/45">Model / description</label>
                    <input
                      required
                      value={row.model}
                      onChange={(e) => updateManualRow(i, { model: e.target.value })}
                      placeholder="e.g. Display A23, Battery BLP-609"
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateManualRow(i, { quantity: Number(e.target.value || 0) })}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Amount (unit)</label>
                    <input
                      type="number"
                      min={0}
                      value={row.unitPrice}
                      onChange={(e) => updateManualRow(i, { unitPrice: Number(e.target.value || 0) })}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">GST (optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={row.gstAmount}
                      onChange={(e) => updateManualRow(i, { gstAmount: Number(e.target.value || 0) })}
                      className="mt-1 w-full min-h-12 rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-black">
                    Line: ₹
                    {(
                      Number(row.quantity || 0) * Number(row.unitPrice || 0) +
                      Number(row.gstAmount || 0)
                    ).toLocaleString("en-IN")}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeManualRow(i)}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                  >
                    Remove line
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}

          <button
            type="button"
            onClick={saleMode === "stock" ? addRow : addManualRow}
            className="mt-4 w-full min-h-12 rounded-xl border-2 border-dashed border-black/20 text-sm font-bold text-black/70 hover:border-brand hover:text-black sm:w-auto sm:px-6"
          >
            + Add line
          </button>

          <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-black text-black">
              Grand total: ₹
              {(saleMode === "stock" ? grandTotal : grandTotalManual).toLocaleString("en-IN")}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 rounded-full bg-brand px-8 text-sm font-bold text-black shadow-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Submit sale"}
            </button>
          </div>
        </div>
      </form>

      <datalist id="sales-model-suggestions">
        {modelSuggestions.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      <datalist id="sales-signature-suggestions">
        {signatureSuggestions.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-black">Sales history</h2>
          <p className="mt-1 text-xs text-black/60">
            <span className="font-semibold text-emerald-800">From stock: {historyFromStock.length}</span>
            {" · "}
            <span className="font-semibold text-violet-800">Manual: {historyManual.length}</span>
          </p>
          {selectedSaleIds.length ? (
            <p className="text-xs font-semibold text-black/65">
              Selected: {selectedSaleIds.length} · Qty: {selectedSalesQty.toLocaleString("en-IN")} · Amount: ₹
              {selectedSalesAmount.toLocaleString("en-IN")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!history.length || bulkDeleting}
            onClick={deleteAllSales}
            className="min-h-10 rounded-lg border border-red-400 bg-red-100 px-3 text-xs font-extrabold text-red-800 disabled:opacity-50"
          >
            {bulkDeleting ? "Clearing…" : "Delete all sales"}
          </button>
          <button
            type="button"
            disabled={!selectedSaleIds.length || bulkDeleting}
            onClick={deleteSelectedSales}
            className="min-h-10 rounded-lg border border-red-300 bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
          >
            {bulkDeleting ? "Deleting…" : `Delete selected (${selectedSaleIds.length})`}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-6">
        <SalesHistorySection
          title="Sales from stock"
          hint="Ledger lines linked to purchase inventory."
          emptyLabel="No sales from stock yet."
          sales={historyFromStock}
          exportFilenameBase="sales-from-stock"
          exportTitle="Sales from stock"
          exportSubtitle="Stock-backed sales"
          exportColumns={exportColumns}
          exportRows={exportRowsStock}
          selectedSaleIds={selectedSaleIds}
          onToggleRow={toggleSaleSelection}
          onToggleSelectAll={() => toggleSelectAllInList(historyFromStock)}
          allSelected={allStockSelected}
          onEdit={openEdit}
          onDelete={removeSale}
          onPrint={printBill}
          deletingId={deletingId}
        />
        <SalesHistorySection
          title="Sales without stock (manual bills)"
          hint="Recorded separately — does not change inventory."
          emptyLabel="No manual bills yet."
          sales={historyManual}
          exportFilenameBase="sales-manual"
          exportTitle="Manual sales"
          exportSubtitle="Bills without stock"
          exportColumns={exportColumns}
          exportRows={exportRowsManual}
          selectedSaleIds={selectedSaleIds}
          onToggleRow={toggleSaleSelection}
          onToggleSelectAll={() => toggleSelectAllInList(historyManual)}
          allSelected={allManualSelected}
          onEdit={openEdit}
          onDelete={removeSale}
          onPrint={printBill}
          deletingId={deletingId}
        />
      </div>

      {editingSale ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={saveEdit}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-black">Edit sale</h3>
            <p className="mt-1 text-xs text-black/50">
              {editingSale.fromStock === false
                ? "Manual bill — editing lines does not affect inventory."
                : editingSale.customerId
                  ? "This sale uses a saved customer. You can update date and line item values."
                  : "Update customer details, date, and line item values. Stock is recalculated automatically."}
            </p>
            <div className="mt-4 grid gap-3">
              {!editingSale.customerId ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Name</label>
                    <input
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-black/15 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-black/45">Phone (optional)</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-black/15 px-3 text-sm"
                    />
                  </div>
                </>
              ) : null}
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Sale date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1 min-h-12 w-full rounded-xl border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-black/45">Line items</label>
                <div className="mt-2 space-y-2">
                  {editItems.map((line, i) => (
                    <div
                      key={`${line.productId || line.stockGroupId || line.manualProductName || "row"}-${i}`}
                      className="rounded-xl border border-black/10 bg-zinc-50 p-3"
                    >
                      {editingSale.fromStock === false ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="text-[11px] font-bold uppercase text-black/45">Branch (optional)</label>
                            <input
                              value={line.manualMobileName}
                              onChange={(e) =>
                                setEditItems((prev) =>
                                  prev.map((x, idx) =>
                                    idx === i ? { ...x, manualMobileName: e.target.value } : x
                                  )
                                )
                              }
                              className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold uppercase text-black/45">Model / description</label>
                            <input
                              required
                              value={line.manualProductName}
                              onChange={(e) =>
                                setEditItems((prev) =>
                                  prev.map((x, idx) =>
                                    idx === i ? { ...x, manualProductName: e.target.value } : x
                                  )
                                )
                              }
                              className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-black/70">{line.label || "Line item"}</p>
                      )}
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <div>
                          <label className="text-[11px] font-bold uppercase text-black/45">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) =>
                              setEditItems((prev) =>
                                prev.map((x, idx) => (idx === i ? { ...x, quantity: Number(e.target.value || 0) } : x))
                              )
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase text-black/45">Amount</label>
                          <input
                            type="number"
                            min={0}
                            value={line.price}
                            onChange={(e) =>
                              setEditItems((prev) =>
                                prev.map((x, idx) => (idx === i ? { ...x, price: Number(e.target.value || 0) } : x))
                              )
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase text-black/45">GST</label>
                          <input
                            type="number"
                            min={0}
                            value={line.gstAmount}
                            onChange={(e) =>
                              setEditItems((prev) =>
                                prev.map((x, idx) => (idx === i ? { ...x, gstAmount: Number(e.target.value || 0) } : x))
                              )
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={savingEdit}
                className="min-h-11 flex-1 rounded-xl bg-black text-sm font-bold text-brand disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingSale(null)}
                className="min-h-11 flex-1 rounded-xl border text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
