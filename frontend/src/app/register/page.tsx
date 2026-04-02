"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { error: registerError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setLoading(false);

    if (registerError) {
      setError(registerError.message);
      return;
    }

    setSuccess("Sikeres regisztráció! Ellenőrizd az email fiókodat a megerősítéshez.");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 shadow-lg shadow-brand-200" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-800">HPVHelp Webshop</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Regisztráció</h1>
          <p className="mt-1.5 text-sm text-red-950/60">
            Hozz létre ingyenes fiókot a vásárláshoz.
          </p>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-lg shadow-brand-100/40">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Teljes név
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Kovács Anna"
                className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email cím
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="pelda@email.hu"
                className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Jelszó <span className="font-normal text-red-950/50">(min. 6 karakter)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
              />
            </div>

            {error ? (
              <div className="animate-fade-up rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="animate-fade-up rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-100">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full rounded-xl bg-brand-900 px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-800 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Regisztráció...
                </span>
              ) : "Fiók létrehozása"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-red-950/60">
            Már van fiókod?{" "}
            <Link href="/login" className="font-semibold text-brand-800 hover:text-brand-900 transition underline underline-offset-2">
              Bejelentkezés
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-red-950/40">
          <Link href="/" className="hover:text-brand-800 transition">← Vissza a főoldalra</Link>
        </p>
      </div>
    </div>
  );
}
