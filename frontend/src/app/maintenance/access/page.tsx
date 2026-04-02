"use client";

import { FormEvent, useState } from "react";

export default function MaintenanceAccessPage() {
  const [key, setKey] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({
      maintenance_preview: "1",
      maintenance_key: key.trim(),
    });
    window.location.href = `/?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-brand-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Karbantartói hozzáférés</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Teljes oldal előnézet karbantartás alatt</h1>
        <p className="mt-2 text-sm text-red-950/70">
          Add meg a karbantartói kulcsot. Sikeres megadás után csak ezen a böngészőn látod a teljes oldalt.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Karbantartói kulcs</label>
          <input
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="Pl.: nagyon-hosszu-titkos-kulcs"
            className="w-full rounded-xl border border-brand-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            required
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Előnézet bekapcsolása
          </button>
        </form>

        <p className="mt-4 text-xs text-red-950/60">
          Kikapcsolás: nyisd meg ezt az URL-t: <span className="font-mono">/?maintenance_preview=0</span>
        </p>
      </div>
    </main>
  );
}
