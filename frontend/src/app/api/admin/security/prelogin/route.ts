import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/api-security";
import { createServiceSupabase } from "@/lib/server-supabase";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const FAILED_WINDOW_MINUTES = 15;
const FAILED_MAX_ATTEMPTS = 8;

async function verifyTurnstile(
  token: string,
  remoteip: string
): Promise<{ ok: boolean; detail?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: false, detail: "TURNSTILE_SECRET_KEY hiányzik." };

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  form.set("remoteip", remoteip);

  const resp = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  if (!resp.ok) return { ok: false, detail: `Turnstile HTTP ${resp.status}` };
  const json = (await resp.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };
  if (!json.success) {
    return { ok: false, detail: `Turnstile error: ${(json["error-codes"] || []).join(", ") || "unknown"}` };
  }
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: string; turnstileToken?: string }
      | null;
    const email = body?.email?.trim().toLowerCase() || "";
    const turnstileToken = body?.turnstileToken?.trim() || "";

    if (!email || !turnstileToken) {
      return NextResponse.json(
        { ok: false, error: "Hiányzó email vagy Turnstile token." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const turnstile = await verifyTurnstile(turnstileToken, ip);
    if (!turnstile.ok) {
      return NextResponse.json(
        { ok: false, error: "Captcha ellenőrzés sikertelen.", detail: turnstile.detail },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY hiányzik." },
        { status: 500 }
      );
    }

    const since = new Date(Date.now() - FAILED_WINDOW_MINUTES * 60_000).toISOString();
    const [{ count: byEmail }, { count: byIp }] = await Promise.all([
      supabase
        .from("admin_login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("success", false)
        .eq("email", email)
        .gte("created_at", since),
      supabase
        .from("admin_login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("success", false)
        .eq("ip", ip)
        .gte("created_at", since),
    ]);

    if ((byEmail || 0) >= FAILED_MAX_ATTEMPTS || (byIp || 0) >= FAILED_MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Túl sok sikertelen bejelentkezési kísérlet. Próbáld újra 15 perc múlva.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "Váratlan hiba a belépési ellenőrzés során.", detail },
      { status: 500 }
    );
  }
}

