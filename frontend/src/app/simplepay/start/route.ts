import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseWithBearer } from "@/lib/server-supabase";
import { createSimplePaySignature, getSimplePayConfig, simplePayJsonStringify, simplePaySalt } from "@/lib/simplepay";

type StartBody = {
  orderId?: string;
};

function parseAddressParts(address: string | null): { zip: string; city: string; street: string } {
  if (!address) return { zip: "0000", city: "Budapest", street: "" };
  // Format: "1011 Budapest, Petőfi S. 3."
  const match = address.match(/^(\d{4})\s+([^,]+),\s*(.+)$/);
  if (match) {
    return { zip: match[1].trim(), city: match[2].trim(), street: match[3].trim() };
  }
  return { zip: "0000", city: "Budapest", street: address };
}

function normalizeSimpleText(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .,\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || fallback;
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });

    const body = (await request.json()) as StartBody;
    if (!body.orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

    const supabase = createServerSupabaseWithBearer(token);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, user_id, status, total, currency, shipping_email, payment_provider, shipping_name, shipping_phone, shipping_address, billing_name, billing_address"
      )
      .eq("id", body.orderId)
      .maybeSingle();

    if (orderError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_provider !== "simplepay") {
      return NextResponse.json({ error: "Order payment provider is not SimplePay." }, { status: 400 });
    }

    if (order.status === "paid" || order.status === "fulfilled" || order.status === "refunded") {
      return NextResponse.json(
        { error: "Ez a rendelés már kifizetve vagy lezárva; a kártyás fizetés nem indítható újra." },
        { status: 400 }
      );
    }

    if (order.status === "cancelled") {
      const { error: reopenError } = await supabase
        .from("orders")
        .update({ status: "pending" })
        .eq("id", order.id)
        .eq("payment_provider", "simplepay");
      if (reopenError) {
        return NextResponse.json({ error: reopenError.message }, { status: 400 });
      }
    }

    const config = getSimplePayConfig();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://hpvhelp.hu").replace(/\/+$/, "");
    const timeoutAt = new Date(Date.now() + 30 * 60 * 1000);
    const timeoutStr = timeoutAt.toISOString().replace(/\.\d{3}Z$/, "+00:00");
    const orderRef = `ORDER_${order.id}`;

    const billingAddr = parseAddressParts(order.billing_address ?? order.shipping_address);
    const totalInt = Math.round(Number(order.total));

    // Telefon formátum: csak számok, docs példához hasonlóan.
    const phoneDigits = (order.shipping_phone ?? "").replace(/\D/g, "");
    const invoiceZip = /^\d{4}$/.test(billingAddr.zip) ? billingAddr.zip : "1111";
    const invoiceCity = normalizeSimpleText(billingAddr.city, "Budapest");
    const invoiceStreet = normalizeSimpleText(billingAddr.street, "Address 1");
    const invoiceName = normalizeSimpleText(order.billing_name ?? order.shipping_name ?? "SimplePay V2 Tester", "SimplePay V2 Tester").slice(0, 45);
    const invoicePhone = phoneDigits.length >= 9 ? phoneDigits : "06201234567";

    const invoice: Record<string, string> = {
      name: invoiceName,
      country: "hu",
      state: invoiceCity,
      city: invoiceCity,
      zip: invoiceZip,
      address: invoiceStreet,
      phone: invoicePhone,
    };

    const payload = {
      salt: simplePaySalt(32),
      merchant: config.merchant,
      orderRef,
      currency: order.currency || "HUF",
      customerEmail: order.shipping_email ?? "info@hpvhelp.hu",
      language: "HU",
      sdkVersion: "SimplePay_PHP_SDK_2.1_Laravel",
      methods: ["CARD"],
      total: totalInt,
      timeout: timeoutStr,
      url: `${siteUrl}/simplepay/back?orderId=${encodeURIComponent(order.id)}`,
      invoice,
    };

    const payloadRaw = simplePayJsonStringify(payload);
    const signature = createSimplePaySignature(payloadRaw, config.secretKey);

    const spResponse = await fetch(`${config.apiBase}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Signature: signature,
      },
      body: payloadRaw,
      cache: "no-store",
    });

    const spJson = (await spResponse.json()) as {
      paymentUrl?: string;
      transactionId?: number | string;
      errorCodes?: (string | number)[];
    };

    if (!spResponse.ok || (spJson.errorCodes && spJson.errorCodes.length > 0) || !spJson.paymentUrl) {
      return NextResponse.json(
        { error: "SimplePay start failed.", details: spJson.errorCodes ?? spJson },
        { status: 502 }
      );
    }

    const reference = spJson.transactionId != null ? String(spJson.transactionId) : null;
    if (reference) {
      await supabase.from("orders").update({ payment_reference: reference }).eq("id", order.id);
    }

    return NextResponse.json({ paymentUrl: spJson.paymentUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error." }, { status: 500 });
  }
}
