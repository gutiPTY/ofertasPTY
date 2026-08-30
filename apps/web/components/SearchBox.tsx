"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted lg:flex"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar ofertas…"
        className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
      />
    </form>
  );
}
