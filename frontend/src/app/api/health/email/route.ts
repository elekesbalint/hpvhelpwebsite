import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Ellenőrzi, hogy a Vercel / szerver környezetben be vannak-e állítva az emailhez szükséges változók.
 * Nem tartalmaz titkot; segít kideríteni, miért mutat a Resend 0 API hívást.
 */
export async function GET(request: Request) {
  const requiredSecret = process.env.EMAIL_HEALTH_SECRET?.trim();
  if (requiredSecret) {
    const headerSecret = request.headers.get("x-health-secret")?.trim();
    const querySecret = new URL(request.url).searchParams.get("secret")?.trim();
    if (headerSecret !== requiredSecret && querySecret !== requiredSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const resendApiKeyConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const resendFromConfigured = Boolean(process.env.RESEND_FROM?.trim());
  const adminEmailConfigured = Boolean(
    process.env.ADMIN_EMAIL?.trim() || process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim()
  );
  const supabaseServiceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const supabaseUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

  const allOk =
    resendApiKeyConfigured &&
    resendFromConfigured &&
    supabaseServiceRoleConfigured &&
    supabaseUrlConfigured;

  const hints: string[] = [];
  if (!resendApiKeyConfigured) hints.push("RESEND_API_KEY hiányzik → Resend nem küld semmit");
  if (!resendFromConfigured) hints.push("RESEND_FROM hiányzik → alapértelmezett onboarding@resend.dev lesz a feladó");
  if (!supabaseServiceRoleConfigured) hints.push("SUPABASE_SERVICE_ROLE_KEY hiányzik → SimplePay fizetés utáni email (finalize) nem fut, mert createServiceSupabase() null-t ad vissza");
  if (!supabaseUrlConfigured) hints.push("NEXT_PUBLIC_SUPABASE_URL hiányzik");

  return NextResponse.json({
    ok: allOk,
    resendApiKeyConfigured,
    resendFromConfigured,
    adminEmailConfigured,
    supabaseServiceRoleConfigured,
    supabaseUrlConfigured,
    hints: hints.length ? hints : ["Minden változó be van állítva."],
  });
}
