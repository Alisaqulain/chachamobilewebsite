"use client";

function safeText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function timestampLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

function normalizeFilenameBase(filenameBase) {
  const base = safeText(filenameBase).trim() || "export";
  return base
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

/**
 * columns: [{ header: string, key: string, width?: number }]
 * rows: array of objects, each cell resolved via row[key]
 */
export async function exportTableToExcel({ filenameBase, sheetName, columns, rows }) {
  const XLSX = await import("xlsx");

  const head = columns.map((c) => safeText(c.header));
  const body = (rows || []).map((r) => columns.map((c) => safeText(r?.[c.key])));
  const aoa = [head, ...body];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = columns.map((c) => ({
    wch: Math.max(8, Math.min(60, Number(c.width || 16))),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeText(sheetName || "Sheet1").slice(0, 31));

  const name = normalizeFilenameBase(filenameBase);
  const filename = `${name}_${timestampLocal()}.xlsx`;
  XLSX.writeFile(wb, filename, { compression: true });
}

export async function exportTableToPDF({ filenameBase, title, subtitle, metaLines, columns, rows }) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableModule.default || autoTableModule.autoTable;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const left = 40;
  let y = 44;
  const t = safeText(title);
  const st = safeText(subtitle);

  if (t) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(t, left, y);
    y += 18;
  }

  if (st) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(st, left, y);
    y += 14;
  }

  const metas = (metaLines || []).map(safeText).filter(Boolean);
  if (metas.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    metas.forEach((m) => {
      doc.text(m, left, y);
      y += 12;
    });
    y += 6;
  }

  const head = [columns.map((c) => safeText(c.header))];
  const body = (rows || []).map((r) => columns.map((c) => safeText(r?.[c.key])));

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: "bold" },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, overflow: "linebreak" },
    margin: { left, right: left },
  });

  const name = normalizeFilenameBase(filenameBase);
  const filename = `${name}_${timestampLocal()}.pdf`;
  doc.save(filename);
}

