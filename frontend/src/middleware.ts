import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_RATE_MAX = 40;
const ADMIN_LOGIN_RATE_PATHS = [
  "/api/admin/security/prelogin",
  "/api/admin/security/login-result",
];

type RateBucket = { count: number; resetAt: number };
const rateStore = new Map<string, RateBucket>();

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const xr = request.headers.get("x-real-ip")?.trim();
  return xff || xr || "unknown";
}

function checkAdminLoginRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!ADMIN_LOGIN_RATE_PATHS.some((p) => pathname.startsWith(p))) return null;

  const ip = getClientIp(request);
  const key = `${pathname}:${ip}`;
  const now = Date.now();
  const existing = rateStore.get(key);
  const fresh = !existing || existing.resetAt <= now;
  const bucket: RateBucket = fresh
    ? { count: 1, resetAt: now + ADMIN_LOGIN_RATE_WINDOW_MS }
    : { count: existing.count + 1, resetAt: existing.resetAt };

  rateStore.set(key, bucket);

  if (bucket.count <= ADMIN_LOGIN_RATE_MAX) return null;
  return NextResponse.json(
    {
      ok: false,
      error:
        "Túl sok bejelentkezési kísérlet. Kérlek várj 15 percet, majd próbáld újra.",
    },
    { status: 429 }
  );
}

const BYPASS_PATHS = [
  "/maintenance",
  "/aszf",
  "/adatvedelmi",
  "/admin",
  "/api",
  "/_next",
  "/favicon",
  "/bankcards",
  "/simplepay",
  "/logo-",
];

const MAINTENANCE_PREVIEW_COOKIE = "maintenance_preview";
const MAINTENANCE_PREVIEW_QUERY = "maintenance_preview";
const MAINTENANCE_KEY_QUERY = "maintenance_key";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const response = NextResponse.next();

  const rateLimitResponse = checkAdminLoginRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Karbantartói előnézet cookie beállítása/törlése kulcs alapján
  const previewParam = searchParams.get(MAINTENANCE_PREVIEW_QUERY);
  if (previewParam !== null) {
    const redirectUrl = new URL(pathname, request.url);
    const maintenanceBypassKey = process.env.MAINTENANCE_BYPASS_KEY?.trim();
    const providedKey = searchParams.get(MAINTENANCE_KEY_QUERY)?.trim();

    if (
      previewParam === "1" &&
      maintenanceBypassKey &&
      providedKey === maintenanceBypassKey
    ) {
      const withPreview = NextResponse.redirect(redirectUrl);
      withPreview.cookies.set(MAINTENANCE_PREVIEW_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return withPreview;
    }

    if (previewParam === "0") {
      const withoutPreview = NextResponse.redirect(redirectUrl);
      withoutPreview.cookies.delete(MAINTENANCE_PREVIEW_COOKIE);
      return withoutPreview;
    }
  }

  // Admin és statikus fájlok átengedése
  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    return response;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return NextResponse.next();

    const res = await fetch(
      `${supabaseUrl}/rest/v1/app_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        // 2mp cache — nem terheli a DB-t minden requestnél
        next: { revalidate: 2 },
      }
    );

    if (res.ok) {
      const [row] = (await res.json()) as Array<{ value: boolean }>;
      const hasMaintenancePreview = request.cookies.get(MAINTENANCE_PREVIEW_COOKIE)?.value === "1";
      if (row?.value === true && pathname !== "/maintenance" && !hasMaintenancePreview) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  } catch {
    // Ha a DB nem elérhető, az oldal normálisan tölt be
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
