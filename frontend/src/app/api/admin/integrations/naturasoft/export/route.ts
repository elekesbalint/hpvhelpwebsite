import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/api-security";
import { fetchNatursoftExportXml } from "@/lib/integrations/naturasoft/fetch-export";

export const dynamic = "force-dynamic";

/** Admin: NaturaSoft XML előnézet (nem jelöli exportáltnak). */
export async function GET(request: NextRequest) {
  const adminAuth = await requireAdminFromRequest(request);
  if (!adminAuth.ok) return adminAuth.response;

  const markExported = request.nextUrl.searchParams.get("mark") === "1";
  const orderId = request.nextUrl.searchParams.get("order_id")?.trim();

  try {
    const result = await fetchNatursoftExportXml({
      includeExported: request.nextUrl.searchParams.get("include_exported") === "1",
      markExported,
      orderIds: orderId ? [orderId] : undefined,
    });

    return new NextResponse(result.xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="naturasoft-export-${result.count}.xml"`,
        "X-Export-Count": String(result.count),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ismeretlen hiba";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
