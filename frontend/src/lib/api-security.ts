import { NextResponse } from "next/server";
import { createServerSupabaseWithBearer } from "@/lib/server-supabase";

type RateBucket = { count: number; resetAt: number };
const apiRateStore = new Map<string, RateBucket>();

export function getBearerToken(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const xr = request.headers.get("x-real-ip")?.trim();
  return xff || xr || "unknown";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "";
}

export function checkApiRateLimit(params: {
  key: string;
  max: number;
  windowMs: number;
  message?: string;
}) {
  const now = Date.now();
  const existing = apiRateStore.get(params.key);
  const fresh = !existing || existing.resetAt <= now;
  const bucket: RateBucket = fresh
    ? { count: 1, resetAt: now + params.windowMs }
    : { count: existing.count + 1, resetAt: existing.resetAt };

  apiRateStore.set(params.key, bucket);

  if (bucket.count <= params.max) {
    return { ok: true as const, remaining: Math.max(params.max - bucket.count, 0) };
  }

  return {
    ok: false as const,
    response: NextResponse.json(
      {
        ok: false,
        error:
          params.message ||
          "Túl sok kérés rövid idő alatt. Kérlek próbáld újra kicsit később.",
      },
      { status: 429 }
    ),
  };
}

export async function requireUserFromRequest(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = createServerSupabaseWithBearer(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const, supabase, user: data.user };
}

export async function requireAdminFromRequest(
  request: Request,
  opts?: { requireAal2?: boolean }
) {
  const userRes = await requireUserFromRequest(request);
  if (!userRes.ok) return userRes;

  const { supabase } = userRes;
  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
  if (adminErr || !isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (opts?.requireAal2) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: "Admin 2FA megerősítés szükséges." },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true as const, supabase, user: userRes.user };
}

