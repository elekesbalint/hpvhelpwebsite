"use client";

import emailjs from "@emailjs/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { clearCart } from "@/lib/cart";
import { useCart } from "@/hooks/useCart";
import { getCityByZipAPI } from "@/lib/nominatimApi";
import { getCityByZip } from "@/lib/postalCodes";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

async function sendOrderEmails(params: {
  orderId: string;
  customerEmail: string;
  customerName: string;
  paymentMethod: string;
  shippingAddress: string;
  shippingPhone: string;
  total: number;
  currency: string;
  items: OrderItem[];
  createdAt: string;
  shippingMethodLabel?: string;
}) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const customerTemplateId = process.env.NEXT_PUBLIC_EMAILJS_CUSTOMER_TEMPLATE_ID;
  const adminTemplateId = process.env.NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://hpvhelp.hu").replace(/\/+$/, "");

  if (!serviceId || !publicKey || serviceId === "service_xxxxxxx") return;

  const paymentLabels: Record<string, string> = {
    card: "Bankkártyás fizetés (SimplePay)",
    transfer: "Banki átutalás",
    cod: "Utánvét",
  };

  const shortId = `#${params.orderId.slice(0, 8).toUpperCase()}`;

  const paymentInfoMap: Record<string, string> = {
    card: [
      "A fizetés a SimplePay biztonságos fizetési rendszerén keresztül történt.",
      "Rendelése feldolgozás alatt áll.",
    ].join("\n"),
    transfer: [
      "Kérjük, utald el a végösszeget az alábbi bankszámlára:",
      "",
      `Kedvezményezett: Sunmed Kft.`,
      `Számlaszám: 10918001-00000124-71950001`,
      `Bank: UniCredit Bank`,
      `Közlemény: ${shortId}`,
      `Összeg: ${params.total.toLocaleString("hu-HU")} ${params.currency}`,
      "",
      "A rendelés feldolgozását az összeg beérkezése után kezdjük meg.",
    ].join("\n"),
    cod: [
      "A megrendelt termékek kifizetése készpénzzel vagy bankkártyával a csomag átvételekor történik.",
      "Az utánvétes fizetési kezelési költsége: 690 Ft.",
      "",
      "Munkanapokon a 14 óráig leadott megrendeléseket még aznap indítjuk.",
      "Szállítóink a GLS és Magyar Posta (MPL) a csomagindítás utáni munkanapon kézbesítik a küldeményeket,",
      "melyekről elektronikusan (SMS vagy email) tájékoztatást is küldenek.",
      "A csomagok nyomkövetésére a futárszolgálatok weboldalain is lehetőség van.",
    ].join("\n"),
  };

  const nextStepsMap: Record<string, string> = {
    card: "1. Rendelését feldolgozzuk és előkészítjük szállításra\n2. A futárszolgálat felkeresi Önt a megadott címen",
    transfer: "1. Utald el az összeget a megadott bankszámlára\n2. Az összeg beérkezése után feldolgozzuk a rendelést\n3. A futárszolgálat felkeresi Önt a megadott címen",
    cod: "1. Rendelését feldolgozzuk és előkészítjük szállításra\n2. A futárszolgálat felkeresi Önt a megadott címen\n3. A futárnak fizet a kézbesítéskor",
  };

  const itemsText = params.items
    .map((i) => `${i.product_name} - ${i.quantity} db - ${Number(i.line_total).toLocaleString("hu-HU")} Ft`)
    .join("\n");

  const commonParams = {
    email_subject: `Köszönjük rendelését! ${shortId} - HPVHelp Webshop`,
    email_title: "Köszönjük a rendelését!",
    email_intro: "Rendelését sikeresen fogadtuk. Köszönjük vásárlását!",
    email_note: "A rendelés részleteit elküldtük emailben. Hamarosan felvesszük Önnel a kapcsolatot.",
    order_id: shortId,
    order_date: new Date(params.createdAt).toLocaleString("hu-HU"),
    payment_method: paymentLabels[params.paymentMethod] ?? params.paymentMethod,
    shipping_method: params.shippingMethodLabel ?? "",
    total: `${params.total.toLocaleString("hu-HU")} ${params.currency}`,
    items_text: itemsText,
    shipping_name: params.customerName,
    shipping_address: params.shippingAddress,
    shipping_phone: params.shippingPhone,
    payment_info: paymentInfoMap[params.paymentMethod] ?? "",
    next_steps: nextStepsMap[params.paymentMethod] ?? "",
    site_url: siteUrl,
    order_link: `${siteUrl}/orders/${params.orderId}`,
    orders_link: `${siteUrl}/orders`,
    home_link: `${siteUrl}/`,
  };

  try {
    if (customerTemplateId && customerTemplateId !== "template_xxxxxxx") {
      await emailjs.send(serviceId, customerTemplateId, {
        ...commonParams,
        to_email: params.customerEmail,
        to_name: params.customerName,
      }, publicKey);
    }

    if (adminTemplateId && adminEmail && adminTemplateId !== "template_xxxxxxx") {
      await emailjs.send(serviceId, adminTemplateId, {
        ...commonParams,
        to_email: adminEmail,
        customer_email: params.customerEmail,
      }, publicKey);
    }
  } catch (err) {
    console.error("EmailJS error:", err);
  }
}

