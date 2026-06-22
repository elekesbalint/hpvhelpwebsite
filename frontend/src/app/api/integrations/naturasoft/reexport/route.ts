import { NextRequest, NextResponse } from "next/server";
import { fetchNatursoftExportXml } from "@/lib/integrations/naturasoft/fetch-export";

export const dynamic = "force-dynamic";

function authorize(request: NextRequest): boolean {
  const token = process.env.NATURASOFT_EXPORT_TOKEN?.trim();
  if (!token) return false;

  const queryToken = request.nextUrl.searchParams.get("token")?.trim();
  if (queryToken && queryToken === token) return true;

  const header = request.headers.get("authorization")?.trim();
  if (header?.startsWith("Bearer ") && header.slice(7).trim() === token) return true;

  return false;
}

/**
 * NaturaSoft újra-import: már exportált paid/fulfilled rendelések is (nem jelöli újra exportáltnak).
 * A program gyakran nem küldi tovább az URL ? utáni paramétereket — ezért külön végpont.
 */
export async function GET(request: NextRequest) {
  if (!process.env.NATURASOFT_EXPORT_TOKEN?.trim()) {
    return NextResponse.json({ error: "NATURASOFT_EXPORT_TOKEN nincs beállítva." }, { status: 503 });
  }

  if (!authorize(request)) {
    return NextResponse.json({ error: "Érvénytelen vagy hiányzó token." }, { status: 401 });
  }

  try {
    const result = await fetchNatursoftExportXml({
      includeExported: true,
      markExported: false,
    });

    return new NextResponse(result.xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Export-Count": String(result.count),
        "X-Export-Mode": "reexport",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ismeretlen hiba";
    console.error("[naturasoft/reexport]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
