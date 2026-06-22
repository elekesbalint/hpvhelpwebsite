"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  enrollTotpFactor,
  listVerifiedTotpFactors,
  unenrollAllTotpFactors,
  verifyTotpCode,
} from "@/lib/admin-mfa";

type Step = "idle" | "confirm" | "scan" | "verify" | "done";

export default function AdminBeallitasokPage() {
  const [step, setStep] = useState<Step>("idle");
  const [currentFactorId, setCurrentFactorId] = useState("");
  const [newFactorId, setNewFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [hasTotp, setHasTotp] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void listVerifiedTotpFactors()
      .then((factors) => setHasTotp(factors.length > 0))
      .catch(() => setHasTotp(false));
  }, []);

  useEffect(() => {
    if (step === "confirm" || step === "verify") inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(t);
  }, [error]);

  async function startReset() {
    setError(null);
    setLoading(true);
    try {
      const factors = await listVerifiedTotpFactors();
      if (factors.length === 0) {
        setError("Nincs aktív 2FA – használd a bejelentkezés utáni 2FA beállítást.");
        return;
      }
      setCurrentFactorId(factors[0].id);
      setCurrentCode("");
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nem sikerült betölteni a 2FA adatokat.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCurrent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyTotpCode(currentFactorId, currentCode);
      await unenrollAllTotpFactors();
      const enrolled = await enrollTotpFactor();
      setNewFactorId(enrolled.factorId);
      setQrCode(enrolled.qrCode);
      setSecret(enrolled.secret);
      setNewCode("");
      setStep("scan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Az ellenőrzés sikertelen.");
      setCurrentCode("");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyTotpCode(newFactorId, newCode);
      setStep("done");
      setHasTotp(true);
      setTimeout(() => setStep("idle"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Az ellenőrzés sikertelen.");
      setNewCode("");
    } finally {
      setLoading(false);
    }
  }

  function cancelReset() {
    setStep("idle");
    setCurrentCode("");
    setNewCode("");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Beállítások</h1>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">Kétlépcsős azonosítás (2FA)</h2>
            <p className="mt-1 text-sm text-red-950/65">
              Google Authenticator / Authy app 6 jegyű kóddal. Új QR kód generálásakor a régi app-bejegyzés nem fog
              működni – töröld onnan, és olvasd be az újat.
            </p>
            {hasTotp === true ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">2FA aktív</p>
            ) : hasTotp === false ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">2FA nincs beállítva</p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        {step === "idle" ? (
          <div className="mt-5">
            <button
              type="button"
              disabled={loading || hasTotp === false}
              onClick={() => void startReset()}
              className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Új 2FA kód generálása
            </button>
            {hasTotp === false ? (
              <p className="mt-2 text-xs text-red-950/55">Először jelentkezz be és állítsd be a 2FA-t a bejelentkezés után.</p>
            ) : null}
          </div>
        ) : null}

        {step === "confirm" ? (
          <form onSubmit={handleConfirmCurrent} className="mt-5 space-y-4">
            <p className="text-sm text-red-950/75">
              Biztonsági okból add meg a <strong>jelenlegi</strong> authenticator kódodat:
            </p>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full max-w-xs rounded-xl border border-brand-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={cancelReset}
                className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-red-950/70 transition hover:bg-brand-50"
              >
                Mégse
              </button>
              <button
                type="submit"
                disabled={loading || currentCode.length !== 6}
                className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-50"
              >
                {loading ? "Ellenőrzés…" : "Tovább – új QR kód"}
              </button>
            </div>
          </form>
        ) : null}

        {step === "scan" ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-red-950/75">Olvasd be az új QR kódot az authenticator appban:</p>
            {qrCode ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
                  <img src={qrCode} alt="Új 2FA QR kód" className="h-44 w-44" />
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-xs font-semibold text-brand-800 underline-offset-2 hover:underline"
            >
              {showSecret ? "Titkos kulcs elrejtése" : "Titkos kulcs megjelenítése (manuális bevitel)"}
            </button>
            {showSecret ? (
              <code className="block break-all rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2 text-sm text-brand-900">
                {secret}
              </code>
            ) : null}
            <button
              type="button"
              onClick={() => setStep("verify")}
              className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
            >
              Beolvastam, kód megadása →
            </button>
          </div>
        ) : null}

        {step === "verify" ? (
          <form onSubmit={handleVerifyNew} className="mt-5 space-y-4">
            <p className="text-sm text-red-950/75">Add meg az <strong>új</strong> appban megjelenő 6 jegyű kódot:</p>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full max-w-xs rounded-xl border border-brand-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep("scan")}
                className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-red-950/70 transition hover:bg-brand-50"
              >
                ← Vissza
              </button>
              <button
                type="submit"
                disabled={loading || newCode.length !== 6}
                className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-50"
              >
                {loading ? "Aktiválás…" : "Új 2FA aktiválása"}
              </button>
            </div>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Az új 2FA kód sikeresen aktiválva. A régi app-bejegyzést törölheted.
          </div>
        ) : null}
      </section>
    </div>
  );
}
