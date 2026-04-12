"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

export default function SearchBar({ placeholder = "Search by name or model…" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("search") || "");
  const [pending, startTransition] = useTransition();

  const submit = useCallback(
    (e) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      const term = q.trim();
      if (term) params.set("search", term);
      else params.delete("search");
      startTransition(() => {
        router.push(`/shop?${params.toString()}`);
      });
    },
    [q, router, searchParams]
  );

  return (
    <form onSubmit={submit} className="flex w-full gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm text-black shadow-inner outline-none ring-[#FFA500] placeholder:text-black/40 focus:border-[#FFA500] focus:ring-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-[#FFA500] transition hover:bg-black/90 disabled:opacity-60"
      >
        Search
      </button>
    </form>
  );
}
