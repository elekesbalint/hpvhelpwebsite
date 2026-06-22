import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getClientIp, getUserAgent } from "@/lib/api-security";
import { createServiceSupabase } from "@/lib/server-supabase";

const ALERT_THRESHOLD = 5;
const ALERT_WINDOW_MINUTES = 15;

function fromHeader(): string {
  return process.env.RESEND_FROM?.trim() || "HPVhelp <onboarding@resend.dev>";
}

function adminEmail(): string | null {
  return process.env.ADMIN_EMAIL?.trim() || process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim() || null;
}

async function sendAdminAlert(params: {
  email: string;
  ip: string;
  userAgent: string;
  failures: number;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = adminEmail();
  if (!apiKey || !to) return;

  const resend = new Resend(apiKey);
  const now = new Date().toLocaleString("hu-HU");
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#fdf8f8;padding:24px;color:#1e293b">
    <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #fecaca;border-radius:12px;padding:20px">
      <h1 style="margin:0 0 12px;color:#7f1d1d;font-size:20px">Admin belépési riasztás</h1>
      <p>Az admin panelen rövid idő alatt több sikertelen belépési kísérlet történt.</p>
      <p><strong>Email:</strong> ${params.email}<br/>
      <strong>IP:</strong> ${params.ip}<br/>
      <strong>Sikertelen próbálkozások:</strong> ${params.failures} (15 perc)<br/>
      <strong>Időpont:</strong> ${now}</p>
      <p><strong>User-Agent:</strong><br/>${params.userAgent || "ismeretlen"}</p>
      <p>Ha ez nem volt tervezett, érdemes admin jelszót cserélni és az aktív sessionöket megszakítani.</p>
    </div>
  </body></html>`;

  await resend.emails.send({
    from: fromHeader(),
    to,
    subject: `Riasztás: ${params.failures} sikertelen admin belépés`,
    html,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: string; success?: boolean; reason?: string }
      | null;
    const email = body?.email?.trim().toLowerCase() || "";
    const success = Boolean(body?.success);
    const reason = body?.reason?.trim() || null;
    if (!email) {
      return NextResponse.json({ ok: false, error: "Hiányzó email." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY hiányzik." },
        { status: 500 }
      );
    }

    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);
    const { data: inserted, error: insertError } = await supabase
      .from("admin_login_attempts")
      .insert({
        email,
        ip,
        user_agent: userAgent,
        success,
        reason,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: "Nem sikerült naplózni a bejelentkezést." },
        { status: 500 }
      );
    }

    if (success) return NextResponse.json({ ok: true });

    const since = new Date(Date.now() - ALERT_WINDOW_MINUTES * 60_000).toISOString();
    const [{ count: failureCount }, { count: recentAlerts }] = await Promise.all([
      supabase
        .from("admin_login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .eq("success", false)
        .gte("created_at", since),
      supabase
        .from("admin_login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .eq("alert_sent", true)
        .gte("created_at", since),
    ]);

    if ((failureCount || 0) >= ALERT_THRESHOLD && (recentAlerts || 0) === 0) {
      await sendAdminAlert({
        email,
        ip,
        userAgent,
        failures: failureCount || 0,
      });
      await supabase
        .from("admin_login_attempts")
        .update({ alert_sent: true })
        .eq("id", inserted.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "Váratlan hiba a login naplózás során.", detail },
      { status: 500 }
    );
  }
}

