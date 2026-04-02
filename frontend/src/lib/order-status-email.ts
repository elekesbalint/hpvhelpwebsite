"use client";

import emailjs from "@emailjs/browser";

type CourierAssignedParams = {
  orderId: string;
  toEmail: string;
  toName: string;
  orderDate?: string;
  paymentMethod?: string;
  total?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingPhone?: string;
  itemsText?: string;
};

export async function sendCourierAssignedEmail(params: CourierAssignedParams) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  const shippedTemplateId =
    process.env.NEXT_PUBLIC_EMAILJS_SHIPPED_TEMPLATE_ID ??
    process.env.NEXT_PUBLIC_EMAILJS_CUSTOMER_TEMPLATE_ID;

  if (
    !serviceId ||
    !publicKey ||
    !shippedTemplateId ||
    serviceId === "service_xxxxxxx" ||
    shippedTemplateId === "template_xxxxxxx"
  ) {
    return;
  }

  try {
    await emailjs.send(
      serviceId,
      shippedTemplateId,
      {
        to_email: params.toEmail,
        to_name: params.toName,
        email_subject: `Csomagod átadva a futárnak - #${params.orderId
          .slice(0, 8)
          .toUpperCase()}`,
        email_title: "Csomagod átadva a futárnak",
        email_intro:
          "Örömmel értesítjük, hogy rendelésedet átadtuk a futárszolgálatnak.",
        email_note:
          "Innentől a futárszolgálattól fogsz kapni email értesítést a csomag státuszáról.",
        order_id: `#${params.orderId.slice(0, 8).toUpperCase()}`,
        order_date:
          params.orderDate ?? new Date().toLocaleString("hu-HU"),
        payment_method: params.paymentMethod ?? "—",
        total: params.total ?? "—",
        shipping_name: params.shippingName ?? params.toName,
        shipping_address: params.shippingAddress ?? "—",
        shipping_phone: params.shippingPhone ?? "—",
        items_text: params.itemsText ?? "A rendelés részletei a fiókodban érhetők el.",
        title: "Csomagod átadva a futárnak",
      },
      publicKey
    );
  } catch (err) {
    console.error("EmailJS shipped email error:", err);
  }
}
