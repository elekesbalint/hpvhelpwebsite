import { NextResponse } from "next/server";
import { trackServerPurchase } from "@/lib/analytics/server-purchase";

export async function POST(request: Request) {
  let body: {
    orderId?: string;
    fbp?: string;
    fbc?: string;
    eventSourceUrl?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  await trackServerPurchase(orderId, {
    clientIp,
    userAgent: request.headers.get("user-agent"),
    eventSourceUrl: body.eventSourceUrl ?? null,
    fbp: body.fbp ?? null,
    fbc: body.fbc ?? null,
  });

  return NextResponse.json({ ok: true });
}
