"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { clearCart } from "@/lib/cart";
import { validateCartStock } from "@/lib/validate-cart-stock";
import { useCart } from "@/hooks/useCart";
import { getCityByZipAPI } from "@/lib/nominatimApi";
import { getCityByZip } from "@/lib/postalCodes";
import {
  formatHungarianPhone,
  formatHungarianTaxNumber,
  isValidEmail,
  isValidHungarianPhone,
  isValidHungarianTaxNumber,
  normalizeEmail,
} from "@/lib/checkout-inputs";
import {
  CHECKOUT_SHIPPING_ABROAD_ENABLED,
  getEnabledPaymentMethods,
  getSampleTargetLabel,
  type PaymentMethod,
} from "@/lib/checkout-config";
import { formatShippingFee, shippingFeeForSubtotal } from "@/lib/shipping/fees";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { resolveExportArticleNumber } from "@/lib/integrations/naturasoft/article-number";
import { calculateCouponDiscount, cartItemIsOnSale } from "@/lib/pricing";
import { BANK_DETAILS } from "@/lib/bank-details";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import { supabase } from "@/lib/supabase";
import GuestCheckoutNotice from "@/components/GuestCheckoutNotice";
import PickupPointSelector from "@/components/PickupPointSelector";
import SimplePayCardDeclaration from "@/components/SimplePayCardDeclaration";
import SimplePayLogoLink from "@/components/SimplePayLogoLink";
import SiteLogo from "@/components/SiteLogo";
import type { PickupPoint, PickupPointMeta } from "@/types/pickup-point";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];

async function triggerOrderPlacedEmail(orderId: string, accessToken: string) {
  try {
    await fetch("/api/email/order-placed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ orderId }),
    });
  } catch (e) {
    console.error("Order confirmation email request failed:", e);
  }
}

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

type ShippingMethod = "posta" | "gls" | "csomagpont" | "pickup" | "abroad";
type BuyerType = "individual" | "company";

type CarrierLogo = {
  name: string;
  src: string;
};

const shippingOptions: { id: ShippingMethod; label: string; sub: string }[] = [
  { id: "posta",     label: "Magyar Posta",  sub: "Házhozszállítás futárszolgálattal" },
  { id: "gls",       label: "GLS",           sub: "Házhozszállítás futárszolgálattal" },
  { id: "csomagpont",label: "Csomagpontok",  sub: "GLS és MPL postapontok, automaták" },
  { id: "pickup",    label: "Személyes átvétel", sub: "7623 Pécs, Megyeri út 26. fszt. 109." },
  { id: "abroad",    label: "Külföldi szállítás", sub: "EU-n kívüli vagy nem magyarországi szállítási cím" },
];

const visibleShippingOptions = shippingOptions.filter(
  (option) => option.id !== "abroad" || CHECKOUT_SHIPPING_ABROAD_ENABLED,
);

const shippingCarrierLogos: Record<ShippingMethod, CarrierLogo[]> = {
  posta: [{ name: "Magyar Posta", src: "/shipping/magyar-posta.png" }],
  gls: [{ name: "GLS", src: "/shipping/gls.png" }],
  csomagpont: [
    { name: "GLS", src: "/shipping/gls.png" },
    { name: "Magyar Posta", src: "/shipping/magyar-posta.png" },
  ],
  pickup: [],
  abroad: [],
};

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
];

type SavedCheckoutProfile = {
  buyerType: BuyerType;
  name: string;
  companyName: string;
  companyTaxNumber: string;
  contactName: string;
  email: string;
  phone: string;
  zip: string;
  city: string;
  street: string;
  houseNumber: string;
  diffBilling: boolean;
  billingName: string;
  billingTaxNumber: string;
  billingZip: string;
  billingCity: string;
  billingStreet: string;
  billingHouseNumber: string;
};

function checkoutProfileStorageKey(userId: string): string {
  return `checkout_profile_v1:${userId}`;
}

function pickupPointToMeta(point: PickupPoint): PickupPointMeta {
  return {
    provider: point.provider,
    providerPointId: point.providerPointId,
    mplDeliveryMode: point.mplDeliveryMode,
    glsPsdId: point.glsPsdId,
    foxpostOperatorId: point.foxpostOperatorId,
    mplParcelPickupSite: point.mplParcelPickupSite,
    zip: point.zip,
    city: point.city,
    lat: point.lat,
    lng: point.lng,
    kind: point.kind,
  };
}

