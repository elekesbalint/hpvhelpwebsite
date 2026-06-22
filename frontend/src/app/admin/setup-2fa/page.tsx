"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminSetup2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<"loading" | "scan" | "verify" | "done">("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { router.replace("/admin/login"); return; }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError || !data) {
        setError("Nem sikerült elindítani a 2FA beállítást: " + (enrollError?.message ?? "ismeretlen hiba"));
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("scan");
    })();
  }, [router]);

  useEffect(() => {
    if (step === "verify") inputRef.current?.focus();
  }, [step]);

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
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) {
        setError("Nem sikerült elindítani az ellenőrzést.");
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

      setStep("done");
      setTimeout(() => router.replace("/admin"), 2000);
    } catch {
      setError("Hálózati hiba történt.");
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">HPVhelp Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">2FA beállítása</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Az admin panel védelméhez kétlépéses azonosítás szükséges.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">

          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <svg className="h-8 w-8 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-sm text-slate-400">QR kód generálása...</p>
            </div>
          )}

          {/* Step 1: Scan QR */}
          {step === "scan" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">1</span>
                <p className="text-sm text-slate-300">Töltsd le a <strong className="text-white">Google Authenticator</strong> vagy <strong className="text-white">Authy</strong> appot a telefonodra.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">2</span>
                <p className="text-sm text-slate-300">Olvasd be az alábbi QR kódot az appban:</p>
              </div>

              {qrCode && (
                <div className="flex justify-center">
                  <div className="rounded-2xl bg-white p-4 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="2FA QR kód" className="h-44 w-44" />
                  </div>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  {showSecret ? "▲ Elrejtés" : "▼ Manuális beírás (nem olvasható be a QR)"}
                </button>
                {showSecret && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Titkos kulcs:</p>
                    <code className="text-sm text-brand-400 break-all">{secret}</code>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep("verify")}
                className="btn-press w-full rounded-xl bg-brand-800 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700"
              >
                Beolvastam, tovább →
              </button>
            </div>
          )}

          {/* Step 2: Verify */}
          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">3</span>
                <p className="text-sm text-slate-300">Add meg az appban megjelenő 6 jegyű kódot a megerősítéshez:</p>
              </div>

              <input
                ref={inputRef}
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

              {error ? (
                <div className="animate-fade-up rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("scan")}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5"
                >
                  ← Vissza
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="btn-press flex-1 rounded-xl bg-brand-800 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Ellenőrzés...
                    </span>
                  ) : "2FA aktiválása"}
                </button>
              </div>
            </form>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">2FA sikeresen beállítva!</p>
              <p className="text-sm text-slate-400">Átirányítás az admin felületre...</p>
            </div>
          )}

          {error && step !== "verify" ? (
            <div className="mt-4 animate-fade-up rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <button
            onClick={() => { void supabase.auth.signOut().then(() => router.replace("/admin/login")); }}
            className="text-slate-400 hover:text-brand-600 transition"
          >
            ← Kijelentkezés
          </button>
        </p>
      </div>
    </div>
  );
}
