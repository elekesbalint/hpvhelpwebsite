"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteLogo from "@/components/SiteLogo";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const emailValue = String(formData.get("email") ?? email).trim();
    const passwordValue = String(formData.get("password") ?? password);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (!data.session?.user) {
        setError("A bejelentkezés nem sikerült. Kérlek próbáld újra.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Hálózati hiba történt. Kérlek próbáld újra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-scale-in">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <SiteLogo size="md" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bejelentkezés</h1>
          <p className="mt-1.5 text-sm text-red-950/60">Üdvözlünk!</p>
        </div>

        <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-lg shadow-brand-100/40">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email cím
              </label>
              <input
                id="email"
                name="email"
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
                Jelszó
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
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
                  Bejelentkezés...
                </span>
              ) : "Bejelentkezés"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-red-950/60">
            Nincs még fiókod?{" "}
            <Link href="/register" className="font-semibold text-brand-800 hover:text-brand-900 transition underline underline-offset-2">
              Regisztrálj ingyen
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center px-4 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-800" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
