"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function asText(v) {
  return String(v ?? "").trim();
}

function normalizeOcrText(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/\r\n/g, "\n")
    .replace(/[·•]/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function parsePriceToken(raw) {
  const t = asText(raw);
  if (!t) return NaN;
  if (/^\d+\s*-\s*\d+$/.test(t)) {
    const [a, b] = t.split("-").map((x) => x.trim());
    const joined = `${a}${b.padStart(2, "0")}`;
    return Number(joined);
  }
  const n = Number(t.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

const KNOWN_BRANDS = [
  "OPPO",
  "ONEPLUS",
  "ONE PLUS",
  "VIVO",
  "MI",
  "REDMI",
  "POCO",
  "SAMSUNG",
  "REALME",
  "MOTO",
  "IPHONE",
  "LENOVO",
  "LAVA",
  "INFINIX",
  "TECNO",
  "NOKIA",
  "GOOGLE",
  "JIO",
  "GIONEE",
  "MICROMAX",
  "HONOR",
  "ITEL",
  "ZF MAX",
];

function normalizeBrandLabel(s) {
  const t = asText(s).toUpperCase().replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t === "ONE PLUS") return "ONEPLUS";
  if (t === "REDMI") return "MI";
  return t;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ocrTextToImportLines(ocrText, brandOverride = "") {
  const brandForce = normalizeBrandLabel(brandOverride);
  const lines = normalizeOcrText(ocrText)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const brandSet = new Set(KNOWN_BRANDS.map((b) => normalizeBrandLabel(b)));
  const out = [];
  let currentBrand = brandForce || "";

  const priceRe = /\b(\d{1,2}\s*-\s*\d{1,2})\b/g;
  const codeRe = /\b[A-Z]{1,4}(?:-[A-Z0-9]{2,}){1,4}\b/g;
  const likelyHeaderRe = /\bBATTERY\s+PRICE\s+LIST\b/i;

  for (const rawLine of lines) {
    const line = rawLine
      .replace(/[|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!line) continue;

    if (likelyHeaderRe.test(line)) continue;
    if (/^S\.?\s*NO\.?/i.test(line)) continue;
    if (/^PAGE\s*NO/i.test(line)) continue;
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(line)) continue;

    const upper = normalizeBrandLabel(line);
    if (brandSet.has(upper)) {
      currentBrand = upper;
      continue;
    }
    if (brandForce) currentBrand = brandForce;
    if (!currentBrand) continue;

    const priceMatches = [...line.matchAll(priceRe)].map((m) => m[1]);
    if (!priceMatches.length) continue;
    const priceRaw = priceMatches[priceMatches.length - 1];

    const codeMatches = [...line.matchAll(codeRe)].map((m) => m[0]);
    if (!codeMatches.length) continue;
    const batteryCode = codeMatches[codeMatches.length - 1];

    // Remove leading S.No / numbering if present
    let rest = line.replace(/^\s*\d+\s+/g, "").trim();
    rest = rest.replace(new RegExp(`\\b${escapeRegExp(batteryCode)}\\b`), "").trim();
    rest = rest.replace(new RegExp(`\\b${escapeRegExp(priceRaw)}\\b`), "").trim();
    rest = rest.replace(/\s{2,}/g, " ").trim();

    // If OCR includes extra junk like "( )" or stray dashes
    const phoneModel = rest.replace(/^[\-\–\—]+/, "").replace(/[\-\–\—]+$/, "").trim();
    if (!phoneModel) continue;

    // Validate price token (needs to parse)
    const listPrice = parsePriceToken(priceRaw);
    if (!Number.isFinite(listPrice)) continue;

    out.push(`${currentBrand} | ${phoneModel} | ${batteryCode} | ${priceRaw.replace(/\s+/g, "")}`);
  }

  // Deduplicate
  const seen = new Set();
  const uniq = [];
  for (const l of out) {
    const key = l.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(l);
  }
  return uniq;
}

function rawPriceListToImportLines(rawText) {
  const text = normalizeOcrText(rawText);
  if (!text) return [];

  const brandSet = new Set(KNOWN_BRANDS.map((b) => normalizeBrandLabel(b)));
  let currentBrand = "";

  const cleanedLines = text
    .replace(/\bS\.?\s*NO\.?\b/gi, "\n")
    .replace(/\bMODEL\s+NAME\b/gi, "")
    .replace(/\bPRICE\b/gi, "")
    .replace(/\bPAGE\s*NO\.?\s*[:-]?\s*\d+\b/gi, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];

  // Match "(CODE) 5-30" or "(CODE)530"
  const entryRe =
    /\(\s*([A-Z0-9]{1,6}(?:-[A-Z0-9]{2,}){1,6})\s*\)\s*([0-9]{1,2}\s*-\s*[0-9]{1,2}|\d{2,4})/g;

  for (const rawLine of cleanedLines) {
    const maybeBrand = normalizeBrandLabel(rawLine);
    if (brandSet.has(maybeBrand)) {
      currentBrand = maybeBrand;
      continue;
    }

    // Some headings come like: "OPPO / REALME / RENO"
    const slashParts = rawLine
      .split("/")
      .map((x) => normalizeBrandLabel(x))
      .filter((x) => brandSet.has(x));
    if (slashParts.length) {
      // Keep first recognized as current brand; the entries below typically belong to that block.
      currentBrand = slashParts[0];
      continue;
    }

    if (!currentBrand) continue;

    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line) continue;

    let lastEnd = 0;
    const matches = [...line.matchAll(entryRe)];
    if (!matches.length) continue;

    for (const m of matches) {
      const matchIndex = m.index ?? 0;
      const batteryCode = asText(m[1]);
      const priceRaw = asText(m[2]);
      const priceOk = Number.isFinite(parsePriceToken(priceRaw));
      if (!batteryCode || !priceRaw || !priceOk) continue;

      // Model is the chunk immediately before "(CODE) PRICE"
      const before = line.slice(lastEnd, matchIndex).trim();
      lastEnd = matchIndex + m[0].length;

      // Remove numbering like "1" "23" etc at start
      const model = before
        .replace(/^\d+\s*/g, "")
        .replace(/^[\-\–\—]+/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Some rows are only code+price; skip those (needs model)
      if (!model) continue;

      out.push(`${currentBrand} | ${model} | ${batteryCode} | ${priceRaw.replace(/\s+/g, "")}`);
    }
  }

  const seen = new Set();
  const uniq = [];
  for (const l of out) {
    const key = l.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(l);
  }
  return uniq;
}

function csvPriceListToImportLines(csvText, brand) {
  const brandNorm = normalizeBrandLabel(brand);
  if (!brandNorm) return [];
  const text = normalizeOcrText(csvText);
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];

  // Expected: S.NO.,Model Name,Price
  // Example: 1,F-1+ (BLP-609),530
  // Sometimes OCR/paste may include extra commas in model; we'll treat last column as price.
  for (const line of lines) {
    if (/^S\.?\s*NO/i.test(line)) continue;
    if (/^S\.?\s*NO\.\s*,/i.test(line)) continue;
    if (!/^\d+[,]/.test(line)) continue;

    const parts = line.split(",").map((x) => x.trim());
    if (parts.length < 3) continue;
    const priceRaw = parts[parts.length - 1];
    const modelRaw = parts.slice(1, -1).join(",").trim();
    if (!modelRaw || !priceRaw) continue;

    const priceOk = Number.isFinite(parsePriceToken(priceRaw));
    if (!priceOk) continue;

    // battery code in parentheses: (BLP-609) or (BLP A-21) or sometimes missing parentheses.
    const parenMatch = modelRaw.match(/\(([^)]+)\)/);
    let batteryCode = "";
    let phoneModel = modelRaw;
    if (parenMatch) {
      const inside = asText(parenMatch[1]);
      // If multiple codes like "BLP-755/765" keep as-is (user can split later if needed)
      batteryCode = inside.replace(/\s+/g, " ").trim();
      phoneModel = modelRaw.replace(parenMatch[0], "").replace(/\s{2,}/g, " ").trim();
    } else {
      // If user enters code only (e.g. BLP-679) then treat it as battery code and model too.
      const maybeCode = modelRaw.match(/\b[A-Z]{1,4}(?:[- ][A-Z0-9]{2,}){1,6}\b/);
      if (maybeCode) batteryCode = asText(maybeCode[0]).replace(/\s+/g, " ").trim();
      phoneModel = modelRaw.trim();
    }

    if (!batteryCode) continue;
    out.push(`${brandNorm} | ${phoneModel} | ${batteryCode} | ${priceRaw.replace(/\s+/g, "")}`);
  }

  const seen = new Set();
  const uniq = [];
  for (const l of out) {
    const key = l.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(l);
  }
  return uniq;
}

const emptyNewItem = {
  brand: "",
  phoneModel: "",
  batteryCode: "",
  listPrice: "",
};

export default function GeniusBatterySupplierPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [rows, setRows] = useState([]);
  const [brandFilter, setBrandFilter] = useState("");
  const [search, setSearch] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState("all"); // all | purchased | notPurchased
  const [newItem, setNewItem] = useState(emptyNewItem);
  const [savingItem, setSavingItem] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrBrandOverride, setOcrBrandOverride] = useState("");
  const [csvBrand, setCsvBrand] = useState("");
  const [salesCategories, setSalesCategories] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [purchaseModal, setPurchaseModal] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState(null);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setToast("");
    try {
      const qs = new URLSearchParams();
      if (brandFilter) qs.set("brand", brandFilter);
      if (search.trim()) qs.set("q", search.trim());
      qs.set("active", "1");
      if (supplierId) qs.set("supplierId", supplierId);

      const [viewRes, scRes, qRes, supRes] = await Promise.all([
        fetch(`/api/battery-suppliers/genius?${qs.toString()}`),
        fetch("/api/sales-categories"),
        fetch("/api/product-qualities"),
        fetch("/api/suppliers"),
      ]);
      const viewJson = await viewRes.json();
      const scJson = await scRes.json();
      const qJson = await qRes.json();
      const supJson = await supRes.json();
      if (!viewRes.ok) throw new Error(viewJson.error || "Failed to load");
      if (!scRes.ok) throw new Error(scJson.error || "Failed sales categories");
      if (!qRes.ok) throw new Error(qJson.error || "Failed qualities");
      if (!supRes.ok) throw new Error(supJson.error || "Failed suppliers");

      setSupplier(viewJson.supplier || null);
      setRows(viewJson.items || []);
      setSalesCategories(scJson.categories || []);
      setQualities((qJson.qualities || []).map((x) => x.name).filter(Boolean));
      setSuppliers(supJson.suppliers || []);
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  }, [brandFilter, search, supplierId]);


  useEffect(() => {
    void load();
  }, [load]);

  // Remember which supplier's purchases to match (important when purchases were entered under a non-"Genius" supplier).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("genius_purchase_supplierId") || "";
      if (saved && !supplierId) setSupplierId(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (supplierId) localStorage.setItem("genius_purchase_supplierId", supplierId);
    } catch {
      /* ignore */
    }
  }, [supplierId]);


  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    // Keep selection valid after refresh/filtering.
    const allowed = new Set((rows || []).map((r) => String(r._id)));
    setSelectedIds((prev) => prev.filter((id) => allowed.has(String(id))));
  }, [rows]);

  const brands = useMemo(() => {
    const set = new Set();
    for (const r of rows) set.add(asText(r.brand));
    return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const batterySalesCategoryId = useMemo(() => {
    const hit = (salesCategories || []).find((c) => asText(c.name).toLowerCase() === "battery");
    return hit?._id || "";
  }, [salesCategories]);

  const defaultQuality = useMemo(() => qualities?.[0] || "Original", [qualities]);

  const purchasedCount = useMemo(() => rows.filter((r) => r.purchased).length, [rows]);
  const notPurchasedCount = useMemo(() => rows.length - purchasedCount, [rows, purchasedCount]);

  const visibleRows = useMemo(() => {
    if (purchaseFilter === "purchased") return rows.filter((r) => r.purchased);
    if (purchaseFilter === "notPurchased") return rows.filter((r) => !r.purchased);
    return rows;
  }, [purchaseFilter, rows]);
  const allSelected = useMemo(
    () => rows.length > 0 && selectedIds.length === rows.length,
    [rows.length, selectedIds.length]
  );

  const selectedCount = selectedIds.length;
  const selectedSummary = useMemo(() => {
    if (!selectedIds.length) return { rows: 0, totalList: 0, totalPurchasedQty: 0 };
    const set = new Set(selectedIds.map(String));
    let totalList = 0;
    let totalPurchasedQty = 0;
    let count = 0;
    for (const r of rows) {
      if (!set.has(String(r._id))) continue;
      count += 1;
      totalList += Number(r.listPrice || 0);
      totalPurchasedQty += Number(r.purchasedQty || 0);
    }
    return { rows: count, totalList, totalPurchasedQty };
  }, [rows, selectedIds]);

  const toggleSelection = useCallback((id) => {
    const key = String(id);
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (!rows.length) return [];
      if (prev.length === rows.length) return [];
      return rows.map((r) => String(r._id));
    });
  }, [rows]);

  async function ensureBatteryCategory() {
    if (batterySalesCategoryId) return batterySalesCategoryId;
    const res = await fetch("/api/sales-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Battery" }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Failed to create Battery category");
    const next = [...salesCategories, j.category].filter(Boolean);
    setSalesCategories(next);
    return j.category?._id || "";
  }

  async function createItem(e) {
    e.preventDefault();
    setSavingItem(true);
    setToast("");
    try {
      const listPrice = parsePriceToken(newItem.listPrice);
      const res = await fetch("/api/battery-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierKey: "genius",
          brand: newItem.brand,
          phoneModel: newItem.phoneModel,
          batteryCode: newItem.batteryCode,
          listPrice,
          active: true,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to create");
      setNewItem(emptyNewItem);
      setToast("Battery added to catalog");
      await load();
    } catch (e2) {
      setToast(e2.message);
    } finally {
      setSavingItem(false);
    }
  }

  async function toggleActive(row) {
    setToast("");
    try {
      const res = await fetch(`/api/battery-catalog/${row._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");
      setToast(!row.active ? "Marked active" : "Marked inactive");
      await load();
    } catch (e) {
      setToast(e.message);
    }
  }

  function parseBulkLines(text) {
    const lines = String(text || "")
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);
    const out = [];
    for (const line of lines) {
      // Accept:
      // - brand | phoneModel | batteryCode | price
      // - brand, phoneModel, batteryCode, price
      // - TSV/table paste: (optional sno) <tab> phoneModel <tab> batteryCode <tab> price
      // - Space separated 4 columns (fallback)
      let parts;
      if (line.includes("|")) {
        parts = line.split("|").map((x) => x.trim());
      } else if (line.includes("\t")) {
        parts = line.split("\t").map((x) => x.trim());
      } else if (line.includes(",")) {
        parts = line.split(",").map((x) => x.trim());
      } else {
        parts = line.split(/\s{2,}/g).map((x) => x.trim());
      }

      parts = (parts || []).filter(Boolean);
      if (parts.length < 3) continue;

      // If first column is S.NO remove it
      if (/^\d+$/.test(parts[0])) {
        parts = parts.slice(1);
      }

      let brand = "";
      let phoneModel = "";
      let batteryCode = "";
      let priceRaw = "";

      if (parts.length >= 4) {
        [brand, phoneModel, batteryCode, priceRaw] = parts;
      } else if (parts.length === 3) {
        // brand missing → take from CSV brand selector (if set)
        brand = normalizeBrandLabel(csvBrand);
        [phoneModel, batteryCode, priceRaw] = parts;
      } else if (parts.length === 2) {
        // model + price only → batteryCode defaults to model name (useful for iPhone lists)
        brand = normalizeBrandLabel(csvBrand);
        [phoneModel, priceRaw] = parts;
        batteryCode = phoneModel;
      } else {
        continue;
      }

      const listPrice = parsePriceToken(priceRaw);
      if (!brand || !phoneModel || !batteryCode || !Number.isFinite(listPrice)) continue;
      out.push({ brand, phoneModel, batteryCode, listPrice });
    }
    return out;
  }

  async function runOcrOnFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => String(f?.type || "").startsWith("image/"));
    if (!files.length) {
      setToast("Select image files");
      return;
    }
    setOcrBusy(true);
    setToast("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      try {
        await worker.setParameters({
          preserve_interword_spaces: "1",
          tessedit_pageseg_mode: "6",
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,+-_/()[]{}.:| ",
        });

        const allLines = [];
        for (const file of files) {
          const { data } = await worker.recognize(file);
          const text = String(data?.text || "");
          const lines = ocrTextToImportLines(text, ocrBrandOverride);
          allLines.push(...lines);
        }

        if (!allLines.length) {
          setToast("OCR finished, but no import lines detected. Try setting Brand override and re-run.");
          return;
        }

        const merged = allLines.join("\n");
        setBulkText((prev) => (prev.trim() ? `${prev.trim()}\n${merged}\n` : `${merged}\n`));
        setToast(`OCR added ${allLines.length} lines to Bulk import`);
      } finally {
        await worker.terminate();
      }
    } catch (e) {
      setToast(e?.message || "OCR failed");
    } finally {
      setOcrBusy(false);
    }
  }

  async function importBulk() {
    const items = parseBulkLines(bulkText);
    if (!items.length) {
      setToast(
        csvBrand
          ? `Nothing to import. Paste rows as: Model<TAB>Code<TAB>Price or Brand | Model | Code | Price (CSV brand is ${normalizeBrandLabel(csvBrand)}).`
          : "Nothing to import. Paste rows as: Brand | Model | Code | Price (or pick CSV brand then paste Model/Code/Price)."
      );
      return;
    }
    setBulkBusy(true);
    setToast("");
    try {
      let ok = 0;
      let fail = 0;
      for (const it of items) {
        const res = await fetch("/api/battery-catalog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supplierKey: "genius", ...it, active: true }),
        });
        if (res.ok) ok += 1;
        else fail += 1;
      }
      setToast(fail ? `Imported ${ok}, failed ${fail} (duplicates are counted as failed)` : `Imported ${ok}`);
      setBulkText("");
      await load();
    } catch (e) {
      setToast(e.message || "Import failed");
    } finally {
      setBulkBusy(false);
    }
  }

  function convertBulkText() {
    const lines = rawPriceListToImportLines(bulkText);
    if (!lines.length) {
      setToast("Could not detect rows. Try OCR import, or paste with (CODE) and price like: F-1+ (BLP-609) 530");
      return;
    }
    setBulkText(lines.join("\n") + "\n");
    setToast(`Converted to ${lines.length} import line(s). Now click Import.`);
  }

  function convertCsvText() {
    const brand = csvBrand;
    if (!normalizeBrandLabel(brand)) {
      setToast("Select brand first (for CSV convert)");
      return;
    }
    const lines = csvPriceListToImportLines(bulkText, brand);
    if (!lines.length) {
      setToast("No CSV rows detected. Format must be like: 1,F-1+ (BLP-609),530");
      return;
    }
    setBulkText(lines.join("\n") + "\n");
    setToast(`Converted CSV to ${lines.length} import line(s). Now click Import.`);
  }

  function openPurchase(item) {
    setPurchaseModal(item);
    setPurchaseForm({
      date: new Date().toISOString().slice(0, 10),
      quantity: "1",
      purchasePrice: "",
      quality: defaultQuality,
    });
    setToast("");
  }

  async function savePurchase(e) {
    e.preventDefault();
    if (!purchaseModal || !purchaseForm || !supplier?._id) return;
    setPurchaseSaving(true);
    setToast("");
    try {
      const categoryId = await ensureBatteryCategory();
      if (!categoryId) throw new Error("Battery ledger category not available");
      const quantity = Number(purchaseForm.quantity);
      const purchasePrice = Number(purchaseForm.purchasePrice);
      if (!Number.isFinite(quantity) || quantity < 1) throw new Error("Quantity must be at least 1");
      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) throw new Error("Enter valid purchase price");

      const res = await fetch("/api/inventory/parts-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier._id,
          date: purchaseForm.date,
          salesCategoryId: categoryId,
          mobileName: purchaseModal.brand,
          productName: purchaseModal.phoneModel,
          quality: purchaseForm.quality,
          quantity,
          purchasePrice,
          gstAmount: 0,
          notes: `Battery code: ${purchaseModal.batteryCode}`,
          signatureName: purchaseModal.batteryCode,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to save purchase");
      setPurchaseModal(null);
      setPurchaseForm(null);
      setToast("Purchase saved · stock updated");
      await load();
    } catch (e2) {
      setToast(e2.message);
    } finally {
      setPurchaseSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selectedIds.length) return;
    const ok = window.confirm(`Delete ${selectedIds.length} selected catalog item(s)?`);
    if (!ok) return;
    setBulkDeleteBusy(true);
    setToast("");
    try {
      let okCount = 0;
      let failCount = 0;
      for (const id of selectedIds) {
        const res = await fetch(`/api/battery-catalog/${encodeURIComponent(String(id))}`, { method: "DELETE" });
        if (res.ok) okCount += 1;
        else failCount += 1;
      }
      setSelectedIds([]);
      await load();
      if (failCount) setToast(`Deleted ${okCount}, failed ${failCount}`);
      else setToast(`Deleted ${okCount}`);
    } catch (e) {
      setToast(e?.message || "Bulk delete failed");
    } finally {
      setBulkDeleteBusy(false);
    }
  }

  function openEdit(row) {
    setEditId(String(row?._id || ""));
    setEditForm({
      brand: asText(row?.brand),
      phoneModel: asText(row?.phoneModel),
      batteryCode: asText(row?.batteryCode),
      listPrice: String(row?.listPrice ?? ""),
      active: Boolean(row?.active),
    });
    setToast("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editId || !editForm) return;
    setEditSaving(true);
    setToast("");
    try {
      const listPrice = parsePriceToken(editForm.listPrice);
      const res = await fetch(`/api/battery-catalog/${encodeURIComponent(editId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: editForm.brand,
          phoneModel: editForm.phoneModel,
          batteryCode: editForm.batteryCode,
          listPrice,
          active: Boolean(editForm.active),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Update failed");
      setEditId(null);
      setEditForm(null);
      setToast("Updated");
      await load();
    } catch (err) {
      setToast(err?.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-black">Genius Battery Supplier</h1>
          <p className="mt-1 text-sm text-black/60">
            Catalog + purchases. Use <strong>Purchase</strong> to record qty & purchase price; items without purchase show{" "}
            <strong>Not purchased</strong>.
          </p>
          <p className="mt-1 text-xs text-black/50">
            Supplier: <strong>{supplier?.name || "—"}</strong>
          </p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-black/45">Stats</p>
          <p className="mt-1 text-sm font-semibold text-black">
            Rows: {rows.length} · Purchased: {purchasedCount} · Not purchased: {notPurchasedCount}
          </p>
        </div>
      </div>

      {toast ? <p className="mt-4 rounded-lg border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-black">{toast}</p> : null}

      <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <div>
          <label className="text-[11px] font-bold text-black/45">Purchase supplier (must match where you entered purchases)</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
          >
            <option value="">All suppliers (recommended)</option>
            {(suppliers || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-black/55">
          To mark an item as <strong>Purchased</strong>, the purchase line must have <strong>Signature name = battery code</strong>.
          The “Use Genius battery catalog” checkbox flow sets this automatically.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form onSubmit={createItem} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-black">Add catalog battery</h2>
          <p className="mt-1 text-xs text-black/50">Example: Oppo · F1+ · BLP-609 · 5-30 (means ₹530)</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-black/45">Brand</label>
              <input
                required
                value={newItem.brand}
                onChange={(e) => setNewItem((s) => ({ ...s, brand: e.target.value }))}
                placeholder="Oppo"
                className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/45">Phone model</label>
              <input
                required
                value={newItem.phoneModel}
                onChange={(e) => setNewItem((s) => ({ ...s, phoneModel: e.target.value }))}
                placeholder="F1+"
                className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/45">Battery code</label>
              <input
                required
                value={newItem.batteryCode}
                onChange={(e) => setNewItem((s) => ({ ...s, batteryCode: e.target.value }))}
                placeholder="BLP-609"
                className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/45">List price</label>
              <input
                required
                value={newItem.listPrice}
                onChange={(e) => setNewItem((s) => ({ ...s, listPrice: e.target.value }))}
                placeholder="5-30"
                className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingItem}
            className="mt-4 min-h-12 rounded-lg bg-black px-6 text-sm font-bold text-brand disabled:opacity-50"
          >
            {savingItem ? "Saving…" : "Add to catalog"}
          </button>
        </form>

        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-black">Bulk import (paste)</h2>
          <p className="mt-1 text-xs text-black/50">
            One line per battery. Use <strong>|</strong> or comma. Format: Brand | PhoneModel | BatteryCode | Price
          </p>
          <div className="mt-3 rounded-lg border border-black/10 bg-zinc-50 p-3">
            <p className="text-xs font-bold text-black/60">Import from images (OCR)</p>
            <p className="mt-1 text-[11px] text-black/55">
              Upload your 4 pages. OCR will try to detect Brand/Model/Code/Price and append lines into the box below.
              If brand detection is wrong, set <strong>Brand override</strong> and re-run for that image.
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <div>
                <label className="text-[11px] font-bold text-black/45">Brand override (optional)</label>
                <select
                  value={ocrBrandOverride}
                  onChange={(e) => setOcrBrandOverride(e.target.value)}
                  className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
                >
                  <option value="">Auto-detect</option>
                  {KNOWN_BRANDS.map((b) => (
                    <option key={b} value={normalizeBrandLabel(b)}>
                      {normalizeBrandLabel(b)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-black/45">Upload images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={ocrBusy}
                  onChange={(e) => {
                    const files = e.target.files;
                    e.target.value = "";
                    void runOcrOnFiles(files);
                  }}
                  className="mt-1 block w-full text-sm"
                />
              </div>
              <button
                type="button"
                disabled={ocrBusy}
                onClick={() => setBulkText("")}
                className="min-h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold text-black disabled:opacity-50"
              >
                Clear bulk box
              </button>
              <button
                type="button"
                disabled={ocrBusy || bulkBusy}
                onClick={convertBulkText}
                className="min-h-11 rounded-lg bg-brand px-4 text-sm font-bold text-black disabled:opacity-50"
                title="Convert pasted price list text into Brand | Model | Code | Price lines"
              >
                Convert pasted list
              </button>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="text-[11px] font-bold text-black/45">CSV brand</label>
                  <select
                    value={csvBrand}
                    onChange={(e) => setCsvBrand(e.target.value)}
                    className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
                  >
                    <option value="">Select…</option>
                    {KNOWN_BRANDS.map((b) => (
                      <option key={b} value={normalizeBrandLabel(b)}>
                        {normalizeBrandLabel(b)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={ocrBusy || bulkBusy}
                  onClick={convertCsvText}
                  className="min-h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-bold text-black disabled:opacity-50"
                  title="Convert CSV (S.NO, Model Name, Price) into import lines"
                >
                  Convert CSV
                </button>
              </div>
              {ocrBusy ? <p className="text-xs font-semibold text-black/55">Reading… (can take 20-60s)</p> : null}
            </div>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={7}
            placeholder={"Oppo | F1+ | BLP-609 | 5-30\nSamsung | A10 | EB-BG610ABE | 4-25"}
            className="mt-3 w-full resize-y rounded-lg border border-black/15 px-3 py-2 text-sm leading-6"
          />
          <button
            type="button"
            onClick={importBulk}
            disabled={bulkBusy}
            className="mt-3 min-h-12 rounded-lg bg-black px-6 text-sm font-bold text-brand disabled:opacity-50"
          >
            {bulkBusy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-black">Catalog</h2>
          <p className="mt-1 text-xs text-black/50">Filter by brand and search by model/code.</p>
          {selectedCount ? (
            <p className="mt-1 text-xs font-semibold text-black/70">
              Selected: {selectedSummary.rows} · Total list: ₹{selectedSummary.totalList.toLocaleString("en-IN")} ·
              Purchased qty: {selectedSummary.totalPurchasedQty.toLocaleString("en-IN")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <label className="text-[11px] font-bold text-black/45">Brand</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
            >
              <option value="">All</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-black/45">Search</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. BLP-609"
              className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-black/45">Purchased</label>
            <select
              value={purchaseFilter}
              onChange={(e) => setPurchaseFilter(e.target.value)}
              className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="purchased">Purchased</option>
              <option value="notPurchased">Not purchased</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-lg bg-brand px-4 text-sm font-bold text-black"
            >
              Refresh
            </button>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!selectedCount || bulkDeleteBusy}
              onClick={deleteSelected}
              className="min-h-11 rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-bold text-red-700 disabled:opacity-50"
              title="Delete selected catalog items"
            >
              {bulkDeleteBusy ? "Deleting…" : `Delete selected (${selectedCount})`}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-black/55">Loading…</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all catalog rows"
                    className="h-4 w-4 rounded border-black/25"
                  />
                </th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Phone model</th>
                <th className="px-3 py-2">Battery code</th>
                <th className="px-3 py-2">List price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Purchased qty</th>
                <th className="px-3 py-2">Last purchase</th>
                <th className="px-3 py-2">Last total</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {visibleRows.map((r) => (
                <tr key={r._id} className={!r.active ? "opacity-60" : ""}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(r._id))}
                      onChange={() => toggleSelection(r._id)}
                      aria-label={`Select ${r.brand} ${r.phoneModel} ${r.batteryCode}`}
                      className="h-4 w-4 rounded border-black/25"
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold">{r.brand}</td>
                  <td className="px-3 py-2">{r.phoneModel}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.batteryCode}</td>
                  <td className="px-3 py-2">₹{Number(r.listPrice || 0).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">
                    {r.purchased ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                        Purchased
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-black/60">
                        Not purchased
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-semibold">{Number(r.purchasedQty || 0)}</td>
                  <td className="px-3 py-2 text-black/75">
                    {r.lastPurchasePrice == null ? (
                      "—"
                    ) : (
                      <>
                        ₹{Number(r.lastPurchasePrice).toLocaleString("en-IN")}
                        {r.lastPurchaseDate ? (
                          <span className="text-xs text-black/45"> · {new Date(r.lastPurchaseDate).toLocaleDateString()}</span>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 font-semibold">
                    {r.lastPurchaseTotal == null ? "—" : `₹${Number(r.lastPurchaseTotal).toLocaleString("en-IN")}`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {typeof r._id === "string" && /^[a-f\d]{24}$/i.test(r._id) ? (
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="text-xs font-bold text-brand-dim hover:underline"
                      >
                        Edit
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="This is a virtual row (from purchases). Add it to catalog first to edit."
                        className="cursor-not-allowed text-xs font-bold text-black/40"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 ? (
            <p className="p-6 text-center text-sm text-black/50">
              No catalog items to show. Add/import catalog first (top of page), then purchases will appear as Purchased.
            </p>
          ) : null}
        </div>
      )}

      {purchaseModal && purchaseForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={savePurchase} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-black">Purchase entry</h3>
            <p className="mt-1 text-xs text-black/55">
              {purchaseModal.brand} · {purchaseModal.phoneModel} · <span className="font-mono">{purchaseModal.batteryCode}</span>
            </p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-bold text-black/45">Date</label>
                <input
                  type="date"
                  required
                  value={purchaseForm.date}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, date: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Quality</label>
                <select
                  value={purchaseForm.quality}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, quality: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                >
                  {(qualities.length ? qualities : [defaultQuality]).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-black/45">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                    inputMode="numeric"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black/45">Purchase price (unit)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={purchaseForm.purchasePrice}
                    onChange={(e) => setPurchaseForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                    className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                    inputMode="numeric"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={purchaseSaving}
                className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand disabled:opacity-50"
              >
                {purchaseSaving ? "Saving…" : "Save purchase"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurchaseModal(null);
                  setPurchaseForm(null);
                }}
                className="min-h-11 flex-1 rounded-lg border text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {editId && editForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={saveEdit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-black">Edit catalog item</h3>
            <p className="mt-1 text-xs text-black/55">Update brand/model/code/list price (₹) and active status.</p>
            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-bold text-black/45">Brand</label>
                <input
                  required
                  value={editForm.brand}
                  onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Phone model</label>
                <input
                  required
                  value={editForm.phoneModel}
                  onChange={(e) => setEditForm((f) => ({ ...f, phoneModel: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Battery code</label>
                <input
                  required
                  value={editForm.batteryCode}
                  onChange={(e) => setEditForm((f) => ({ ...f, batteryCode: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">List price</label>
                <input
                  required
                  value={editForm.listPrice}
                  onChange={(e) => setEditForm((f) => ({ ...f, listPrice: e.target.value }))}
                  placeholder="e.g. 530 or 5-30"
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
                <p className="mt-1 text-[11px] text-black/45">Tip: “5-30” becomes ₹530.</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-black/70">
                <input
                  type="checkbox"
                  checked={Boolean(editForm.active)}
                  onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-black/25"
                />
                Active (visible when “Showing active”)
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={editSaving}
                className="min-h-11 flex-1 rounded-lg bg-black text-sm font-bold text-brand disabled:opacity-50"
              >
                {editSaving ? "Saving…" : "Save"}
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
    </div>
  );
}

