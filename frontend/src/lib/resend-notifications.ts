import { Resend } from "resend";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type ResendSendOutcome = {
  ok: boolean;
  skipped?: "no_resend_key" | "no_customer_email" | "send_error";
  /** Resend / környezeti hiba szöveg (logoláshoz, API válaszhoz) */
  detail?: string;
  /** Csak admin címre ment (vevői email hiány miatt) */
  adminOnly?: boolean;
};

function formatResendError(error: { name?: string; message?: string } | null): string {
  if (!error) return "unknown";
  return [error.name, error.message].filter(Boolean).join(": ") || "unknown";
}

function escapeHtml(s: string | null | undefined): string {
  if (s == null || s === "") return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://hpvhelp.hu").replace(/\/+$/, "");
}

function adminCopyEmail(): string | null {
  const a = process.env.ADMIN_EMAIL?.trim() || process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim();
  return a || null;
}

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromHeader(): string {
  return process.env.RESEND_FROM?.trim() || "HPVhelp <onboarding@resend.dev>";
}

function paymentLabel(order: Order): string {
  const p = order.payment_provider;
  if (p === "simplepay") return "Bankkártyás fizetés (SimplePay)";
  if (p === "manual_transfer") return "Banki átutalás";
  if (p === "manual_cod") return "Utánvét";
  return p ?? "—";
}

function orderItemsHtml(items: Pick<OrderItem, "product_name" | "quantity" | "line_total" | "unit_price">[]): string {
  if (!items.length) return "<p>Nincs tétel.</p>";
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border:1px solid #eee">${escapeHtml(i.product_name)}</td>` +
        `<td style="padding:8px;border:1px solid #eee;text-align:center">${i.quantity}</td>` +
        `<td style="padding:8px;border:1px solid #eee;text-align:right">${Number(i.unit_price).toLocaleString("hu-HU")} Ft</td>` +
        `<td style="padding:8px;border:1px solid #eee;text-align:right;font-weight:600">${Number(i.line_total).toLocaleString("hu-HU")} Ft</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;width:100%;max-width:560px"><thead><tr><th style="text-align:left;padding:8px;border:1px solid #eee">Termék</th><th style="padding:8px;border:1px solid #eee">Db</th><th style="padding:8px;border:1px solid #eee;text-align:right">Egységár</th><th style="padding:8px;border:1px solid #eee;text-align:right">Összesen</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function layoutHtml(title: string, inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1e293b;background:#fdf8f8;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #fecaca">
    <h1 style="font-size:20px;color:#7f1d1d;margin:0 0 16px">${escapeHtml(title)}</h1>
    ${inner}
    <p style="margin-top:24px;font-size:12px;color:#64748b">HPVhelp · <a href="${siteBaseUrl()}">${siteBaseUrl()}</a></p>
  </div></body></html>`;
}