type PaymentMethod = "card" | "transfer" | "cod";
type ShippingMethod = "posta" | "gls" | "csomagpont" | "pickup";

const shippingOptions: { id: ShippingMethod; label: string; sub: string; price: number }[] = [
  { id: "posta",     label: "Magyar Posta",  sub: "Házhozszállítás futárszolgálattal", price: 1950 },
  { id: "gls",       label: "GLS",           sub: "Házhozszállítás futárszolgálattal", price: 2250 },
  { id: "csomagpont",label: "Csomagpontok",  sub: "GLS, Packeta, FOX POST, Magyar Posta csomagpontok", price: 1650 },
  { id: "pickup",    label: "Személyes átvétel", sub: "7623 Pécs, Megyeri út 26.", price: 0 },
];

const paymentOptions: { id: PaymentMethod; label: string; sub: string; icon: string }[] = [
  {
    id: "card",
    label: "Bankkártyás fizetés",
    sub: "Biztonságos online fizetés SimplePay rendszerén keresztül",
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    id: "transfer",
    label: "Banki átutalás",
    sub: "A rendelés feldolgozását az összeg beérkezése után kezdjük meg",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  },
  {
    id: "cod",
    label: "Utánvét",
    sub: "Fizetés a futárnak a kézbesítéskor",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  },
];

