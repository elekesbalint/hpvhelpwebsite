"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminVerify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(t);
  }, [error]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError || !factors?.totp?.length) {
        setError("Nem található TOTP faktor. Lépj be újra.");
        return;
      }

      const factorId = factors.totp[0].id;
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) {
        setError("Nem sikerült elindítani a 2FA ellenőrzést.");
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.replace(/\s/g, ""),
      });

      if (verifyError) {
        setError("Hibás kód. Ellenőrizd az authenticator appot és próbáld újra.");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      router.replace("/admin");
    } catch {
      setError("Hálózati hiba történt. Kérlek próbáld újra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 shadow-lg shadow-brand-950/30">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">HPVhelp Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Kétlépéses azonosítás</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Add meg az authenticator appban megjelenő 6 jegyű kódot.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label htmlFor="code" className="mb-1.5 block text-sm font-semibold text-slate-300">
                Hitelesítési kód
              </label>
              <input
                ref={inputRef}
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-slate-600 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-400/20"
              />
              <p className="mt-1.5 text-xs text-slate-500">Google Authenticator, Authy vagy más TOTP app</p>
            </div>

            {error ? (
              <div className="animate-fade-up rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-press w-full rounded-xl bg-brand-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-950/30 transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Ellenőrzés...
                </span>
              ) : "Megerősítés"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <button
            onClick={() => { void supabase.auth.signOut().then(() => router.replace("/admin/login")); }}
            className="text-slate-400 hover:text-brand-600 transition"
          >
            ← Vissza a bejelentkezéshez
          </button>
        </p>
      </div>
    </div>
  );
}
