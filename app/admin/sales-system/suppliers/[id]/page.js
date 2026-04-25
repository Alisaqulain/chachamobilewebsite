"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DownloadExports from "@/components/admin/DownloadExports";

const emptyPurchase = {
  date: new Date().toISOString().slice(0, 10),
  salesCategoryId: "",
  folderName: "",
  modelNames: "",
  quality: "",
  quantity: "1",
  purchasePrice: "",
  gstAmount: "0",
  signatureName: "",
  notes: "",
};

function pickDefaultSalesCategoryId(categories) {
  if (!categories?.length) return "";
  const folder = categories.find((c) => String(c.slug || "").toLowerCase() === "folder");
  return folder?._id || categories[0]._id || "";
}

/** Turn OCR output into comma-separated model labels (admin can edit after). */
function normalizeOcrForModels(raw) {
  if (!raw || typeof raw !== "string") return "";
  let t = raw
    .replace(/\r\n/g, "\n")
    .replace(/[·•]/g, ", ")
    .replace(/[\n\t;|/]+/g, ", ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/,\s*,+/g, ", ")
    .trim();
  t = t.replace(/^,\s*|\s*,$/g, "").trim();
  return t;
}

async function cropImageToBlob(imageEl, crop) {
  if (!imageEl || !crop || crop.w < 8 || crop.h < 8) return null;
  const imageRect = imageEl.getBoundingClientRect();
  if (!imageRect.width || !imageRect.height) return null;
  const scaleX = imageEl.naturalWidth / imageRect.width;
  const scaleY = imageEl.naturalHeight / imageRect.height;
  const sx = Math.max(0, Math.round(crop.x * scaleX));
  const sy = Math.max(0, Math.round(crop.y * scaleY));
  const sw = Math.max(1, Math.round(crop.w * scaleX));
  const sh = Math.max(1, Math.round(crop.h * scaleY));
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, sw, sh);
  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), "image/png");
  });
}

function clampCrop(crop, stageW, stageH) {
  const minSize = 44;
  const safeW = Math.max(minSize, Math.min(stageW, crop.w));
  const safeH = Math.max(minSize, Math.min(stageH, crop.h));
  const safeX = Math.max(0, Math.min(stageW - safeW, crop.x));
  const safeY = Math.max(0, Math.min(stageH - safeH, crop.y));
  return { x: safeX, y: safeY, w: safeW, h: safeH };
}

