import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/api-security";
import { resetNatursoftExportFlag } from "@/lib/integrations/naturasoft/fetch-export";

export const dynamic = "force-dynamic";

/** Admin: rendelés NaturaSoft export jelölésének törlése (újra-import előtt). */
export async function POST(request: NextRequest) {
  const adminAuth = await requireAdminFromRequest(request);
  if (!adminAuth.ok) return adminAuth.response;

  let orderId: string | undefined;
  try {
    const body = (await request.json()) as { orderId?: string };
    orderId = body.orderId?.trim();
  } catch {
    orderId = undefined;
  }

  if (!orderId) {
    return NextResponse.json({ error: "Hiányzó orderId." }, { status: 400 });
  }

  try {
    await resetNatursoftExportFlag(orderId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ismeretlen hiba";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
