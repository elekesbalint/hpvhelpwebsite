"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      if (!sessionUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        router.replace("/admin");
      }
    });
  }, [router]);

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
        setError(loginError.message || "Hibás email cím vagy jelszó.");
        return;
      }

      if (!data.session?.user) {
        setError("A bejelentkezés nem sikerült. Kérlek próbáld újra.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError("Nincs admin jogosultságod ehhez a felülethez.");
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">HPVHelp Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Admin belépés</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Kizárólag admin felhasználók számára.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-300">
                Admin email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.hu"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-300">
                Jelszó
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-400/20"
              />
            </div>

            {error ? (
              <div className="animate-fade-up rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-press w-full rounded-xl bg-brand-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-950/30 transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Belépés...
                </span>
              ) : "Belépés az admin felületre"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Nem admin vagy?{" "}
          <a href="/" className="text-slate-400 hover:text-brand-600 transition">
            Vissza a főoldalra
          </a>
        </p>
      </div>
    </div>
  );
}