export default function SupplierPurchasesPage() {
  const params = useParams();
  const id = params?.id ? String(params.id) : "";
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState(emptyPurchase);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [returnFor, setReturnFor] = useState(null);
  const [returnQty, setReturnQty] = useState("1");
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierDraft, setSupplierDraft] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const modelCameraInputRef = useRef(null);
  const modelGalleryInputRef = useRef(null);
  const cropStageRef = useRef(null);
  const cropImageRef = useRef(null);
  const [modelOcrBusy, setModelOcrBusy] = useState(false);
  const [ocrImageUrl, setOcrImageUrl] = useState("");
  const [ocrImageFile, setOcrImageFile] = useState(null);
  const [ocrCropOpen, setOcrCropOpen] = useState(false);
  const [ocrSelection, setOcrSelection] = useState(null);
  const [ocrInteraction, setOcrInteraction] = useState(null);
  const [ocrZoomPreviewUrl, setOcrZoomPreviewUrl] = useState("");

  const closeOcrCrop = useCallback(() => {
    setOcrImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setOcrImageFile(null);
    setOcrCropOpen(false);
    setOcrSelection(null);
    setOcrInteraction(null);
    setOcrZoomPreviewUrl("");
  }, []);

  const runModelOcr = useCallback(async (imageSource) => {
    setModelOcrBusy(true);
    setToast("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      try {
        const {
          data: { text },
        } = await worker.recognize(imageSource);
        const cleaned = normalizeOcrForModels(text);
        if (!cleaned) {
          setToast("No text found in photo — try a clearer shot or type manually");
          return;
        }
        setForm((f) => ({
          ...f,
          modelNames: f.modelNames.trim() ? `${f.modelNames.trim()}, ${cleaned}` : cleaned,
        }));
        setToast("Text from selected area added — correct it if needed, then save");
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      setToast(err?.message || "Could not read text from image");
    } finally {
      setModelOcrBusy(false);
    }
  }, []);

  const onModelPhotoOcr = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setToast("Choose an image file");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setOcrImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setOcrImageFile(file);
    setOcrSelection(null);
    setOcrInteraction(null);
    setOcrCropOpen(true);
  }, []);

  useEffect(() => {
    if (!ocrCropOpen || !ocrSelection || !cropImageRef.current) {
      setOcrZoomPreviewUrl("");
      return;
    }
    const imageEl = cropImageRef.current;
    if (!imageEl.complete || !imageEl.naturalWidth || !imageEl.naturalHeight) return;
    const imageRect = imageEl.getBoundingClientRect();
    if (!imageRect.width || !imageRect.height) return;

    const scaleX = imageEl.naturalWidth / imageRect.width;
    const scaleY = imageEl.naturalHeight / imageRect.height;
    const sx = Math.max(0, Math.round(ocrSelection.x * scaleX));
    const sy = Math.max(0, Math.round(ocrSelection.y * scaleY));
    const sw = Math.max(1, Math.round(ocrSelection.w * scaleX));
    const sh = Math.max(1, Math.round(ocrSelection.h * scaleY));

    const zoomCanvas = document.createElement("canvas");
    zoomCanvas.width = Math.max(160, Math.min(900, sw * 2));
    zoomCanvas.height = Math.max(80, Math.min(500, sh * 2));
    const ctx = zoomCanvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, zoomCanvas.width, zoomCanvas.height);
    setOcrZoomPreviewUrl(zoomCanvas.toDataURL("image/png"));
  }, [ocrCropOpen, ocrSelection]);

  const getStageRect = useCallback(() => {
    const stage = cropStageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return rect;
  }, []);

  const ensureDefaultCrop = useCallback(() => {
    const rect = getStageRect();
    if (!rect) return;
    const next = {
      w: rect.width * 0.82,
      h: Math.max(64, rect.height * 0.26),
      x: rect.width * 0.09,
      y: rect.height * 0.2,
    };
    setOcrSelection((prev) => (prev ? clampCrop(prev, rect.width, rect.height) : clampCrop(next, rect.width, rect.height)));
  }, [getStageRect]);

  const onCropPointerMove = useCallback(
    (e) => {
      if (!ocrInteraction) return;
      const rect = getStageRect();
      if (!rect) return;
      const px = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
      const py = Math.min(rect.height, Math.max(0, e.clientY - rect.top));
      const dx = px - ocrInteraction.startX;
      const dy = py - ocrInteraction.startY;
      const base = ocrInteraction.origin;
      let next = base;

      if (ocrInteraction.type === "move") {
        next = { ...base, x: base.x + dx, y: base.y + dy };
      } else if (ocrInteraction.type === "resize-nw") {
        next = { x: base.x + dx, y: base.y + dy, w: base.w - dx, h: base.h - dy };
      } else if (ocrInteraction.type === "resize-ne") {
        next = { x: base.x, y: base.y + dy, w: base.w + dx, h: base.h - dy };
      } else if (ocrInteraction.type === "resize-sw") {
        next = { x: base.x + dx, y: base.y, w: base.w - dx, h: base.h + dy };
      } else if (ocrInteraction.type === "resize-se") {
        next = { x: base.x, y: base.y, w: base.w + dx, h: base.h + dy };
      }

      setOcrSelection(clampCrop(next, rect.width, rect.height));
    },
    [getStageRect, ocrInteraction]
  );

  const onCropPointerEnd = useCallback((e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setOcrInteraction(null);
  }, []);

  const startCropInteraction = useCallback(
    (e, type) => {
      if (!ocrSelection) return;
      const rect = getStageRect();
      if (!rect) return;
      const px = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
      const py = Math.min(rect.height, Math.max(0, e.clientY - rect.top));
      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setOcrInteraction({
        type,
        startX: px,
        startY: py,
        origin: ocrSelection,
      });
    },
    [getStageRect, ocrSelection]
  );

  const applySelectedCropAndRead = useCallback(async () => {
    if (!ocrImageFile) return;
    let imageForOcr = ocrImageFile;
    if (ocrSelection?.w >= 8 && ocrSelection?.h >= 8 && cropImageRef.current) {
      const cropped = await cropImageToBlob(cropImageRef.current, ocrSelection);
      if (cropped) imageForOcr = cropped;
    }
    closeOcrCrop();
    await runModelOcr(imageForOcr);
  }, [closeOcrCrop, ocrImageFile, ocrSelection, runModelOcr]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sRes, pRes, cRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch(`/api/inventory/parts-purchases?supplierId=${encodeURIComponent(id)}`),
        fetch("/api/sales-categories"),
      ]);
      const sJson = await sRes.json();
      const pJson = await pRes.json();
      const cJson = await cRes.json();
      if (!sRes.ok) throw new Error(sJson.error || "Failed suppliers");
      if (!pRes.ok) throw new Error(pJson.error || "Failed purchases");
      const sup = (sJson.suppliers || []).find((x) => x._id === id);
      setSupplier(sup || { name: "Supplier", _id: id });
      setPurchases(pJson.purchases || []);
      const cats = cRes.ok ? cJson.categories || [] : [];
      setCategories(cats);
      setForm((f) => ({
        ...f,
        salesCategoryId: f.salesCategoryId || pickDefaultSalesCategoryId(cats),
      }));
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (supplier) {
      setSupplierDraft({
        name: supplier.name || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      });
    }
  }, [supplier?._id, supplier?.name, supplier?.phone, supplier?.address]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const exportColumns = useMemo(
    () => [
      { header: "Date", key: "date", width: 12 },
      { header: "Branch", key: "folder", width: 16 },
      { header: "Model", key: "model", width: 26 },
      { header: "Ledger category", key: "salesCategory", width: 18 },
      { header: "Quality", key: "quality", width: 12 },
      { header: "Signature name", key: "signatureName", width: 18 },
      { header: "Qty", key: "qty", width: 8 },
      { header: "Price", key: "price", width: 12 },
      { header: "Total", key: "total", width: 12 },
    ],
    []
  );

  const exportRows = useMemo(
    () =>
      (purchases || []).map((row) => ({
        date: row.date ? new Date(row.date).toLocaleDateString() : "—",
        folder: row.mobileName || "—",
        model: row.productName || "—",
        salesCategory: row.salesCategoryName || "—",
        quality: row.quality || "—",
        signatureName: row.signatureName?.trim() ? row.signatureName : "—",
        qty: String(row.quantity ?? ""),
        price: `₹${Number(row.purchasePrice || 0).toLocaleString("en-IN")}`,
        total: `₹${Number(row.lineTotal || 0).toLocaleString("en-IN")}`,
      })),
    [purchases]
  );

  const supplierPurchaseTotal = useMemo(
    () => (purchases || []).reduce((sum, row) => sum + Number(row.lineTotal || 0), 0),
    [purchases]
  );

  const supplierPurchaseUnits = useMemo(
    () => (purchases || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [purchases]
  );

  async function saveSupplierDetails(e) {
    e.preventDefault();
    const name = String(supplierDraft.name || "").trim();
    if (!name) {
      setToast("Supplier name is required");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: String(supplierDraft.phone || "").trim(),
          address: String(supplierDraft.address || "").trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      const sup = j.supplier;
      if (sup) {
        setSupplier((s) => ({
          ...s,
          name: sup.name,
          phone: sup.phone ?? "",
          address: sup.address ?? "",
        }));
      }
      setToast("Supplier details saved");
    } catch (e) {
      setToast(e.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function onAddPurchase(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/parts-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: id,
          date: form.date,
          salesCategoryId: form.salesCategoryId,
          mobileName: form.folderName,
          productName: form.modelNames,
          quality: form.quality,
          quantity: Number(form.quantity),
          purchasePrice: Number(form.purchasePrice),
          gstAmount: Number(form.gstAmount || 0),
          signatureName: String(form.signatureName || "").trim(),
          notes: form.notes,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setForm({
        ...emptyPurchase,
        date: new Date().toISOString().slice(0, 10),
        salesCategoryId: pickDefaultSalesCategoryId(categories),
      });
      setToast("Purchase saved · stock updated");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/parts-purchases/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(editForm.quantity),
          purchasePrice: Number(editForm.purchasePrice),
          gstAmount: Number(editForm.gstAmount || 0),
          notes: editForm.notes,
          date: editForm.date,
          signatureName: String(editForm.signatureName || "").trim(),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");
      setEditId(null);
      setEditForm(null);
      setToast("Updated");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function delPurchase(row) {
    if (!confirm("Delete this purchase line?")) return;
    const res = await fetch(`/api/inventory/parts-purchases/${row._id}`, { method: "DELETE" });
    const j = await res.json();
    if (!res.ok) {
      setToast(j.error || "Delete failed");
      return;
    }
    setToast("Purchase deleted");
    await load();
  }

  async function submitReturn(e) {
    e.preventDefault();
    if (!returnFor) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/parts-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partsPurchaseId: returnFor._id,
          quantity: Number(returnQty),
          date: returnDate,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Return failed");
      setReturnFor(null);
      setToast("Return recorded");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(row) {
    setEditId(row._id);
    setEditForm({
      quantity: String(row.quantity),
      purchasePrice: String(row.purchasePrice),
      gstAmount: String(row.gstAmount ?? 0),
      notes: row.notes || "",
      date: row.date ? String(row.date).slice(0, 10) : "",
      signatureName: row.signatureName || "",
    });
  }

  if (!id) return null;

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/sales-system/suppliers" className="text-sm font-semibold text-brand-dim hover:underline">
            ← All suppliers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-black">{supplier?.name || "Supplier"}</h1>
          <p className="text-sm text-black/55">Purchase entry increases stock. Returns reduce stock.</p>
        </div>
      </div>

      <form
        onSubmit={saveSupplierDetails}
        className="mt-6 rounded-xl border border-black/10 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-bold text-black">Supplier details</h2>
        <p className="mt-1 text-xs text-black/50">
          Name, phone, and address only. Set <strong>Signature name</strong> on each purchase line so Overview stock search
          can find it (e.g. &quot;a23&quot; when the model label lists many names).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-black/45">Supplier name</label>
            <input
              required
              value={supplierDraft.name}
              onChange={(e) => setSupplierDraft((d) => ({ ...d, name: e.target.value }))}
              disabled={supplier?.name === "Unknown Supplier"}
              title={supplier?.name === "Unknown Supplier" ? "System default name cannot be changed" : undefined}
              className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm disabled:bg-zinc-100 disabled:text-black/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-black/45">Phone</label>
            <input
              value={supplierDraft.phone}
              onChange={(e) => setSupplierDraft((d) => ({ ...d, phone: e.target.value }))}
              className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
              autoComplete="off"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-black/45">Address</label>
            <input
              value={supplierDraft.address}
              onChange={(e) => setSupplierDraft((d) => ({ ...d, address: e.target.value }))}
              className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
              autoComplete="off"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="mt-4 min-h-12 rounded-lg bg-black px-6 text-sm font-bold text-brand disabled:opacity-50"
        >
          {savingProfile ? "Saving…" : "Save supplier details"}
        </button>
      </form>

      {toast ? (
        <p className="mt-4 rounded-lg border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-black">{toast}</p>
      ) : null}

      <h2 className="mt-8 text-lg font-bold text-black">Add purchase</h2>
      <p className="mt-1 text-xs text-black/50">
        Choose a <strong>ledger category</strong> (not the website shop) — e.g. Battery, Display, or Folder.{" "}
        <strong>Branch / brand</strong> is the supplier grouping for this line (e.g. Oppo, Samsung).{" "}
        <strong>Model / product</strong> is one label for this line (type e.g. &quot;A23, Reno 12&quot;, or use{" "}
        <strong>Take photo</strong> / <strong>Upload</strong> to fill from a label photo — fix mistakes before saving).{" "}
        It stays one row and <strong>quantity</strong> is the total pcs for this line only.{" "}
        <strong>Quality</strong> is free text.
      </p>
      <form
        onSubmit={onAddPurchase}
        className="mt-3 grid gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="text-xs font-bold text-black/45">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Ledger category</label>
          <select
            required
            value={form.salesCategoryId}
            onChange={(e) => setForm((f) => ({ ...f, salesCategoryId: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Quality</label>
          <input
            required
            value={form.quality}
            onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))}
            placeholder="e.g. Original, Local…"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Branch / brand name</label>
          <input
            required
            value={form.folderName}
            onChange={(e) => setForm((f) => ({ ...f, folderName: e.target.value }))}
            placeholder="e.g. Oppo, Samsung (not the category above)"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-black/45">Model / product label</label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <textarea
              required
              value={form.modelNames}
              onChange={(e) => setForm((f) => ({ ...f, modelNames: e.target.value }))}
              rows={3}
              placeholder="e.g. A23, Reno 12 (separate with comma or new line)"
              className="min-h-12 w-full flex-1 resize-y rounded-lg border border-black/15 px-3 py-2 text-sm leading-6"
            />
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:justify-stretch">
              <button
                type="button"
                disabled={modelOcrBusy || saving}
                onClick={() => modelCameraInputRef.current?.click()}
                className="min-h-12 rounded-lg border border-black/20 bg-zinc-50 px-3 text-xs font-bold text-black disabled:opacity-50 sm:min-w-[7.5rem]"
              >
                {modelOcrBusy ? "Reading…" : "Take photo"}
              </button>
              <button
                type="button"
                disabled={modelOcrBusy || saving}
                onClick={() => modelGalleryInputRef.current?.click()}
                className="min-h-12 rounded-lg border border-black/20 bg-white px-3 text-xs font-bold text-black disabled:opacity-50 sm:min-w-[7.5rem]"
              >
                {modelOcrBusy ? "Reading…" : "Upload image"}
              </button>
            </div>
          </div>
          <input
            ref={modelCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onModelPhotoOcr}
          />
          <input
            ref={modelGalleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onModelPhotoOcr}
          />
          <p className="mt-1 text-[11px] text-black/45">
            OCR runs in the browser (English). After photo upload, drag to select only the text area you want read.
          </p>
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Quantity</label>
          <input
            required
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Purchase price (unit)</label>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={form.purchasePrice}
            onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">GST amount (optional)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={form.gstAmount}
            onChange={(e) => setForm((f) => ({ ...f, gstAmount: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-black/45">Signature name (this line)</label>
          <input
            value={form.signatureName}
            onChange={(e) => setForm((f) => ({ ...f, signatureName: e.target.value }))}
            placeholder='e.g. a23 — shows this row when admin searches "a23" on dashboard'
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs font-bold text-black/45">Notes</label>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-lg bg-black px-6 text-sm font-bold text-brand disabled:opacity-50 sm:w-auto"
          >
            {saving ? "Saving…" : "Save purchase"}
          </button>
        </div>
      </form>

      {ocrCropOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-base font-bold text-black">Select text area for OCR</h3>
              <p className="mt-1 text-xs text-black/60">
              Frame is ready. Drag inside frame to move, drag corner dots to resize around model text lines.
            </p>
            {ocrZoomPreviewUrl ? (
              <div className="mt-3 rounded-lg border border-black/15 bg-zinc-50 p-2">
                <p className="mb-2 text-[11px] font-semibold text-black/60">Auto zoom preview (selected area)</p>
                <img
                  src={ocrZoomPreviewUrl}
                  alt="Zoomed crop preview"
                  className="max-h-36 w-full rounded border border-black/10 object-contain bg-white"
                />
              </div>
            ) : null}
            <div
              ref={cropStageRef}
              className="relative mt-3 max-h-[60vh] touch-none overflow-hidden rounded-lg border border-black/15 bg-zinc-100"
              onPointerMove={onCropPointerMove}
              onPointerUp={onCropPointerEnd}
              onPointerCancel={onCropPointerEnd}
            >
              <img
                ref={cropImageRef}
                src={ocrImageUrl}
                alt="OCR selection preview"
                className="h-auto max-h-[60vh] w-full object-contain"
                onLoad={ensureDefaultCrop}
              />
              <div className="pointer-events-none absolute inset-0 bg-black/10" />
              {ocrSelection?.w > 0 && ocrSelection?.h > 0 ? (
                <>
                  <div
                    className="pointer-events-none absolute border-2 border-brand bg-brand/10"
                    style={{
                      left: `${ocrSelection.x}px`,
                      top: `${ocrSelection.y}px`,
                      width: `${ocrSelection.w}px`,
                      height: `${ocrSelection.h}px`,
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Move crop frame"
                    onPointerDown={(e) => startCropInteraction(e, "move")}
                    className="absolute cursor-move rounded-md border border-brand/60 bg-transparent"
                    style={{
                      left: `${ocrSelection.x}px`,
                      top: `${ocrSelection.y}px`,
                      width: `${ocrSelection.w}px`,
                      height: `${ocrSelection.h}px`,
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop top left"
                    onPointerDown={(e) => startCropInteraction(e, "resize-nw")}
                    className="absolute h-4 w-4 rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x - 8}px`, top: `${ocrSelection.y - 8}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop top right"
                    onPointerDown={(e) => startCropInteraction(e, "resize-ne")}
                    className="absolute h-4 w-4 rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x + ocrSelection.w - 8}px`, top: `${ocrSelection.y - 8}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop bottom left"
                    onPointerDown={(e) => startCropInteraction(e, "resize-sw")}
                    className="absolute h-4 w-4 rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x - 8}px`, top: `${ocrSelection.y + ocrSelection.h - 8}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop bottom right"
                    onPointerDown={(e) => startCropInteraction(e, "resize-se")}
                    className="absolute h-4 w-4 rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x + ocrSelection.w - 8}px`, top: `${ocrSelection.y + ocrSelection.h - 8}px` }}
                  />
                </>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeOcrCrop}
                className="min-h-11 rounded-lg border border-black/20 px-4 text-sm font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modelOcrBusy}
                onClick={applySelectedCropAndRead}
                className="min-h-11 rounded-lg bg-black px-4 text-sm font-bold text-brand disabled:opacity-50"
              >
                {modelOcrBusy ? "Reading…" : "Read selected area"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <h2 className="mt-10 text-lg font-bold text-black">Purchases</h2>
      {loading ? (
        <p className="mt-4 text-sm text-black/55">Loading…</p>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-semibold text-black/70">Export these purchase lines</p>
              <p className="text-xs font-semibold text-black/60">
                Supplier total: ₹{supplierPurchaseTotal.toLocaleString("en-IN")} · Units:{" "}
                {supplierPurchaseUnits.toLocaleString("en-IN")}
              </p>
            </div>
            <DownloadExports
              filenameBase={`supplier_purchases_${supplier?.name || id}`}
              title="Supplier purchases"
              subtitle={supplier?.name || "Supplier"}
              metaLines={[`Rows: ${exportRows.length}`]}
              columns={exportColumns}
              rows={exportRows}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Ledger category</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Signature name</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {purchases.map((row) => (
                <tr key={row._id}>
                  <td className="px-3 py-2 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2">{row.mobileName}</td>
                  <td className="px-3 py-2 font-medium">{row.productName}</td>
                  <td className="px-3 py-2">{row.salesCategoryName || "—"}</td>
                  <td className="px-3 py-2">{row.quality}</td>
                  <td className="px-3 py-2 text-black/80">{row.signatureName?.trim() ? row.signatureName : "—"}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2">₹{Number(row.purchasePrice).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 font-semibold">₹{Number(row.lineTotal).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => openEdit(row)} className="mr-2 text-xs font-bold text-brand-dim">
                      Edit
                    </button>
                    <button type="button" onClick={() => setReturnFor(row)} className="mr-2 text-xs font-bold text-black">
                      Return
                    </button>
                    <button type="button" onClick={() => delPurchase(row)} className="text-xs font-bold text-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 ? <p className="p-6 text-center text-sm text-black/50">No purchases yet.</p> : null}
          </div>
        </div>
      )}

      {editId && editForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={onSaveEdit}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-bold">Edit purchase line</h3>
            <p className="text-xs text-black/50">
              Includes <strong>signature name</strong> — the main term to find this line on the sales dashboard (e.g. a23).
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-bold text-black/45">Date</label>
                <input
                  type="date"
                  required
                  value={editForm.date}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Purchase price (unit)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.purchasePrice}
                  onChange={(e) => setEditForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">GST amount</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.gstAmount}
                  onChange={(e) => setEditForm((f) => ({ ...f, gstAmount: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Notes</label>
                <input
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Signature name (this line)</label>
                <input
                  value={editForm.signatureName}
                  onChange={(e) => setEditForm((f) => ({ ...f, signatureName: e.target.value }))}
                  placeholder="e.g. a23"
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setEditForm(null);
                }}
                className="min-h-11 flex-1 rounded-lg border text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {returnFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={submitReturn} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold">Return to supplier</h3>
            <p className="text-xs text-black/55">
              {returnFor.productName} · max returnable based on purchase qty minus past returns.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                type="number"
                min={1}
                required
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                className="min-h-12 rounded-lg border px-3"
              />
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="min-h-12 rounded-lg border px-3"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand">
                Submit return
              </button>
              <button type="button" onClick={() => setReturnFor(null)} className="min-h-11 flex-1 rounded-lg border text-sm font-semibold">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