const BANK_DETAILS = {
  name: "Sunmed Kft.",
  iban: "10918001-00000124-71950001",
  swift: "OTPVHUHB",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");

  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [diffBilling, setDiffBilling] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [billingTaxNumber, setBillingTaxNumber] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingHouseNumber, setBillingHouseNumber] = useState("");

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("posta");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const shipping = shippingOptions.find((o) => o.id === shippingMethod)?.price ?? 0;

  // Szállítási ZIP → város autofill
  useEffect(() => {
    if (zip.length !== 4) return;
    let cancelled = false;
    void (async () => {
      const staticCity = getCityByZip(zip);
      if (staticCity && !cancelled) setCity(staticCity);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;
      const apiCity = await getCityByZipAPI(zip);
      if (apiCity && !cancelled) setCity(apiCity);
    })();
    return () => { cancelled = true; };
  }, [zip]);

  // Számlázási ZIP → város autofill
  useEffect(() => {
    if (billingZip.length !== 4) return;
    let cancelled = false;
    void (async () => {
      const staticCity = getCityByZip(billingZip);
      if (staticCity && !cancelled) setBillingCity(staticCity);
      await new Promise((r) => setTimeout(r, 300));
      if (cancelled) return;
      const apiCity = await getCityByZipAPI(billingZip);
      if (apiCity && !cancelled) setBillingCity(apiCity);
    })();
    return () => { cancelled = true; };
  }, [billingZip]);
  const total = subtotal + shipping;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const meta = user.user_metadata as Record<string, string> | undefined;
      if (meta?.full_name) setName(meta.full_name);
      if (user.email) setEmail(user.email);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0) router.replace("/cart");
  }, [mounted, items.length, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      router.push("/login");
      return;
    }

    setSubmitting(true);

    const shippingAddress = `${zip} ${city}, ${street} ${houseNumber}`;
    // Számlázási cím (ha különbözik a szállítástól)
    if (diffBilling && (!billingName || !billingZip || !billingCity || !billingStreet || !billingHouseNumber)) {
      setSubmitting(false);
      setError("Kérjük töltsd ki az összes számlázási cím mezőt.");
      return;
    }
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        status: "pending",
        subtotal: Number(subtotal.toFixed(2)),
        discount: 0,
        total: Number(total.toFixed(2)),
        currency: "HUF",
        payment_provider:
          payment === "card"
            ? "simplepay"
            : payment === "transfer"
              ? "manual_transfer"
              : "manual_cod",
        shipping_name: name,
        shipping_phone: phone,
        shipping_address: shippingAddress,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setSubmitting(false);
      setError(orderError?.message ?? "Hiba a rendelés mentésekor.");
      return;
    }

    const orderItemsPayload = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      unit_price: Number(item.price.toFixed(2)),
      quantity: item.quantity,
      line_total: Number((item.price * item.quantity).toFixed(2)),
    }));

    const { data: orderItemsData, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload)
      .select();

    if (itemsError) {
      setSubmitting(false);
      setError(itemsError.message);
      return;
    }

    const { error: stockError } = await supabase.rpc("decrement_product_stock_for_order", {
      p_order_id: order.id,
    });

    if (stockError) {
      await supabase.from("orders").delete().eq("id", order.id);
      setSubmitting(false);
      setError("A készlet időközben megváltozott. Kérjük ellenőrizd a kosarat és próbáld újra.");
      return;
    }

    clearCart();

    // Emailek küldése háttérben
    const selectedShipping = shippingOptions.find((o) => o.id === shippingMethod);
    void sendOrderEmails({
      orderId: order.id,
      customerEmail: email,
      customerName: name,
      paymentMethod: payment,
      shippingAddress: shippingMethod === "pickup"
        ? "Személyes átvétel: 7623 Pécs, Megyeri út 26."
        : `${zip} ${city}, ${street} ${houseNumber}`,
      shippingPhone: phone,
      total: Number(total.toFixed(2)),
      currency: "HUF",
      items: orderItemsData,
      createdAt: new Date().toISOString(),
      shippingMethodLabel: selectedShipping
        ? `${selectedShipping.label}${selectedShipping.price > 0 ? ` (${selectedShipping.price.toLocaleString("hu-HU")} Ft)` : " (Ingyenes)"}`
        : "",
    });

    setSubmitting(false);
    router.push(`/checkout/success?orderId=${order.id}&payment=${payment}`);
  }

  const inputCls = "w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1 block text-xs font-semibold text-red-950/70";

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 shadow-sm transition hover:bg-brand-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Vissza a kosárhoz
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-sm" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVHelp Webshop</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Rendelés</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Fizetés</h1>
        </div>

        {!mounted ? (
          <div className="space-y-4">
            <div className="skeleton h-96 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        ) : null}
        <form onSubmit={(e) => void handleSubmit(e)} className={!mounted ? "hidden" : ""}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-5">
              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
              ) : null}

              {/* Shipping */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-slate-900">Szállítási adatok</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Teljes név *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Kovács János" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Email cím *</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="pelda@email.hu" />
                    </div>
                    <div>
                      <label className={labelCls}>Telefonszám *</label>
                      <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+36 30 123 4567" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Irányítószám *</label>
                      <input type="text" required value={zip} onChange={(e) => setZip(e.target.value)} className={inputCls} placeholder="1011" />
                    </div>
                    <div>
                      <label className={labelCls}>Város *</label>
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Budapest" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Utca *</label>
                      <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputCls} placeholder="Példa utca" />
                    </div>
                    <div>
                      <label className={labelCls}>Házszám *</label>
                      <input type="text" required value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className={inputCls} placeholder="12/A" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Megjegyzés (opcionális)</label>
                    <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} resize-none`} placeholder="Pl. kapucsengő neve, emeleti szállítás..." />
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/30 p-3 transition hover:bg-brand-50">
                  <input
                    type="checkbox"
                    checked={diffBilling}
                    onChange={(e) => setDiffBilling(e.target.checked)}
                    className="h-4 w-4 rounded border-brand-300 text-brand-800 accent-brand-800"
                  />
                  <span className="text-sm font-semibold text-red-950">Számlázási cím különbözik a szállítási címtől</span>
                </label>

                {diffBilling ? (
                  <div className="mt-4 space-y-4 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Számlázási cím</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Számlázási név *</label>
                        <input type="text" required value={billingName} onChange={(e) => setBillingName(e.target.value)} className={inputCls} placeholder="Cégnév vagy teljes név" />
                      </div>
                      <div>
                        <label className={labelCls}>Adószám <span className="font-normal text-red-950/50">(opcionális)</span></label>
                        <input type="text" value={billingTaxNumber} onChange={(e) => setBillingTaxNumber(e.target.value)} className={inputCls} placeholder="12345678-1-11" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Irányítószám *</label>
                        <input type="text" required value={billingZip} onChange={(e) => setBillingZip(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Város *</label>
                        <input type="text" required value={billingCity} onChange={(e) => setBillingCity(e.target.value)} className={inputCls} />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Utca *</label>
                        <input type="text" required value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} className={inputCls} placeholder="Példa utca" />
                      </div>
                      <div>
                        <label className={labelCls}>Házszám *</label>
                        <input type="text" required value={billingHouseNumber} onChange={(e) => setBillingHouseNumber(e.target.value)} className={inputCls} placeholder="12/A" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Shipping method */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-slate-900">Szállítási mód</h2>
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${
                        shippingMethod === option.id
                          ? "border-brand-700 bg-brand-50"
                          : "border-brand-100 bg-white hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={option.id}
                        checked={shippingMethod === option.id}
                        onChange={() => setShippingMethod(option.id)}
                        className="h-4 w-4 accent-brand-800"
                      />
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{option.label}</p>
                          <p className="text-xs text-red-950/60">{option.sub}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-brand-900">
                          {option.price === 0 ? "Ingyenes" : `${option.price.toLocaleString("hu-HU")} Ft`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-slate-900">Fizetési mód</h2>
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition ${
                        payment === option.id
                          ? "border-brand-700 bg-brand-50"
                          : "border-brand-100 bg-white hover:border-brand-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.id}
                        checked={payment === option.id}
                        onChange={() => setPayment(option.id)}
                        className="mt-0.5 h-4 w-4 accent-brand-800"
                      />
                      <div className="flex flex-1 items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${payment === option.id ? "bg-brand-900 text-white" : "bg-brand-50 text-brand-800"}`}>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{option.label}</p>
                          <p className="text-xs text-red-950/60">{option.sub}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {payment === "card" ? (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-950/70">
                      A <strong>Fizetés véglegesítése</strong> gombra kattintva a SimplePay biztonságos fizetési oldalára irányítunk. A kártyaadatokat kizárólag a SimplePay rendszere kezeli, azokat nem tároljuk.
                    </p>
                  </div>
                ) : null}

                {payment === "transfer" ? (
                  <div className="mt-4 space-y-2 rounded-xl border border-brand-100 bg-brand-50/30 p-4 text-sm">
                    <p className="font-bold text-slate-900">Bankszámla adatok</p>
                    <p className="text-red-950/70">Kedvezményezett: <span className="font-semibold text-slate-900">{BANK_DETAILS.name}</span></p>
                    <p className="font-mono text-red-950/70">Számlaszám: <span className="font-semibold text-slate-900">{BANK_DETAILS.iban}</span></p>
                    <p className="text-red-950/70">SWIFT: <span className="font-semibold text-slate-900">{BANK_DETAILS.swift}</span></p>
                    <p className="text-xs text-red-950/50">Közleménybe kérjük tüntesd fel a rendelési számodat.</p>
                  </div>
                ) : null}

                {payment === "cod" ? (
                  <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/30 p-4 text-sm space-y-2">
                    <p className="font-bold text-slate-900">Utánvét információ</p>
                    <p className="text-red-950/70">A megrendelt termékek kifizetése <strong>készpénzzel vagy bankkártyával</strong> a csomag átvételekor történik. Az utánvétes fizetési kezelési költsége: <strong>690 Ft</strong>.</p>
                    <p className="text-red-950/70">Munkanapokon a <strong>14 óráig</strong> leadott megrendeléseket még aznap indítjuk. Szállítóink (GLS és Magyar Posta) a csomagindítás utáni munkanapon kézbesítik a küldeményeket, melyekről SMS-ben vagy emailben értesítést is küldenek.</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right: Sticky summary */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">Rendelés összegzése</h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-gradient-to-br from-brand-50 to-brand-100" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-red-950/50">Mennyiség: {item.quantity}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-brand-900">
                        {(item.price * item.quantity).toLocaleString("hu-HU")} Ft
                      </p>
                    </div>
                  ))}
                </div>

                <div className="my-4 border-t border-brand-100" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-950/60">Részösszeg</span>
                    <span className="font-semibold">{subtotal.toLocaleString("hu-HU")} Ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-950/60">Szállítás</span>
                    <span className={`font-semibold ${shipping === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                      {shipping === 0 ? "Ingyenes" : `${shipping.toLocaleString("hu-HU")} Ft`}
                    </span>
                  </div>
                </div>

                <div className="my-4 border-t border-brand-100" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Végösszeg</span>
                  <span className="text-xl font-bold text-brand-900">{total.toLocaleString("hu-HU")} Ft</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || items.length === 0}
                  className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-800 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Feldolgozás...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      {payment === "card" ? "Fizetés véglegesítése" : "Rendelés elküldése"}
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-red-950/40">
                  A rendelés leadásával elfogadod az ÁSZF-et
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