export async function sendOrderConfirmationEmail(params: {
  order: Order;
  items: Pick<OrderItem, "product_name" | "quantity" | "line_total" | "unit_price">[];
  publicOrderLabel: string;
  /** Ha meg van adva (pl. profil email feloldásból), ez élvez elsőbbséget a rendelés shipping_email mezőjével szemben. */
  customerEmail?: string | null;
}): Promise<ResendSendOutcome> {
  const resend = resendClient();
  if (!resend) return { ok: false, skipped: "no_resend_key" };

  const admin = adminCopyEmail();
  const fromOrderOrParam =
    (params.customerEmail?.trim() || params.order.shipping_email?.trim()) || "";

  let adminOnlyFallback = false;
  let to = fromOrderOrParam;
  if (!to && admin) {
    to = admin;
    adminOnlyFallback = true;
  }

  if (!to) return { ok: false, skipped: "no_customer_email" };

  const base = siteBaseUrl();
  const name = escapeHtml(params.order.shipping_name ?? "Vásárló");
  const pay = paymentLabel(params.order);
  const totalStr = `${Number(params.order.total).toLocaleString("hu-HU")} ${params.order.currency}`;

  let payBlock = "";
  if (params.order.payment_provider === "manual_transfer") {
    payBlock = `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px;margin:12px 0">
      <p style="margin:0 0 8px;font-weight:600">Banki átutalás</p>
      <p>Kedvezményezett: Sunmed Kft.</p>
      <p>Számlaszám: 10918001-00000124-71950001</p>
      <p>Bank: UniCredit Bank</p>
      <p>Közlemény: <strong>${escapeHtml(params.publicOrderLabel)}</strong></p>
      <p>Összeg: <strong>${escapeHtml(totalStr)}</strong></p>
    </div>`;
  } else if (params.order.payment_provider === "manual_cod") {
    payBlock = `<p>Utánvét: a futárnak fizet a kézbesítéskor.</p>`;
  } else if (params.order.payment_provider === "simplepay") {
    payBlock = `<p>A fizetés a SimplePay rendszerén keresztül történt. Rendelését feldolgozzuk.</p>`;
  }

  const billingName = params.order.billing_name?.trim() || params.order.shipping_name?.trim() || "";
  const billingAddr = params.order.billing_address?.trim() || params.order.shipping_address?.trim() || "";
  const billing = `<h2 style="font-size:14px;margin:20px 0 8px">Számlázási adatok</h2>
         <p>${escapeHtml(billingName)}</p>
         ${params.order.billing_tax_number ? `<p>Adószám: ${escapeHtml(params.order.billing_tax_number)}</p>` : ""}
         <p>${escapeHtml(billingAddr)}</p>
         ${params.order.billing_company_contact ? `<p>${escapeHtml(params.order.billing_company_contact)}</p>` : ""}`;

  const adminBanner = adminOnlyFallback
    ? `<p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:0 0 16px;font-size:14px"><strong>Admin értesítés:</strong> ehhez a rendeléshez nem volt elérhető vevői e-mail (szállítási mező és profil email sem), ezért ez a levél csak az admin címre érkezett. Érdemes manuálisan felvenni a vevővel a kapcsolatot.</p>`
    : "";

  const inner = `${adminBanner}
    <p>Kedves ${name}!</p>
    <p>Köszönjük a rendelését. Az alábbiakban összefoglaljuk a fontos adatokat.</p>
    <p><strong>Rendelés:</strong> ${escapeHtml(params.publicOrderLabel)}<br/>
    <strong>Dátum:</strong> ${escapeHtml(new Date(params.order.created_at).toLocaleString("hu-HU"))}<br/>
    <strong>Fizetés:</strong> ${escapeHtml(pay)}<br/>
    <strong>Végösszeg:</strong> ${escapeHtml(totalStr)}</p>
    ${payBlock}
    <h2 style="font-size:14px;margin:20px 0 8px">Szállítási adatok</h2>
    <p>${escapeHtml(params.order.shipping_name)}<br/>${escapeHtml(params.order.shipping_phone)}<br/>${escapeHtml(params.order.shipping_address)}</p>
    ${billing}
    ${params.order.notes?.trim() ? `<h2 style="font-size:14px;margin:20px 0 8px">Megjegyzés</h2><p>${escapeHtml(params.order.notes)}</p>` : ""}
    <h2 style="font-size:14px;margin:20px 0 8px">Rendelt tételek</h2>
    ${orderItemsHtml(params.items)}
    ${(() => {
      const subtotal = Number(params.order.subtotal);
      const total = Number(params.order.total);
      const discount = Number(params.order.discount ?? 0);
      const shipping = total - subtotal + discount;
      const cur = params.order.currency ?? "HUF";
      const fmt = (n: number) => `${Math.round(n).toLocaleString("hu-HU")} ${cur}`;
      const rows = [
        `<tr><td style="padding:6px 8px;color:#64748b">Részösszeg</td><td style="padding:6px 8px;text-align:right">${fmt(subtotal)}</td></tr>`,
        shipping > 0 ? `<tr><td style="padding:6px 8px;color:#64748b">Szállítás</td><td style="padding:6px 8px;text-align:right">${fmt(shipping)}</td></tr>` : "",
        discount > 0 ? `<tr><td style="padding:6px 8px;color:#16a34a">Kupon kedvezmény${params.order.coupon_code ? ` (${escapeHtml(params.order.coupon_code)})` : ""}</td><td style="padding:6px 8px;text-align:right;color:#16a34a">−${fmt(discount)}</td></tr>` : "",
        `<tr style="border-top:2px solid #e5e7eb"><td style="padding:8px;font-weight:700">Végösszeg</td><td style="padding:8px;text-align:right;font-weight:700;font-size:16px">${fmt(total)}</td></tr>`,
      ].join("");
      return `<table style="border-collapse:collapse;width:100%;max-width:560px;margin-top:8px">${rows}</table>`;
    })()}
    <p style="margin-top:20px"><a href="${base}/orders/${params.order.id}" style="color:#b91c1c;font-weight:600">Rendelés megtekintése</a></p>`;

  const subjectPrefix = adminOnlyFallback ? "[Nincs vevő email] " : "";
  const subject = `${subjectPrefix}Köszönjük rendelését! ${params.publicOrderLabel} – HPVhelp`;

  try {
    const { error } = await resend.emails.send(
      {
        from: fromHeader(),
        to,
        bcc:
          !adminOnlyFallback && admin && admin.toLowerCase() !== to.toLowerCase() ? [admin] : undefined,
        subject,
        html: layoutHtml("Köszönjük a rendelését!", inner),
      },
      { idempotencyKey: `order-confirm-${params.order.id}` }
    );
    if (error) {
      const detail = formatResendError(error);
      console.error("[resend] order confirmation failed", { orderId: params.order.id, detail, error });
      return { ok: false, skipped: "send_error", detail };
    }
    return { ok: true, adminOnly: adminOnlyFallback };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[resend] order confirmation exception", { orderId: params.order.id, detail, e });
    return { ok: false, skipped: "send_error", detail };
  }
}

