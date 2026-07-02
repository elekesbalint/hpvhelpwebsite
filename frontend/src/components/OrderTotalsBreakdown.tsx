import type { Database } from "@/types/supabase";

type OrderTotals = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  "subtotal" | "total" | "discount" | "coupon_code" | "currency"
>;

export function orderShippingGross(order: OrderTotals): number {
  return Math.max(
    0,
    Number(order.total) - Number(order.subtotal) + Number(order.discount ?? 0),
  );
}

type Props = {
  order: OrderTotals;
  className?: string;
};

export function OrderTotalsBreakdown({ order, className = "" }: Props) {
  const subtotal = Number(order.subtotal);
  const total = Number(order.total);
  const discount = Number(order.discount ?? 0);
  const shipping = orderShippingGross(order);
  const currency = order.currency ?? "HUF";
  const showBreakdown = shipping > 0 || discount > 0;

  const fmt = (amount: number) => `${Math.round(amount).toLocaleString("hu-HU")} ${currency}`;

  return (
    <div className={`space-y-2 border-t border-brand-100 pt-3 ${className}`.trim()}>
      {showBreakdown ? (
        <div className="flex items-center justify-between text-sm text-red-950/60">
          <p>Részösszeg</p>
          <p>{fmt(subtotal)}</p>
        </div>
      ) : null}
      {shipping > 0 ? (
        <div className="flex items-center justify-between text-sm text-red-950/60">
          <p>Szállítás</p>
          <p>{fmt(shipping)}</p>
        </div>
      ) : null}
      {discount > 0 ? (
        <div className="flex items-center justify-between text-sm text-emerald-700">
          <p>
            Kupon kedvezmény
            {order.coupon_code ? (
              <span className="ml-1.5 font-mono text-xs font-bold">({order.coupon_code})</span>
            ) : null}
          </p>
          <p>−{fmt(discount)}</p>
        </div>
      ) : null}
      <div className="flex items-center justify-between pt-1">
        <p className="text-sm font-bold text-slate-900">Végösszeg</p>
        <p className="text-lg font-bold text-brand-900">{fmt(total)}</p>
      </div>
    </div>
  );
}

export default OrderTotalsBreakdown;
