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

function deriveSignatureFromProductLabel(label) {
  const text = String(label || "").trim();
  if (!text) return "";
  const firstPart = text.split(",")[0]?.trim() || "";
  if (!firstPart) return "";
  const normalized = firstPart.replace(/\s+/g, " ").trim();
  return normalized;
}

function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  className,
  autoComplete = "off",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);

  const filtered = useMemo(() => {
    const q = String(value || "").trim().toLowerCase();
    const base = Array.isArray(suggestions) ? suggestions : [];
    if (!q) return base.slice(0, 8);
    return base.filter((x) => String(x).toLowerCase().includes(q)).slice(0, 8);
  }, [suggestions, value]);

  const applyValue = useCallback(
    (next) => {
      onChange(next);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        setOpen(filtered.length > 0);
      }
      if (!filtered.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
      } else if (e.key === "Enter") {
        if (open && activeIndex >= 0 && activeIndex < filtered.length) {
          e.preventDefault();
          applyValue(filtered[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [activeIndex, applyValue, filtered, open]
  );

  useEffect(() => {
    const onDocPointerDown = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        disabled={disabled}
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(filtered.length > 0)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={className}
      />
      {open && filtered.length ? (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-black/15 bg-white py-1 shadow-lg">
          {filtered.map((item, idx) => (
            <li key={`${item}-${idx}`}>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  applyValue(item);
                }}
                onClick={() => applyValue(item)}
                className={`w-full px-3 py-3 text-left text-sm ${
                  idx === activeIndex ? "bg-zinc-100 text-black" : "text-black/90 hover:bg-zinc-50"
                }`}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function fixCommonModelOcrArtifacts(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/％/g, "%")
    .replace(/([A-Za-z0-9])%([A-Za-z0-9])/g, "$19$2")
    .replace(/\bRLM%/gi, "RLM9")
    .replace(/\bRMX%/gi, "RMX9");
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
  const minSize = 20;
  const safeW = Math.max(minSize, Math.min(stageW, crop.w));
  const safeH = Math.max(minSize, Math.min(stageH, crop.h));
  const safeX = Math.max(0, Math.min(stageW - safeW, crop.x));
  const safeY = Math.max(0, Math.min(stageH - safeH, crop.y));
  return { x: safeX, y: safeY, w: safeW, h: safeH };
}

async function preprocessImageForOcr(imageSource) {
  if (!(imageSource instanceof Blob)) return null;
  const objectUrl = URL.createObjectURL(imageSource);
  try {
    const img = await new Promise((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("Could not prepare image for OCR"));
      node.src = objectUrl;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.filter = "grayscale(1) contrast(1.45) brightness(1.08)";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || null), "image/png");
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
  const [bulkDeleting, setBulkDeleting] = useState(false);
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
  const modelGalleryInputRef = useRef(null);
  const cropStageRef = useRef(null);
  const cropImageRef = useRef(null);
  const liveCameraVideoRef = useRef(null);
  const liveCameraStreamRef = useRef(null);
  const [modelOcrBusy, setModelOcrBusy] = useState(false);
  const [ocrImageUrl, setOcrImageUrl] = useState("");
  const [ocrImageFile, setOcrImageFile] = useState(null);
  const [ocrCropOpen, setOcrCropOpen] = useState(false);
  const [ocrSelection, setOcrSelection] = useState(null);
  const [ocrInteraction, setOcrInteraction] = useState(null);
  const [ocrZoomPreviewUrl, setOcrZoomPreviewUrl] = useState("");
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [branchSuggestions, setBranchSuggestions] = useState([]);
  const [qualitySuggestions, setQualitySuggestions] = useState([]);
  const [signatureSuggestions, setSignatureSuggestions] = useState([]);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState([]);
  const [signatureManuallyEdited, setSignatureManuallyEdited] = useState(false);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [useGeniusCatalog, setUseGeniusCatalog] = useState(false);
  const [signaturePromptOpen, setSignaturePromptOpen] = useState(false);
  const [signaturePromptValue, setSignaturePromptValue] = useState("");
  const [signaturePromptSkip, setSignaturePromptSkip] = useState(false);
  const [geniusOpen, setGeniusOpen] = useState(false);
  const [geniusLoading, setGeniusLoading] = useState(false);
  const [geniusItems, setGeniusItems] = useState([]);
  const [geniusQ, setGeniusQ] = useState("");
  const [geniusBrand, setGeniusBrand] = useState("");
  const [geniusSelected, setGeniusSelected] = useState([]);
  const [geniusEdits, setGeniusEdits] = useState({});
  const [geniusMetaOpen, setGeniusMetaOpen] = useState(false);
  const [geniusMetaSignature, setGeniusMetaSignature] = useState("");
  const [geniusMetaQuality, setGeniusMetaQuality] = useState("");

  const batteryCategoryId = useMemo(() => {
    const hit = (categories || []).find((c) => String(c?.name || "").trim().toLowerCase() === "battery");
    return hit?._id || "";
  }, [categories]);

  useEffect(() => {
    if (!useGeniusCatalog) return;
    setForm((f) => {
      const next = { ...f };
      // When Genius catalog mode is on, always prefer Battery ledger category (avoid accidental "Folder").
      if (batteryCategoryId) next.salesCategoryId = batteryCategoryId;
      if (!String(next.quality || "").trim()) next.quality = qualitySuggestions?.[0] || "Original";
      return next;
    });
  }, [batteryCategoryId, qualitySuggestions, useGeniusCatalog]);

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

  const loadGenius = useCallback(async () => {
    if (!geniusOpen) return;
    setGeniusLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("supplierKey", "genius");
      qs.set("active", "1");
      if (geniusQ.trim()) qs.set("q", geniusQ.trim());
      if (geniusBrand.trim()) qs.set("brand", geniusBrand.trim());
      const res = await fetch(`/api/battery-catalog?${qs.toString()}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load genius catalog");
      const items = Array.isArray(j.items) ? j.items : [];
      setGeniusItems(items);
      setGeniusEdits((prev) => {
        const next = { ...prev };
        for (const it of items) {
          const key = String(it._id);
          if (!next[key]) {
            next[key] = { quantity: "1", purchasePrice: String(Number(it.listPrice || 0)) };
          }
        }
        return next;
      });
    } catch (e) {
      setToast(e.message);
    } finally {
      setGeniusLoading(false);
    }
  }, [geniusBrand, geniusOpen, geniusQ]);

  useEffect(() => {
    void loadGenius();
  }, [loadGenius]);

  const geniusBrands = useMemo(() => {
    const set = new Set();
    for (const it of geniusItems) set.add(String(it.brand || "").trim());
    return [...set].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [geniusItems]);

  const toggleGeniusSelectAll = useCallback(() => {
    setGeniusSelected((prev) => {
      if (!geniusItems.length) return [];
      if (prev.length === geniusItems.length) return [];
      return geniusItems.map((x) => String(x._id));
    });
  }, [geniusItems]);

  const toggleGeniusRow = useCallback((rowId) => {
    const key = String(rowId);
    setGeniusSelected((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }, []);

  // saveGeniusPurchases is defined after `load` to avoid TDZ errors in dev.

  const stopLiveCamera = useCallback(() => {
    const stream = liveCameraStreamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      liveCameraStreamRef.current = null;
    }
    if (liveCameraVideoRef.current) {
      liveCameraVideoRef.current.srcObject = null;
    }
    setCameraModalOpen(false);
    setCameraBusy(false);
    setCameraError("");
  }, []);

  const openLiveCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setToast("Camera is not supported on this browser. Use Upload image.");
      return;
    }
    setCameraBusy(true);
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      liveCameraStreamRef.current = stream;
      setCameraModalOpen(true);
      requestAnimationFrame(() => {
        const video = liveCameraVideoRef.current;
        if (!video) return;
        video.srcObject = stream;
        void video.play().catch(() => {});
      });
    } catch (err) {
      setCameraError("Camera permission blocked. Allow camera and retry, or use Upload image.");
      setToast(err?.message || "Could not open camera");
    } finally {
      setCameraBusy(false);
    }
  }, []);

  const beginCropForFile = useCallback((file) => {
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

  const runModelOcr = useCallback(async (imageSource) => {
    setModelOcrBusy(true);
    setToast("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      try {
        await worker.setParameters({
          preserve_interword_spaces: "1",
          tessedit_pageseg_mode: "6",
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,+-_/()[]{}.: ",
        });

        const enhancedSource = await preprocessImageForOcr(imageSource);
        const variants = enhancedSource
          ? [imageSource, enhancedSource]
          : [imageSource];
        let bestText = "";
        let bestConfidence = -1;

        for (const src of variants) {
          const { data } = await worker.recognize(src);
          const confidence = Number(data?.confidence || 0);
          if (confidence >= bestConfidence) {
            bestConfidence = confidence;
            bestText = String(data?.text || "");
          }
        }

        const cleaned = normalizeOcrForModels(fixCommonModelOcrArtifacts(bestText));
        if (!cleaned) {
          setToast("No text found in photo — try a clearer shot or type manually");
          return;
        }
        setForm((f) => {
          const nextModelNames = f.modelNames.trim() ? `${f.modelNames.trim()}, ${cleaned}` : cleaned;
          const autoSignature = deriveSignatureFromProductLabel(nextModelNames);
          return {
            ...f,
            modelNames: nextModelNames,
            signatureName: signatureManuallyEdited ? f.signatureName : autoSignature,
          };
        });
        setToast("Text from selected area added with enhanced OCR — verify quickly, then save");
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      setToast(err?.message || "Could not read text from image");
    } finally {
      setModelOcrBusy(false);
    }
  }, [signatureManuallyEdited]);

  const onModelPhotoOcr = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setToast("Choose an image file");
      return;
    }
    beginCropForFile(file);
  }, [beginCropForFile]);

  const captureFromLiveCamera = useCallback(async () => {
    const video = liveCameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setToast("Camera not ready yet");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setToast("Could not capture photo");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || null), "image/jpeg", 0.95);
    });
    if (!blob) {
      setToast("Could not capture photo");
      return;
    }
    const photo = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
    stopLiveCamera();
    beginCropForFile(photo);
  }, [beginCropForFile, stopLiveCamera]);

  useEffect(() => {
    return () => stopLiveCamera();
  }, [stopLiveCamera]);

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

  const updateCropDuringInteraction = useCallback(
    (clientX, clientY) => {
      if (!ocrInteraction) return;
      const rect = getStageRect();
      if (!rect) return;
      const px = Math.min(rect.width, Math.max(0, clientX - rect.left));
      const py = Math.min(rect.height, Math.max(0, clientY - rect.top));
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
      } else if (ocrInteraction.type === "resize-n") {
        next = { x: base.x, y: base.y + dy, w: base.w, h: base.h - dy };
      } else if (ocrInteraction.type === "resize-s") {
        next = { x: base.x, y: base.y, w: base.w, h: base.h + dy };
      } else if (ocrInteraction.type === "resize-w") {
        next = { x: base.x + dx, y: base.y, w: base.w - dx, h: base.h };
      } else if (ocrInteraction.type === "resize-e") {
        next = { x: base.x, y: base.y, w: base.w + dx, h: base.h };
      }

      setOcrSelection(clampCrop(next, rect.width, rect.height));
    },
    [getStageRect, ocrInteraction]
  );

  useEffect(() => {
    if (!ocrInteraction) return;
    const onMove = (e) => updateCropDuringInteraction(e.clientX, e.clientY);
    const onEnd = () => setOcrInteraction(null);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onEnd, { passive: true });
    window.addEventListener("pointercancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [ocrInteraction, updateCropDuringInteraction]);

  const startCropInteraction = useCallback(
    (e, type) => {
      if (!ocrSelection) return;
      const rect = getStageRect();
      if (!rect) return;
      const px = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
      const py = Math.min(rect.height, Math.max(0, e.clientY - rect.top));
      e.stopPropagation();
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

  const saveGeniusPurchases = useCallback(
    async (e) => {
      e?.preventDefault?.();
      if (!geniusSelected.length) {
        setToast("Select at least 1 battery from Genius catalog");
        return;
      }
      const salesCategoryId = (batteryCategoryId || String(form.salesCategoryId || "").trim());
      if (!salesCategoryId) {
        setToast('Select ledger category "Battery" (or create it in Sales System → Ledger categories)');
        return;
      }
      // Prompt optional signature/quality overrides before saving.
      // Quality is still required by the API; leaving it blank here will fall back to form.quality.
      if (!geniusMetaOpen) {
        setGeniusMetaSignature("");
        setGeniusMetaQuality(String(form.quality || "").trim());
        setGeniusMetaOpen(true);
        return;
      }
      setSaving(true);
      setToast("");
      try {
        const quality = String(geniusMetaQuality || "").trim() || String(form.quality || "").trim();
        if (!quality) throw new Error("Select quality");
        const signatureOverride = String(geniusMetaSignature || "").trim();

        const idSet = new Set(geniusSelected);
        const selectedRows = geniusItems.filter((x) => idSet.has(String(x._id)));
        for (const it of selectedRows) {
          const edit = geniusEdits[String(it._id)] || {};
          const quantity = Number(edit.quantity || 0);
          const purchasePrice = Number(edit.purchasePrice || 0);
          if (!Number.isFinite(quantity) || quantity < 1) throw new Error(`Invalid quantity for ${it.phoneModel}`);
          if (!Number.isFinite(purchasePrice) || purchasePrice < 0)
            throw new Error(`Invalid purchase price for ${it.phoneModel}`);

          const res = await fetch("/api/inventory/parts-purchases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              supplierId: id,
              date: form.date,
              salesCategoryId,
              mobileName: String(it.brand || "").trim() || "—",
              productName: String(it.phoneModel || "").trim(),
              quality,
              quantity,
              purchasePrice,
              gstAmount: 0,
              notes: `Genius battery · code: ${it.batteryCode}`,
              // Store only if admin provided; otherwise keep blank.
              signatureName: signatureOverride,
            }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || "Failed to save a genius purchase line");
        }
        setToast("Genius purchase saved · stock updated");
        setGeniusOpen(false);
        setGeniusSelected([]);
        setGeniusMetaOpen(false);
        await load();
      } catch (err) {
        setToast(err.message || "Failed to save genius purchases");
      } finally {
        setSaving(false);
      }
    },
    [
      batteryCategoryId,
      form.date,
      form.quality,
      form.salesCategoryId,
      geniusEdits,
      geniusItems,
      geniusMetaOpen,
      geniusMetaQuality,
      geniusMetaSignature,
      geniusSelected,
      id,
      load,
    ]
  );

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
    (async () => {
      try {
        const res = await fetch("/api/inventory/suggestions");
        const j = await res.json();
        if (!res.ok) return;
        setBranchSuggestions(Array.isArray(j.branches) ? j.branches : []);
        setQualitySuggestions(Array.isArray(j.qualities) ? j.qualities : []);
        setSignatureSuggestions(Array.isArray(j.signatures) ? j.signatures : []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

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
      { header: "Current stock", key: "currentStock", width: 12 },
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
        currentStock: String(row.currentStock ?? "—"),
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
  const filteredPurchases = useMemo(() => {
    const q = String(purchaseSearch || "")
      .trim()
      .toLowerCase();
    if (!q) return purchases;
    return purchases.filter((row) => {
      const hay = [
        row.mobileName,
        row.productName,
        row.quality,
        row.signatureName,
        row.salesCategoryName,
        row.notes,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [purchaseSearch, purchases]);
  const filteredPurchaseTotal = useMemo(
    () => filteredPurchases.reduce((sum, row) => sum + Number(row.lineTotal || 0), 0),
    [filteredPurchases]
  );
  const filteredPurchaseUnits = useMemo(
    () => filteredPurchases.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [filteredPurchases]
  );
  useEffect(() => {
    const allowed = new Set(filteredPurchases.map((row) => String(row._id)));
    setSelectedPurchaseIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [filteredPurchases]);
  const allPurchasesSelected = useMemo(
    () => filteredPurchases.length > 0 && selectedPurchaseIds.length === filteredPurchases.length,
    [filteredPurchases.length, selectedPurchaseIds.length]
  );
  const selectedPurchaseRows = useMemo(() => {
    if (!selectedPurchaseIds.length) return [];
    const idSet = new Set(selectedPurchaseIds);
    return purchases.filter((row) => idSet.has(String(row._id)));
  }, [purchases, selectedPurchaseIds]);
  const selectedPurchaseUnits = useMemo(
    () => selectedPurchaseRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    [selectedPurchaseRows]
  );
  const selectedPurchaseAmount = useMemo(
    () => selectedPurchaseRows.reduce((sum, row) => sum + Number(row.lineTotal || 0), 0),
    [selectedPurchaseRows]
  );

  const togglePurchaseSelection = useCallback((rowId) => {
    const id = String(rowId);
    setSelectedPurchaseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAllPurchases = useCallback(() => {
    setSelectedPurchaseIds((prev) => {
      if (filteredPurchases.length === 0) return [];
      if (prev.length === filteredPurchases.length) return [];
      return filteredPurchases.map((row) => String(row._id));
    });
  }, [filteredPurchases]);

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
    if (useGeniusCatalog) {
      setGeniusOpen(true);
      return;
    }
    const sig = String(form.signatureName || "").trim();
    if (!sig && !signaturePromptSkip) {
      setSignaturePromptValue("");
      setSignaturePromptOpen(true);
      return;
    }
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
      setSignatureManuallyEdited(false);
      setToast("Purchase saved · stock updated");
      await load();
    } catch (e) {
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitWithSignatureOverride() {
    setSignaturePromptOpen(false);
    const override = String(signaturePromptValue || "").trim();
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
          signatureName: override,
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
      setSignatureManuallyEdited(false);
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
          mobileName: editForm.mobileName,
          productName: editForm.productName,
          quality: editForm.quality,
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
    setSelectedPurchaseIds((prev) => prev.filter((x) => x !== String(row._id)));
    await load();
  }

  async function deleteSelectedPurchases() {
    if (!selectedPurchaseIds.length) return;
    if (!confirm(`Delete ${selectedPurchaseIds.length} selected purchase line(s)?`)) return;
    setBulkDeleting(true);
    try {
      const selectedSet = new Set(selectedPurchaseIds);
      const rows = filteredPurchases.filter((row) => selectedSet.has(String(row._id)));
      let okCount = 0;
      let failCount = 0;
      for (const row of rows) {
        const res = await fetch(`/api/inventory/parts-purchases/${row._id}`, { method: "DELETE" });
        if (res.ok) {
          okCount += 1;
        } else {
          failCount += 1;
        }
      }
      setSelectedPurchaseIds([]);
      await load();
      if (failCount === 0) {
        setToast(`${okCount} purchase line(s) deleted`);
      } else {
        setToast(`${okCount} deleted, ${failCount} failed`);
      }
    } catch (e) {
      setToast(e?.message || "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
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
      mobileName: row.mobileName || "",
      productName: row.productName || "",
      quality: row.quality || "",
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
          <div className="mt-1">
            <SuggestInput
              required
              value={form.quality}
              onChange={(next) => setForm((f) => ({ ...f, quality: next }))}
              suggestions={qualitySuggestions}
              placeholder="e.g. Original, Local…"
              className="min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Branch / brand name</label>
          <div className="mt-1">
            <SuggestInput
              required
              value={form.folderName}
              onChange={(next) => setForm((f) => ({ ...f, folderName: next }))}
              suggestions={branchSuggestions}
              placeholder="e.g. Oppo, Samsung (not the category above)"
              className="min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm disabled:bg-zinc-100 disabled:text-black/50"
              autoComplete="off"
              disabled={useGeniusCatalog}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-black/45">Model / product label</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="useGeniusCatalog"
              type="checkbox"
              checked={useGeniusCatalog}
              onChange={(e) => {
                const next = e.target.checked;
                setUseGeniusCatalog(next);
                if (next) setGeniusOpen(true);
              }}
              className="h-4 w-4 rounded border-black/25"
            />
            <label htmlFor="useGeniusCatalog" className="text-xs font-bold text-black/70">
              Use Genius battery catalog (checkbox list)
            </label>
          </div>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <textarea
              required={!useGeniusCatalog}
              value={form.modelNames}
              onChange={(e) =>
                setForm((f) => {
                  const nextModelNames = e.target.value;
                  const autoSignature = deriveSignatureFromProductLabel(nextModelNames);
                  return {
                    ...f,
                    modelNames: nextModelNames,
                    signatureName: signatureManuallyEdited ? f.signatureName : autoSignature,
                  };
                })
              }
              disabled={useGeniusCatalog}
              rows={3}
              placeholder="e.g. A23, Reno 12 (separate with comma or new line)"
              className="min-h-12 w-full flex-1 resize-y rounded-lg border border-black/15 px-3 py-2 text-sm leading-6 disabled:bg-zinc-100 disabled:text-black/50"
            />
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:justify-stretch">
              <button
                type="button"
                disabled={saving}
                onClick={() => setGeniusOpen(true)}
                className="min-h-12 rounded-lg bg-black px-3 text-xs font-bold text-brand disabled:opacity-50 sm:min-w-[7.5rem]"
              >
                Genius list
              </button>
              <button
                type="button"
                disabled={useGeniusCatalog || modelOcrBusy || saving || cameraBusy}
                onClick={openLiveCamera}
                className="min-h-12 rounded-lg border border-black/20 bg-zinc-50 px-3 text-xs font-bold text-black disabled:opacity-50 sm:min-w-[7.5rem]"
              >
                {cameraBusy ? "Opening…" : modelOcrBusy ? "Reading…" : "Take photo"}
              </button>
              <button
                type="button"
                disabled={useGeniusCatalog || modelOcrBusy || saving}
                onClick={() => modelGalleryInputRef.current?.click()}
                className="min-h-12 rounded-lg border border-black/20 bg-white px-3 text-xs font-bold text-black disabled:opacity-50 sm:min-w-[7.5rem]"
              >
                {modelOcrBusy ? "Reading…" : "Upload image"}
              </button>
            </div>
          </div>
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
            required={!useGeniusCatalog}
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            onWheel={(e) => e.currentTarget.blur()}
            inputMode="numeric"
            disabled={useGeniusCatalog}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm disabled:bg-zinc-100 disabled:text-black/50"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-black/45">Purchase price (unit)</label>
          <input
            required={!useGeniusCatalog}
            type="number"
            min={0}
            step={1}
            value={form.purchasePrice}
            onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
            onWheel={(e) => e.currentTarget.blur()}
            inputMode="numeric"
            disabled={useGeniusCatalog}
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm disabled:bg-zinc-100 disabled:text-black/50"
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
            onWheel={(e) => e.currentTarget.blur()}
            inputMode="numeric"
            className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-black/45">Signature name (this line)</label>
          <div className="mt-1">
            <SuggestInput
              value={form.signatureName}
              onChange={(next) => {
                setSignatureManuallyEdited(true);
                setForm((f) => ({ ...f, signatureName: next }));
              }}
              suggestions={signatureSuggestions}
              placeholder='e.g. a23 — shows this row when admin searches "a23" on dashboard'
              className="min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
            />
          </div>
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

      {cameraModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-base font-bold text-black">Take label photo</h3>
            <p className="mt-1 text-xs text-black/60">
              Capture inside browser to avoid page redirect in mobile private/incognito mode.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-black/15 bg-black">
              <video ref={liveCameraVideoRef} playsInline muted className="h-auto max-h-[60vh] w-full object-contain" />
            </div>
            {cameraError ? <p className="mt-2 text-xs text-red-600">{cameraError}</p> : null}
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="min-h-11 rounded-lg border border-black/20 px-4 text-sm font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureFromLiveCamera}
                className="min-h-11 rounded-lg bg-black px-4 text-sm font-bold text-brand"
              >
                Capture photo
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                    className="absolute h-5 w-5 touch-none rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x - 10}px`, top: `${ocrSelection.y - 10}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop top right"
                    onPointerDown={(e) => startCropInteraction(e, "resize-ne")}
                    className="absolute h-5 w-5 touch-none rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x + ocrSelection.w - 10}px`, top: `${ocrSelection.y - 10}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop bottom left"
                    onPointerDown={(e) => startCropInteraction(e, "resize-sw")}
                    className="absolute h-5 w-5 touch-none rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x - 10}px`, top: `${ocrSelection.y + ocrSelection.h - 10}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop bottom right"
                    onPointerDown={(e) => startCropInteraction(e, "resize-se")}
                    className="absolute h-5 w-5 touch-none rounded-full border-2 border-brand bg-white"
                    style={{ left: `${ocrSelection.x + ocrSelection.w - 10}px`, top: `${ocrSelection.y + ocrSelection.h - 10}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop top"
                    onPointerDown={(e) => startCropInteraction(e, "resize-n")}
                    className="absolute h-4 w-8 -translate-x-1/2 touch-none rounded-full border-2 border-brand bg-white/95"
                    style={{ left: `${ocrSelection.x + ocrSelection.w / 2}px`, top: `${ocrSelection.y - 8}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop right"
                    onPointerDown={(e) => startCropInteraction(e, "resize-e")}
                    className="absolute h-8 w-4 -translate-y-1/2 touch-none rounded-full border-2 border-brand bg-white/95"
                    style={{ left: `${ocrSelection.x + ocrSelection.w - 8}px`, top: `${ocrSelection.y + ocrSelection.h / 2}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop bottom"
                    onPointerDown={(e) => startCropInteraction(e, "resize-s")}
                    className="absolute h-4 w-8 -translate-x-1/2 touch-none rounded-full border-2 border-brand bg-white/95"
                    style={{ left: `${ocrSelection.x + ocrSelection.w / 2}px`, top: `${ocrSelection.y + ocrSelection.h - 8}px` }}
                  />
                  <button
                    type="button"
                    aria-label="Resize crop left"
                    onPointerDown={(e) => startCropInteraction(e, "resize-w")}
                    className="absolute h-8 w-4 -translate-y-1/2 touch-none rounded-full border-2 border-brand bg-white/95"
                    style={{ left: `${ocrSelection.x - 8}px`, top: `${ocrSelection.y + ocrSelection.h / 2}px` }}
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
      <div className="mt-2 max-w-md">
        <label className="text-xs font-bold text-black/45">Search purchases</label>
        <input
          type="search"
          value={purchaseSearch}
          onChange={(e) => setPurchaseSearch(e.target.value)}
          placeholder="Search model, branch, quality, signature..."
          className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
          autoComplete="off"
        />
      </div>
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
              <p className="mt-1 text-xs font-semibold text-black/60">
                Matched total: ₹{filteredPurchaseTotal.toLocaleString("en-IN")} · Units:{" "}
                {filteredPurchaseUnits.toLocaleString("en-IN")} · Rows: {filteredPurchases.length}
              </p>
              {selectedPurchaseIds.length ? (
                <p className="mt-1 text-xs font-semibold text-black/70">
                  Selected: {selectedPurchaseIds.length} · Units: {selectedPurchaseUnits.toLocaleString("en-IN")} ·
                  Amount: ₹{selectedPurchaseAmount.toLocaleString("en-IN")}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!selectedPurchaseIds.length || bulkDeleting}
                onClick={deleteSelectedPurchases}
                className="min-h-10 rounded-lg border border-red-300 bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
              >
                {bulkDeleting ? "Deleting…" : `Delete selected (${selectedPurchaseIds.length})`}
              </button>
              <DownloadExports
                filenameBase={`supplier_purchases_${supplier?.name || id}`}
                title="Supplier purchases"
                subtitle={supplier?.name || "Supplier"}
                metaLines={[`Rows: ${exportRows.length}`]}
                columns={exportColumns}
                rows={exportRows}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-zinc-50 text-xs font-bold uppercase text-black/45">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allPurchasesSelected}
                    onChange={toggleSelectAllPurchases}
                    aria-label="Select all purchase rows"
                    className="h-4 w-4 rounded border-black/25"
                  />
                </th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Branch</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Ledger category</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Signature name</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Current stock</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPurchases.map((row) => (
                <tr key={row._id}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedPurchaseIds.includes(String(row._id))}
                      onChange={() => togglePurchaseSelection(row._id)}
                      aria-label={`Select purchase ${row._id}`}
                      className="h-4 w-4 rounded border-black/25"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2">{row.mobileName}</td>
                  <td className="px-3 py-2 font-medium">{row.productName}</td>
                  <td className="px-3 py-2">{row.salesCategoryName || "—"}</td>
                  <td className="px-3 py-2">{row.quality}</td>
                  <td className="px-3 py-2 text-black/80">{row.signatureName?.trim() ? row.signatureName : "—"}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-700">
                    {row.currentStock == null ? "—" : row.currentStock}
                  </td>
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
          {filteredPurchases.length === 0 ? (
            <p className="p-6 text-center text-sm text-black/50">
              {purchases.length ? "No matching purchases." : "No purchases yet."}
            </p>
          ) : null}
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
                <label className="text-xs font-bold text-black/45">Branch / brand name</label>
                <div className="mt-1">
                  <SuggestInput
                    required
                    value={editForm.mobileName}
                    onChange={(next) => setEditForm((f) => ({ ...f, mobileName: next }))}
                    suggestions={branchSuggestions}
                    className="min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Model / product label</label>
                <input
                  required
                  value={editForm.productName}
                  onChange={(e) => setEditForm((f) => ({ ...f, productName: e.target.value }))}
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Quality</label>
                <div className="mt-1">
                  <SuggestInput
                    required
                    value={editForm.quality}
                    onChange={(next) => setEditForm((f) => ({ ...f, quality: next }))}
                    suggestions={qualitySuggestions}
                    className="min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                  />
                </div>
              </div>
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
                  onWheel={(e) => e.currentTarget.blur()}
                  inputMode="numeric"
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
                  onWheel={(e) => e.currentTarget.blur()}
                  inputMode="numeric"
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
                  onWheel={(e) => e.currentTarget.blur()}
                  inputMode="numeric"
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
                <div className="mt-1">
                  <SuggestInput
                    value={editForm.signatureName}
                    onChange={(next) => setEditForm((f) => ({ ...f, signatureName: next }))}
                    suggestions={signatureSuggestions}
                    placeholder="e.g. a23"
                    className="min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                  />
                </div>
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

      {geniusOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <form
            onSubmit={saveGeniusPurchases}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-black">Genius battery catalog</h3>
                <p className="mt-1 text-xs text-black/55">
                  Tick batteries and save purchase lines. This sets <strong>signature name</strong> to battery code so it
                  appears purchased in Genius Batteries page.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGeniusOpen(false);
                    setGeniusSelected([]);
                  }}
                  className="min-h-11 rounded-lg border border-black/20 px-4 text-sm font-semibold text-black"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving || geniusLoading || geniusSelected.length === 0}
                  className="min-h-11 rounded-lg bg-black px-4 text-sm font-bold text-brand disabled:opacity-50"
                >
                  {saving ? "Saving…" : `Save selected (${geniusSelected.length})`}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div>
                <label className="text-[11px] font-bold text-black/45">Brand filter</label>
                <select
                  value={geniusBrand}
                  onChange={(e) => setGeniusBrand(e.target.value)}
                  className="mt-1 min-h-11 rounded-lg border border-black/15 bg-white px-3 text-sm"
                >
                  <option value="">All</option>
                  {geniusBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[14rem]">
                <label className="text-[11px] font-bold text-black/45">Search</label>
                <input
                  type="search"
                  value={geniusQ}
                  onChange={(e) => setGeniusQ(e.target.value)}
                  placeholder="Search model or code…"
                  className="mt-1 min-h-11 w-full rounded-lg border border-black/15 px-3 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadGenius()}
                disabled={geniusLoading}
                className="min-h-11 rounded-lg bg-brand px-4 text-sm font-bold text-black disabled:opacity-50"
              >
                {geniusLoading ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-black/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-bold uppercase text-black/45">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={geniusItems.length > 0 && geniusSelected.length === geniusItems.length}
                        onChange={toggleGeniusSelectAll}
                        aria-label="Select all genius items"
                        className="h-4 w-4 rounded border-black/25"
                      />
                    </th>
                    <th className="px-3 py-2">Brand</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">List</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Purchase price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {geniusItems.map((it) => {
                    const key = String(it._id);
                    const edit = geniusEdits[key] || { quantity: "1", purchasePrice: String(Number(it.listPrice || 0)) };
                    return (
                      <tr key={key}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={geniusSelected.includes(key)}
                            onChange={() => toggleGeniusRow(key)}
                            aria-label={`Select ${it.brand} ${it.phoneModel}`}
                            className="h-4 w-4 rounded border-black/25"
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold">{it.brand}</td>
                        <td className="px-3 py-2">{it.phoneModel}</td>
                        <td className="px-3 py-2 font-mono text-xs">{it.batteryCode}</td>
                        <td className="px-3 py-2">₹{Number(it.listPrice || 0).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={edit.quantity}
                            onChange={(e) =>
                              setGeniusEdits((prev) => ({ ...prev, [key]: { ...edit, quantity: e.target.value } }))
                            }
                            className="min-h-10 w-20 rounded-lg border border-black/15 px-2 text-sm"
                            inputMode="numeric"
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            value={edit.purchasePrice}
                            onChange={(e) =>
                              setGeniusEdits((prev) => ({ ...prev, [key]: { ...edit, purchasePrice: e.target.value } }))
                            }
                            className="min-h-10 w-28 rounded-lg border border-black/15 px-2 text-sm"
                            inputMode="numeric"
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {geniusLoading ? <p className="p-4 text-sm text-black/55">Loading…</p> : null}
              {!geniusLoading && geniusItems.length === 0 ? (
                <p className="p-4 text-sm text-black/55">No catalog items found.</p>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {signaturePromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-black">Signature name (optional)</h3>
            <p className="mt-1 text-xs text-black/55">
              This helps search on dashboard (example: <strong>BLP-817</strong>, <strong>PIXEL 4A</strong>, <strong>a23</strong>).
              You can leave blank if you don’t want.
            </p>
            <div className="mt-4">
              <label className="text-xs font-bold text-black/45">Signature name</label>
              <input
                value={signaturePromptValue}
                onChange={(e) => setSignaturePromptValue(e.target.value)}
                placeholder="e.g. BLP-817"
                className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                autoComplete="off"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-black/70">
                <input
                  type="checkbox"
                  checked={signaturePromptSkip}
                  onChange={(e) => setSignaturePromptSkip(e.target.checked)}
                  className="h-4 w-4 rounded border-black/25"
                />
                Don’t ask again (allow blank)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSignaturePromptOpen(false)}
                  className="min-h-11 rounded-lg border border-black/20 px-4 text-sm font-semibold text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitWithSignatureOverride()}
                  className="min-h-11 rounded-lg bg-black px-4 text-sm font-bold text-brand"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {geniusMetaOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-black">Save Genius lines</h3>
            <p className="mt-1 text-xs text-black/55">
              Optional: enter a <strong>Signature name</strong> (stored on all selected lines) and/or override{" "}
              <strong>Quality</strong>. If you leave signature blank, it will be stored as blank.
            </p>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-bold text-black/45">Signature name (optional)</label>
                <input
                  value={geniusMetaSignature}
                  onChange={(e) => setGeniusMetaSignature(e.target.value)}
                  placeholder="e.g. BLP-817"
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black/45">Quality (required)</label>
                <input
                  value={geniusMetaQuality}
                  onChange={(e) => setGeniusMetaQuality(e.target.value)}
                  placeholder="e.g. Original"
                  className="mt-1 min-h-12 w-full rounded-lg border border-black/15 px-3 text-sm"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setGeniusMetaOpen(false)}
                className="min-h-11 rounded-lg border border-black/20 px-4 text-sm font-semibold text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveGeniusPurchases()}
                className="min-h-11 rounded-lg bg-black px-4 text-sm font-bold text-brand"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