export async function sendPaymentFailedEmail(params: {
  order: Order;
  publicOrderLabel: string;
  reasonLabel: string;
  customerEmail?: string | null;
}): Promise<ResendSendOutcome> {
  const resend = resendClient();
  if (!resend) return { ok: false, skipped: "no_resend_key" };

  const admin = adminCopyEmail();
  const fromOrderOrParam =
    (params.customerEmail?.trim() || params.order.shipping_email?.trim()) || "";

  let adminOnlyFallback = false;
  let to = fromOrderOrParam;
  if (!to && admin) {
    to = admin;
    adminOnlyFallback = true;
  }

  if (!to) return { ok: false, skipped: "no_customer_email" };

  const base = siteBaseUrl();
  const name = escapeHtml(params.order.shipping_name ?? "Vásárló");
  const adminBanner = adminOnlyFallback
    ? `<p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:0 0 16px;font-size:14px"><strong>Admin értesítés:</strong> vevői e-mail nem volt elérhető; a sikertelen fizetésről szóló üzenet csak ide érkezett.</p>`
    : "";
  const inner = `${adminBanner}
    <p>Kedves ${name}!</p>
    <p>A <strong>${escapeHtml(params.publicOrderLabel)}</strong> rendeléshez tartozó <strong>bankkártyás fizetés nem zárult le sikeresen</strong> (${escapeHtml(params.reasonLabel)}).</p>
    <p>A rendelés rögzült, de még <strong>nincs kifizetve</strong>. Amennyiben szeretné a terméket megrendelni, kérjük adjon le új rendelést, vagy vegye fel velünk a kapcsolatot.</p>
    <p><a href="${base}/orders/${params.order.id}" style="color:#b91c1c;font-weight:600">Rendelés megtekintése</a></p>`;

  const idem = `pay-fail-${params.order.id}-${params.reasonLabel}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256);
  const subjectPrefix = adminOnlyFallback ? "[Nincs vevő email] " : "";
  try {
    const { error } = await resend.emails.send(
      {
        from: fromHeader(),
        to,
        bcc:
          !adminOnlyFallback && admin && admin.toLowerCase() !== to.toLowerCase() ? [admin] : undefined,
        subject: `${subjectPrefix}Fizetés sikertelen – ${params.publicOrderLabel} – HPVhelp`,
        html: layoutHtml("A bankkártyás fizetés nem sikerült", inner),
      },
      { idempotencyKey: idem }
    );
    if (error) {
      const detail = formatResendError(error);
      console.error("[resend] payment failed email", { orderId: params.order.id, detail, error });
      return { ok: false, skipped: "send_error", detail };
    }
    return { ok: true, adminOnly: adminOnlyFallback };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[resend] payment failed exception", { orderId: params.order.id, detail, e });
    return { ok: false, skipped: "send_error", detail };
  }
}

export async function sendCourierHandoffEmail(params: {
  order: Order;
  itemsTextLines: string;
  publicOrderLabel: string;
  toEmail: string;
  toName: string;
}): Promise<ResendSendOutcome> {
  const resend = resendClient();
  if (!resend) return { ok: false, skipped: "no_resend_key" };
  const to = params.toEmail.trim();
  if (!to) return { ok: false, skipped: "no_customer_email" };

  const base = siteBaseUrl();
  const pay = paymentLabel(params.order);
  const totalStr = `${Number(params.order.total).toLocaleString("hu-HU")} ${params.order.currency}`;
  const itemsHtml = params.itemsTextLines
    .split("\n")
    .map((line) => `<li style="margin:4px 0">${escapeHtml(line)}</li>`)
    .join("");

  const inner = `
    <p>Kedves ${escapeHtml(params.toName)}!</p>
    <p>Örömmel értesítjük, hogy a <strong>${escapeHtml(params.publicOrderLabel)}</strong> rendelését <strong>átadtuk a futárszolgálatnak</strong>.</p>
    <p><strong>Rendelés dátuma:</strong> ${escapeHtml(new Date(params.order.created_at).toLocaleString("hu-HU"))}<br/>
    <strong>Fizetés:</strong> ${escapeHtml(pay)}<br/>
    <strong>Végösszeg:</strong> ${escapeHtml(totalStr)}</p>
    <p><strong>Szállítási cím:</strong><br/>${escapeHtml(params.order.shipping_address ?? "—")}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(params.order.shipping_phone ?? "—")}</p>
    <h2 style="font-size:14px;margin:16px 0 8px">Tételek</h2>
    <ul style="padding-left:18px">${itemsHtml}</ul>
    <p style="margin-top:16px">Innentől a csomag kézbesítésével kapcsolatban a futárszolgálattól fogsz értesítéseket kapni.</p>
    <p><a href="${base}/orders/${params.order.id}" style="color:#b91c1c;font-weight:600">Rendelés megtekintése</a></p>`;

  const admin = adminCopyEmail();
  try {
    const { error } = await resend.emails.send(
      {
        from: fromHeader(),
        to,
        bcc: admin && admin.toLowerCase() !== to.toLowerCase() ? [admin] : undefined,
        subject: `Csomagja futárnak átadva – ${params.publicOrderLabel} – HPVhelp`,
        html: layoutHtml("Csomagja futárnak átadva", inner),
      },
      { idempotencyKey: `courier-${params.order.id}` }
    );
    if (error) {
      const detail = formatResendError(error);
      console.error("[resend] courier handoff failed", { orderId: params.order.id, detail, error });
      return { ok: false, skipped: "send_error", detail };
    }
    return { ok: true };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[resend] courier handoff exception", { orderId: params.order.id, detail, e });
    return { ok: false, skipped: "send_error", detail };
  }
}
