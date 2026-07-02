export const ORDER_CONFIRMATION_TITLE = "Rendelés sikeresen leadva!";

export const ORDER_CONFIRMATION_SUBTITLE =
  "Köszönjük vásárlását! Rendelését sikeresen fogadtuk.";

export const ORDER_CONFIRMATION_IMPORTANT_NOTES = [
  "A munkanapokon, 14 óra előtt leadott megrendelést a kiválasztott futárcég munkatársa szállítja a rendelésben feltüntetett szállítási címre a következő munkanapon.",
  "A futárcégtől elektronikus úton értesítést kap a kiszállítás állapotának folyamatában. (pl. várható szállítási időpont vagy csomag elhelyezése az automatába)",
] as const;

export function orderConfirmationImportantNotesHtml(publicOrderLabel: string): string {
  const safeLabel = publicOrderLabel
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const items = [
    ...ORDER_CONFIRMATION_IMPORTANT_NOTES,
    `Kérdés esetén hivatkozzon a rendelésszámra: ${safeLabel}`,
  ];
  const lis = items
    .map((text) => `<li style="margin:0 0 8px">${text}</li>`)
    .join("");
  return `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0">
    <p style="margin:0 0 8px;font-weight:700;color:#92400e">Fontos tudnivalók</p>
    <ul style="margin:0;padding-left:18px;color:#92400e;font-size:14px;line-height:1.5">${lis}</ul>
  </div>`;
}
