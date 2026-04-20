"use client";

import { useMemo, useState } from "react";
import { exportTableToExcel, exportTableToPDF } from "@/lib/tableExport.client";

export default function DownloadExports({
  filenameBase,
  title,
  subtitle,
  metaLines,
  columns,
  rows,
  className = "",
  size = "sm",
}) {
  const [busy, setBusy] = useState(false);

  const disabled = busy || !rows?.length;
  const btnClass = useMemo(() => {
    const base =
      "inline-flex items-center justify-center rounded-full font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
    if (size === "md") return `${base} min-h-11 px-5 text-sm`;
    return `${base} min-h-10 px-4 text-xs`;
  }, [size]);

  async function onPDF() {
    setBusy(true);
    try {
      await exportTableToPDF({ filenameBase, title, subtitle, metaLines, columns, rows });
    } finally {
      setBusy(false);
    }
  }

  async function onExcel() {
    setBusy(true);
    try {
      await exportTableToExcel({
        filenameBase,
        sheetName: title || "Export",
        columns,
        rows,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={onPDF}
        disabled={disabled}
        className={`${btnClass} border border-black/15 bg-white text-black hover:bg-zinc-50`}
      >
        {busy ? "Preparing…" : "Download PDF"}
      </button>
      <button
        type="button"
        onClick={onExcel}
        disabled={disabled}
        className={`${btnClass} bg-brand text-black hover:brightness-[0.98]`}
      >
        {busy ? "Preparing…" : "Download Excel"}
      </button>
      {!rows?.length ? <span className="text-xs text-black/45">No rows to export</span> : null}
    </div>
  );
}