function formatPickupShippingAddress(point: PickupPoint): string {
  const line = point.address || point.name;
  return `${point.zip} ${point.city}, ${line}`.trim();
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal } = useCart();

  const [buyerType, setBuyerType] = useState<BuyerType>("individual");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxNumber, setCompanyTaxNumber] = useState("");
  const [contactName, setContactName] = useState("");
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
  const [checkoutStep, setCheckoutStep] = useState<"details" | "review">("details");
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<PaymentMethod[]>(["card"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponRow | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [allProductsForCoupon, setAllProductsForCoupon] = useState<{ id: string; name: string }[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [vatContentTotal, setVatContentTotal] = useState<number>(0);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isPickupShipping = shippingMethod === "csomagpont";
  const isPersonalPickup = shippingMethod === "pickup";

  const shipping = shippingFeeForSubtotal(shippingMethod);
  const couponDiscount = appliedCoupon ? calculateCouponDiscount(appliedCoupon, subtotal + shipping) : 0;

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
  const total = Math.max(0, subtotal + shipping - couponDiscount);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || items.length === 0) return;
    const key = "hpvhelp_begin_checkout_tracked";
    try {
      if (window.sessionStorage.getItem(key) === "1") return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    void import("@/lib/analytics/track").then(({ trackBeginCheckout }) => {
      trackBeginCheckout(items, total);
    });
  }, [mounted, items, total]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setCurrentUserId(user.id);
      const meta = user.user_metadata as Record<string, string> | undefined;
      if (meta?.full_name) setName(meta.full_name);
      if (user.email) setEmail(user.email);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    try {
      const raw = window.localStorage.getItem(checkoutProfileStorageKey(currentUserId));
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<SavedCheckoutProfile>;
      setBuyerType(saved.buyerType === "company" ? "company" : "individual");
      setName(saved.name ?? "");
      setCompanyName(saved.companyName ?? "");
      setCompanyTaxNumber(saved.companyTaxNumber ?? "");
      setContactName(saved.contactName ?? "");
      setEmail(saved.email ?? "");
      setPhone(saved.phone ?? "");
      setZip(saved.zip ?? "");
      setCity(saved.city ?? "");
      setStreet(saved.street ?? "");
      setHouseNumber(saved.houseNumber ?? "");
      setDiffBilling(Boolean(saved.diffBilling));
      setBillingName(saved.billingName ?? "");
      setBillingTaxNumber(saved.billingTaxNumber ?? "");
      setBillingZip(saved.billingZip ?? "");
      setBillingCity(saved.billingCity ?? "");
      setBillingStreet(saved.billingStreet ?? "");
      setBillingHouseNumber(saved.billingHouseNumber ?? "");
    } catch {
      // Hibás mentett adat esetén figyelmen kívül hagyjuk.
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!infoMessage) return;
    const timeout = window.setTimeout(() => setInfoMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [infoMessage]);

  useEffect(() => {
    void getEnabledPaymentMethods().then((methods) => {
      setEnabledPaymentMethods(methods);
      setPayment((current) => (methods.includes(current) ? current : (methods[0] ?? "card")));
    });
  }, []);

  useEffect(() => {
    void supabase.from("products").select("id, name").eq("is_active", true).then(({ data }) => {
      setAllProductsForCoupon(data ?? []);
    });
  }, []);

  /** Sikeres rendelés után clearCart() ürít — ne irányítsuk vissza a kosárba SimplePay / success előtt. */
  const skipEmptyCartRedirect = useRef(false);

  useEffect(() => {
    if (items.length > 0) skipEmptyCartRedirect.current = false;
  }, [items.length]);

  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0 && !skipEmptyCartRedirect.current) router.replace("/cart");
  }, [mounted, items.length, router]);

  useEffect(() => {
    if (!mounted || items.length === 0) {
      setVatContentTotal(0);
      return;
    }

    let cancelled = false;
    void (async () => {
      const productIds = items.map((item) => item.productId);
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from("products").select("id, category_id, vat_rate").in("id", productIds),
        supabase.from("categories").select("id, slug, parent_id, vat_rate"),
      ]);

      if (!products || cancelled) return;

      const typedProducts = products as Pick<ProductRow, "id" | "category_id" | "vat_rate">[];
      const typedCategories = (categories ?? []) as Pick<CategoryRow, "id" | "slug" | "parent_id" | "vat_rate">[];
      const categoryVatById = new Map<string, number | null>();
      for (const category of typedCategories) {
        categoryVatById.set(category.id, category.vat_rate);
      }

      const productMap = new Map(typedProducts.map((p) => [p.id, p]));
      const totalVat = items.reduce((sum, item) => {
        const p = productMap.get(item.productId);
        if (!p) return sum;
        const rate = p.vat_rate ?? (p.category_id ? categoryVatById.get(p.category_id) ?? null : null);
        if (rate == null) return sum;
        const gross = item.price * item.quantity;
        return sum + (gross * rate) / (100 + rate);
      }, 0);

      if (!cancelled) {
        setVatContentTotal(totalVat);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, mounted]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (checkoutStep === "details") {
      const validationError = validateCheckoutInputs();
      if (validationError) {
        setError(validationError);
        return;
      }
      if (currentUserId) {
        const rawSaved = window.localStorage.getItem(checkoutProfileStorageKey(currentUserId));
        if (!rawSaved) {
          // Első alkalom: nincs még mentett adat
          const wants = window.confirm("Szeretnéd menteni ezeket az adatokat a jövőbeni rendelésekhez?");
          if (wants) handleSaveCheckoutProfile();
        } else {
          // Már van mentett adat — csak akkor kérdezzük meg, ha változott valami
          try {
            const saved = JSON.parse(rawSaved) as Partial<SavedCheckoutProfile>;
            const changed =
              saved.buyerType !== buyerType ||
              (saved.name ?? "") !== name ||
              (saved.companyName ?? "") !== companyName ||
              (saved.companyTaxNumber ?? "") !== companyTaxNumber ||
              (saved.contactName ?? "") !== contactName ||
              (saved.email ?? "") !== normalizeEmail(email) ||
              (saved.phone ?? "") !== phone ||
              (saved.zip ?? "") !== zip ||
              (saved.city ?? "") !== city ||
              (saved.street ?? "") !== street ||
              (saved.houseNumber ?? "") !== houseNumber ||
              Boolean(saved.diffBilling) !== diffBilling ||
              (saved.billingName ?? "") !== billingName ||
              (saved.billingTaxNumber ?? "") !== billingTaxNumber ||
              (saved.billingZip ?? "") !== billingZip ||
              (saved.billingCity ?? "") !== billingCity ||
              (saved.billingStreet ?? "") !== billingStreet ||
              (saved.billingHouseNumber ?? "") !== billingHouseNumber;
            if (changed) {
              const wants = window.confirm("Az adataid megváltoztak. Frissítsük a mentett rendelési adatokat?");
              if (wants) handleSaveCheckoutProfile();
            }
          } catch {
            // Sérült mentett adat esetén újra kérdezzük
            const wants = window.confirm("Szeretnéd menteni ezeket az adatokat a jövőbeni rendelésekhez?");
            if (wants) handleSaveCheckoutProfile();
          }
        }
      }
      setCheckoutStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    let { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let session: Session | null = sessionData.session;

    if (sessionError) {
      setSubmitting(false);
      setError(sessionError.message);
      return;
    }

    if (!session?.user) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError || !anonData.session) {
        setSubmitting(false);
        setError(
          "A vendégrendeléshez technikai okból munkamenet kell. Jelentkezz be, vagy kérd a Supabase projektben: Authentication → Sign In / Providers → „Anonymous sign-ins” bekapcsolása. " +
            (anonError?.message ? `(${anonError.message})` : "")
        );
        return;
      }
      session = anonData.session;
    }

    if (!session?.user) {
      setSubmitting(false);
      setError("Nem sikerült a rendelés véglegesítése. Kérjük, jelentkezz be a folytatáshoz.");
      return;
    }

    setSubmitting(true);
    if (!enabledPaymentMethods.includes(payment)) {
      setSubmitting(false);
      setError("A kiválasztott fizetési mód jelenleg nem elérhető.");
      return;
    }

    const validationError = validateCheckoutInputs({ requireTerms: true });
    if (validationError) {
      setSubmitting(false);
      setError(validationError);
      return;
    }

    const stockValidationError = await validateCartStock(items);
    if (stockValidationError) {
      setSubmitting(false);
      setError(stockValidationError);
      return;
    }

    const shippingAddress =
      shippingMethod === "pickup"
        ? COMPANY_CONTACT.office
        : shippingMethod === "csomagpont" && selectedPickupPoint
          ? formatPickupShippingAddress(selectedPickupPoint)
          : `${zip} ${city}, ${street} ${houseNumber}`;
    const emailNorm = normalizeEmail(email);

    const shippingName = buyerType === "individual" ? name.trim() : contactName.trim();

    const diffBillingAddrLine = diffBilling
      ? `${billingZip} ${billingCity}, ${billingStreet} ${billingHouseNumber}`
      : null;

    let billingNameVal: string | null = null;
    let billingTaxVal: string | null = null;
    let billingAddrVal: string | null = null;
    let billingCompanyContactVal: string | null = null;

    if (buyerType === "company") {
      billingCompanyContactVal = `${companyName.trim()} – ${contactName.trim()}`;
      if (diffBilling) {
        billingNameVal = billingName.trim();
        billingTaxVal = billingTaxNumber.trim();
        billingAddrVal = diffBillingAddrLine;
      } else {
        billingNameVal = companyName.trim();
        billingTaxVal = companyTaxNumber.trim();
        billingAddrVal = null;
      }
    } else if (diffBilling) {
      billingNameVal = billingName.trim();
      billingAddrVal = diffBillingAddrLine;
    }

    const notesOnly = notes.trim() || null;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        status: "pending",
        subtotal: Number(subtotal.toFixed(2)),
        discount: couponDiscount,
        coupon_code: appliedCoupon?.code ?? null,
        total: Number(total.toFixed(2)),
        currency: "HUF",
        payment_provider: payment === "card" ? "simplepay" : "manual_transfer",
        shipping_name: shippingName,
        shipping_phone: phone,
        shipping_address: shippingAddress,
        shipping_email: emailNorm,
        shipping_method: shippingMethod,
        pickup_point_id: selectedPickupPoint?.id ?? null,
        pickup_point_name: selectedPickupPoint?.name ?? null,
        pickup_point_address: selectedPickupPoint
          ? selectedPickupPoint.address || formatPickupShippingAddress(selectedPickupPoint)
          : null,
        pickup_point_provider: selectedPickupPoint?.provider ?? null,
        pickup_point_meta: selectedPickupPoint ? pickupPointToMeta(selectedPickupPoint) : null,
        billing_name: billingNameVal,
        billing_tax_number: billingTaxVal,
        billing_address: billingAddrVal,
        billing_company_contact: billingCompanyContactVal,
        notes: notesOnly,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      setSubmitting(false);
      setError(orderError?.message ?? "Hiba a rendelés mentésekor.");
      return;
    }

    const cartProductIds = items.map((item) => item.productId);
    const { data: orderProducts } = await supabase
      .from("products")
      .select("id, sku, slug, description")
      .in("id", cartProductIds);
    const orderProductById = new Map((orderProducts ?? []).map((p) => [p.id, p]));

    const orderItemsPayload = items.map((item) => {
      const product = orderProductById.get(item.productId);
      const productName = getSampleTargetLabel(item.sampleTarget)
        ? `${item.name} - ${getSampleTargetLabel(item.sampleTarget)}`
        : item.name;
      const sku = resolveExportArticleNumber({ product_name: productName }, product);
      return {
        order_id: order.id,
        product_id: item.productId,
        product_name: productName,
        product_sku: sku === "ISMERETLEN" ? null : sku,
        unit_price: Number(item.price.toFixed(2)),
        quantity: item.quantity,
        line_total: Number((item.price * item.quantity).toFixed(2)),
      };
    });

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

    const accessToken = session.access_token ?? "";

    // Kupon rögzítés MINDEN fizetési módnál (service role API-on keresztül, RLS bypass)
    if (appliedCoupon && accessToken) {
      const couponUseRes = await fetch("/api/coupons/use", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ couponId: appliedCoupon.id, orderId: order.id }),
      });
      if (!couponUseRes.ok) {
        const j = (await couponUseRes.json()) as { error?: string };
        setSubmitting(false);
        setError(j.error ?? "A kupon rögzítése sikertelen, próbáld újra.");
        return;
      }
    }

    if (payment === "card") {
      const startResponse = await fetch("/simplepay/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const startJson = (await startResponse.json()) as { paymentUrl?: string; error?: string; details?: unknown };
      if (!startResponse.ok || !startJson.paymentUrl) {
        setSubmitting(false);
        const detailsText = Array.isArray((startJson as { details?: unknown }).details)
          ? (startJson as { details?: unknown[] }).details?.join(", ")
          : typeof startJson.details === "string"
            ? startJson.details
            : "";
        setError(
          detailsText
            ? `${startJson.error ?? "A bankkártyás fizetés indítása sikertelen."} (${detailsText})`
            : (startJson.error ?? "A bankkártyás fizetés indítása sikertelen.")
        );
        return;
      }

      skipEmptyCartRedirect.current = true;
      window.location.href = startJson.paymentUrl;
      clearCart();
      return;
    }

    skipEmptyCartRedirect.current = true;
    clearCart();

    if (accessToken) void triggerOrderPlacedEmail(order.id, accessToken);

    setSubmitting(false);
    router.push(`/checkout/success?orderId=${order.id}&payment=${payment}`);
  }

  function handleSaveCheckoutProfile() {
    if (!currentUserId) {
      setError("A mentéshez jelentkezz be.");
      return;
    }
    const payload: SavedCheckoutProfile = {
      buyerType,
      name,
      companyName,
      companyTaxNumber,
      contactName,
      email: normalizeEmail(email),
      phone,
      zip,
      city,
      street,
      houseNumber,
      diffBilling,
      billingName,
      billingTaxNumber,
      billingZip,
      billingCity,
      billingStreet,
      billingHouseNumber,
    };
    window.localStorage.setItem(checkoutProfileStorageKey(currentUserId), JSON.stringify(payload));
    setError(null);
    setInfoMessage("Az adataidat elmentettük a jövőbeni rendelésekhez.");
  }

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponError("Add meg a kuponkódot."); return; }
    setCouponLoading(true);
    setCouponError(null);

    const { data, error: dbError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    setCouponLoading(false);

    if (dbError || !data) {
      setCouponError("Érvénytelen vagy inaktív kuponkód.");
      return;
    }

    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) {
      setCouponError("Ez a kupon még nem érvényes.");
      return;
    }
    const expired = data.expires_at ? new Date(data.expires_at) < now : false;
    if (expired) { setCouponError("Ez a kupon lejárt."); return; }
    if (data.max_uses != null && data.used_count >= data.max_uses) {
      setCouponError("Ez a kupon már nem használható (elérte a maximum felhasználások számát).");
      return;
    }
    if (data.min_order_amount != null && (subtotal + shipping) < Number(data.min_order_amount)) {
      setCouponError(`A kuponhoz minimum ${Number(data.min_order_amount).toLocaleString("hu-HU")} Ft rendelési összeg szükséges.`);
      return;
    }

    // Per-user limit ellenőrzése
    if (data.max_uses_per_user != null) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        // coupon_usage-ból olvassuk — a "Users see own usage" RLS policy alapján
        const { count, error: countError } = await supabase
          .from("coupon_usage")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", data.id)
          .eq("user_id", userId);
        if (!countError && (count ?? 0) >= data.max_uses_per_user) {
          setCouponError(`Ezt a kupont már felhasználtad (max. ${data.max_uses_per_user}× / fő).`);
          return;
        }
      }
    }

    // Termék-hatókör ellenőrzése: ha van restricted_product_ids, a kosárban kell legyen ilyen termék
    const restrictedIds = data.restricted_product_ids as string[] | null;
    if (restrictedIds && restrictedIds.length > 0) {
      const cartProductIds = items.map((i) => i.productId);
      const hasEligibleItem = cartProductIds.some((id) => restrictedIds.includes(id));
      if (!hasEligibleItem) {
        const eligibleNames = allProductsForCoupon
          .filter((p) => restrictedIds.includes(p.id))
          .map((p) => p.name)
          .slice(0, 3)
          .join(", ");
        setCouponError(`Ez a kupon csak meghatározott termékekre érvényes${eligibleNames ? `: ${eligibleNames}` : ""}.`);
        return;
      }
    }

    // Akciós termék ellenőrzése – kivétel nélkül tiltott (csak aktuálisan érvényes kedvezménynél)
    const productIds = items.map((i) => i.productId);
    const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
      supabase.from("products").select("*").in("id", productIds),
      supabase.from("categories").select("*"),
    ]);
    const categoriesById = new Map((categoriesData ?? []).map((c) => [c.id, c]));

    const hasDiscountedItem = (productsData ?? []).some((p) => {
      const category = p.category_id ? categoriesById.get(p.category_id) : undefined;
      return cartItemIsOnSale(p, category);
    });

    if (hasDiscountedItem) {
      setCouponError("Akciós vagy leárazott termék esetén kupon nem érvényesíthető.");
      return;
    }

    setAppliedCoupon(data);
    setCouponCode("");
  }

  function validateCheckoutInputs(options?: { requireTerms?: boolean }): string | null {
    const emailNorm = normalizeEmail(email);
    if (!isValidEmail(emailNorm)) {
      return "Kérjük adj meg egy érvényes email címet.";
    }
    if (!isValidHungarianPhone(phone)) {
      return "Kérjük adj meg egy érvényes magyar telefonszámot (pl. +36 30 123 4567 vagy vezetékes: +36 1 …).";
    }
    if (buyerType === "individual") {
      if (!name.trim()) return "Kérjük add meg a teljes neved.";
    } else {
      if (!companyName.trim() || !contactName.trim()) {
        return "Kérjük töltsd ki a cégnevet és a kapcsolattartó nevét.";
      }
      if (!diffBilling && !isValidHungarianTaxNumber(companyTaxNumber)) {
        return "Az adószám formátuma: 12345678-1-11 (8–1–2 számjegy).";
      }
    }
    if (diffBilling && (!billingName || !billingZip || !billingCity || !billingStreet || !billingHouseNumber)) {
      return "Kérjük töltsd ki az összes számlázási cím mezőt.";
    }
    if (diffBilling && buyerType === "company" && !isValidHungarianTaxNumber(billingTaxNumber)) {
      return "A számlázási adószám formátuma: 12345678-1-11 (8–1–2 számjegy).";
    }
    if (shippingMethod === "csomagpont") {
      if (!selectedPickupPoint) {
        return "Kérjük válassz egy csomagpontot az átvételhez.";
      }
    } else if (!isPickupShipping && shippingMethod !== "pickup" && shippingMethod !== "abroad") {
      if (!zip.trim() || !city.trim() || !street.trim() || !houseNumber.trim()) {
        return "Kérjük töltsd ki a szállítási címet.";
      }
    }
    if (options?.requireTerms && !termsAccepted) {
      return "A rendelés leadásához el kell fogadnod az ÁSZF-et, a szállítási feltételeket és az adatvédelmi nyilatkozatot.";
    }
    return null;
  }

  function handleShippingMethodChange(method: ShippingMethod) {
    setShippingMethod(method);
    if (method === "csomagpont") {
      setPickupModalOpen(true);
    } else {
      setSelectedPickupPoint(null);
    }
  }

  const inputCls = "w-full min-w-0 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1 block text-xs font-semibold text-red-950/70";

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-brand-100/80 bg-white/80 pt-safe-top shadow-sm backdrop-blur-md">
        <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/cart"
            className="inline-flex min-w-0 max-w-[55%] shrink items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-red-950 shadow-sm transition hover:bg-brand-50 sm:max-w-none sm:gap-2 sm:px-4 sm:text-sm"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            <span className="truncate sm:hidden">Vissza</span>
            <span className="hidden truncate sm:inline">Vissza a kosárhoz</span>
          </Link>
          <SiteLogo withLink={false} size="sm" className="min-w-0 shrink sm:hidden" />
          <SiteLogo withLink={false} size="md" className="hidden shrink-0 sm:block" />
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 pb-page sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Rendelés</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Fizetés</h1>
        </div>

        <GuestCheckoutNotice className="mb-6" />

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
              {infoMessage ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{infoMessage}</div>
              ) : null}

              {checkoutStep === "details" ? (
                <>
              {/* Shipping */}
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-5 text-base font-bold text-slate-900">Szállítási adatok</h2>

                <div className="mb-5">
                  <p className={`${labelCls} mb-2`}>Vásárló típusa *</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label
                      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition sm:items-center sm:p-4 ${
                        buyerType === "individual" ? "border-brand-700 bg-brand-50" : "border-brand-100 bg-white hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="buyerType"
                        checked={buyerType === "individual"}
                        onChange={() => setBuyerType("individual")}
                        className="h-4 w-4 accent-brand-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">Magánszemély</p>
                        <p className="text-xs leading-relaxed text-red-950/60">Számlázáshoz nincs szükség adószámra.</p>
                      </div>
                    </label>
                    <label
                      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition sm:items-center sm:p-4 ${
                        buyerType === "company" ? "border-brand-700 bg-brand-50" : "border-brand-100 bg-white hover:border-brand-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="buyerType"
                        checked={buyerType === "company"}
                        onChange={() => setBuyerType("company")}
                        className="h-4 w-4 accent-brand-800"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">Cég</p>
                        <p className="text-xs leading-relaxed text-red-950/60">Cégnév és adószám kötelező (számlázás).</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  {buyerType === "individual" ? (
                    <div>
                      <label className={labelCls}>Teljes név *</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Kovács János" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className={labelCls}>Cégnév *</label>
                        <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="Példa Kft." />
                      </div>
                      {!diffBilling ? (
                        <div>
                          <label className={labelCls}>Adószám *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            required
                            value={companyTaxNumber}
                            onChange={(e) => setCompanyTaxNumber(formatHungarianTaxNumber(e.target.value))}
                            className={inputCls}
                            placeholder="12345678-1-11"
                            maxLength={13}
                          />
                        </div>
                      ) : null}
                      <div>
                        <label className={labelCls}>Kapcsolattartó / átvevő teljes neve *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className={inputCls}
                          placeholder="A futár ezt a nevet látja a szállításnál"
                        />
                      </div>
                    </>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Email cím *</label>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                        className={inputCls}
                        placeholder="pelda@email.hu"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Telefonszám *</label>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(formatHungarianPhone(e.target.value))}
                        className={inputCls}
                        placeholder="+36 30 123 4567"
                      />
                    </div>
                  </div>
                  {!isPickupShipping && !isPersonalPickup ? (
                    <>
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
                    </>
                  ) : isPickupShipping ? (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Csomagpont átvétel</p>
                      {selectedPickupPoint ? (
                        <div className="mt-2">
                          <p className="text-sm font-bold text-slate-900">{selectedPickupPoint.name}</p>
                          <p className="text-sm text-red-950/70">{formatPickupShippingAddress(selectedPickupPoint)}</p>
                          <button
                            type="button"
                            onClick={() => setPickupModalOpen(true)}
                            className="mt-3 text-sm font-semibold text-brand-800 underline"
                          >
                            Másik csomagpont választása
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPickupModalOpen(true)}
                          className="btn-press mt-3 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white"
                        >
                          Válassz csomagpontot a térképen
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Személyes átvétel</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{COMPANY_CONTACT.office}</p>
                      <p className="mt-1 text-xs text-red-950/60">{COMPANY_CONTACT.hours}</p>
                    </div>
                  )}
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
                      <div className={buyerType === "individual" ? "sm:col-span-2" : undefined}>
                        <label className={labelCls}>
                          {buyerType === "company" ? "Számlázási név (cégnév) *" : "Számlázási név *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          className={inputCls}
                          placeholder={buyerType === "company" ? "Példa Kereskedelmi Kft." : "Kovács János"}
                        />
                      </div>
                      {buyerType === "company" ? (
                        <div>
                          <label className={labelCls}>Adószám *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            required
                            value={billingTaxNumber}
                            onChange={(e) => setBillingTaxNumber(formatHungarianTaxNumber(e.target.value))}
                            className={inputCls}
                            placeholder="12345678-1-11"
                            maxLength={13}
                          />
                        </div>
                      ) : null}
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
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-5 text-base font-bold text-slate-900">Szállítási mód</h2>
                <div className="space-y-3">
                  {visibleShippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition sm:items-center sm:gap-4 sm:p-4 ${
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
                        onChange={() => handleShippingMethodChange(option.id)}
                        className="h-4 w-4 accent-brand-800"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900">{option.label}</p>
                          <p className="text-xs text-red-950/60">{option.sub}</p>
                          {shippingCarrierLogos[option.id].length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {shippingCarrierLogos[option.id].map((carrier) => (
                                <span
                                  key={`${option.id}-${carrier.name}`}
                                  className="inline-flex h-7 items-center rounded-md border border-brand-100 bg-white px-2 py-1"
                                  title={carrier.name}
                                >
                                  <img
                                    src={carrier.src}
                                    alt={carrier.name}
                                    className="h-4 max-w-[74px] object-contain"
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      img.style.display = "none";
                                      const fallback = img.nextElementSibling as HTMLElement | null;
                                      if (fallback) fallback.style.display = "inline";
                                    }}
                                  />
                                  <span
                                    style={{ display: "none" }}
                                    className="text-[10px] font-bold uppercase tracking-wide text-red-950/70"
                                  >
                                    {carrier.name}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-sm font-bold text-brand-900">
                          {formatShippingFee(shippingFeeForSubtotal(option.id))}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-slate-900">Fizetési mód</h2>
                  <SimplePayLogoLink />
                </div>
                <div className="space-y-3">
                  {paymentOptions
                    .filter((option) => enabledPaymentMethods.includes(option.id))
                    .map((option) => (
                    <label
                      key={option.id}
                      className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition sm:gap-4 sm:p-4 ${
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
                  <div className="mt-4 space-y-3">
                    <SimplePayCardDeclaration />
                    <p className="text-xs text-red-950/60">
                      A <strong>Fizetés véglegesítése</strong> gombra kattintva a SimplePay biztonságos fizetési oldalára irányítunk. A kártyaadatokat kizárólag a SimplePay rendszere kezeli, azokat nem tároljuk.
                    </p>
                  </div>
                ) : null}

                {payment === "transfer" ? (
                  <div className="mt-4 space-y-2 rounded-xl border border-brand-100 bg-brand-50/30 p-4 text-sm">
                    <p className="font-bold text-slate-900">Bankszámla adatok (EUR)</p>
                    <p className="text-red-950/70">Kedvezményezett: <span className="font-semibold text-slate-900">{BANK_DETAILS.name}</span></p>
                    <p className="font-mono text-red-950/70">Számlaszám: <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.accountNumber}</span></p>
                    <p className="text-red-950/70">Bank: <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.bank}</span></p>
                    <p className="font-mono text-red-950/70">BIC: <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.bic}</span></p>
                    <p className="font-mono text-red-950/70">IBAN: <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.iban}</span></p>
                    <p className="text-xs text-red-950/50">Közleménybe kérjük tüntesd fel a rendelési számodat.</p>
                  </div>
                ) : null}

              </div>
                </>
              ) : (
                <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900">Rendelés összesítő</h2>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("details")}
                      className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
                    >
                      Vissza az adatokhoz
                    </button>
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Vásárló</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {buyerType === "individual" ? name : `${companyName} (${contactName})`}
                      </p>
                      <p className="text-red-950/70">{normalizeEmail(email)}</p>
                      <p className="text-red-950/70">{phone}</p>
                    </div>

                    <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                        {isPickupShipping ? "Csomagpont átvétel" : isPersonalPickup ? "Személyes átvétel" : "Szállítási cím"}
                      </p>
                      <p className="mt-1 text-slate-900">
                        {isPickupShipping && selectedPickupPoint
                          ? `${selectedPickupPoint.name} — ${formatPickupShippingAddress(selectedPickupPoint)}`
                          : isPersonalPickup
                            ? COMPANY_CONTACT.office
                            : `${zip} ${city}, ${street} ${houseNumber}`}
                      </p>
                    </div>

                    <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Számlázás</p>
                      {diffBilling ? (
                        <>
                          <p className="mt-1 text-slate-900">{billingName}</p>
                          {buyerType === "company" ? (
                            <p className="text-red-950/70">Adószám: {billingTaxNumber}</p>
                          ) : null}
                          <p className="text-red-950/70">{billingZip} {billingCity}, {billingStreet} {billingHouseNumber}</p>
                        </>
                      ) : (
                        <p className="mt-1 text-red-950/70">A számlázási cím megegyezik a szállítási címmel.</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Szállítás és fizetés</p>
                      <p className="mt-1 text-slate-900">
                        {shippingOptions.find((option) => option.id === shippingMethod)?.label}
                      </p>
                      <p className="text-red-950/70">
                        {paymentOptions.find((option) => option.id === payment)?.label}
                      </p>
                    </div>

                    {notes.trim() ? (
                      <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Megjegyzés</p>
                        <p className="mt-1 whitespace-pre-wrap text-red-950/70">{notes}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sticky summary */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 text-base font-bold text-slate-900">Rendelés összegzése</h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-gradient-to-br from-brand-50 to-brand-100">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                        {item.sampleTarget ? (
                          <p className="text-xs text-brand-700">{getSampleTargetLabel(item.sampleTarget)}</p>
                        ) : null}
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
                    <span className="text-red-950/60">Adótartalom (ÁFA)</span>
                    <span className="font-semibold">{Math.round(vatContentTotal).toLocaleString("hu-HU")} Ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-950/60">Szállítás</span>
                    <span className={`font-semibold ${shipping === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                      {shipping === 0 ? "Ingyenes" : `${shipping.toLocaleString("hu-HU")} Ft`}
                    </span>
                  </div>
                  {couponDiscount > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-semibold">Kupon ({appliedCoupon?.code})</span>
                      <span className="font-bold text-emerald-700">−{couponDiscount.toLocaleString("hu-HU")} Ft</span>
                    </div>
                  ) : null}
                </div>

                {/* Kupon mező */}
                {!appliedCoupon ? (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs font-semibold text-red-950/70">Kuponkód</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="pl. NYAR2026"
                        className="flex-1 rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
                      />
                      <button
                        type="button"
                        onClick={() => void handleApplyCoupon()}
                        disabled={couponLoading}
                        className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-50"
                      >
                        {couponLoading ? "…" : "Érvényesítés"}
                      </button>
                    </div>
                    {couponError ? <p className="text-xs text-rose-600 font-medium">{couponError}</p> : null}
                    <p className="text-xs text-red-950/40">Leárazott termék esetén kupon nem érvényesíthető.</p>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-bold text-emerald-800">{appliedCoupon.code} – aktív</p>
                      <p className="text-xs text-emerald-700">
                        {appliedCoupon.discount_type === "percent"
                          ? `${appliedCoupon.discount_value}% kedvezmény`
                          : `${Number(appliedCoupon.discount_value).toLocaleString("hu-HU")} Ft kedvezmény`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                      className="text-xs text-emerald-700 underline hover:no-underline"
                    >
                      Eltávolítás
                    </button>
                  </div>
                )}

                <div className="my-4 border-t border-brand-100" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Végösszeg</span>
                  <span className="text-xl font-bold text-brand-900">{total.toLocaleString("hu-HU")} Ft</span>
                </div>

                {checkoutStep === "details" ? (
                  <button
                    type="submit"
                    disabled={items.length === 0}
                    className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-800 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Tovább a rendelés összesítőre
                  </button>
                ) : (
                  <>
                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-300 text-brand-800 accent-brand-800"
                      />
                      <span className="text-sm leading-relaxed text-red-950">
                        Elfogadom az{" "}
                        <Link href="/aszf" target="_blank" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                          Általános Szerződési Feltételeket
                        </Link>
                        , a{" "}
                        <Link href="/aszf#5" target="_blank" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                          szállítási feltételeket
                        </Link>{" "}
                        és az{" "}
                        <Link href="/adatvedelmi" target="_blank" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                          adatvédelmi nyilatkozatot
                        </Link>
                        . *
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || items.length === 0 || !termsAccepted}
                      className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-800 disabled:opacity-50"
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

                    <p className="mt-3 text-center text-xs text-red-950/40">A végösszeg bruttó ár.</p>
                  </>
                )}

                {checkoutStep === "details" ? (
                  <p className="mt-3 text-center text-xs text-red-950/40">A végösszeg bruttó ár.</p>
                ) : null}
              </div>
            </div>
          </div>
        </form>
      </main>

      <PickupPointSelector
        open={pickupModalOpen}
        onClose={() => {
          setPickupModalOpen(false);
          if (shippingMethod === "csomagpont" && !selectedPickupPoint) {
            setShippingMethod("posta");
          }
        }}
        onSelect={(point) => {
          setSelectedPickupPoint(point);
          setShippingMethod("csomagpont");
          setPickupModalOpen(false);
        }}
        selected={selectedPickupPoint}
        searchZip={zip.trim().length === 4 ? zip : undefined}
      />
    </div>
  );
}
