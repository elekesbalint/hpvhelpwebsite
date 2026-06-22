import {
  EU_ABROAD_SHIPPING_FEE,
  FIXED_SHIPPING_ROWS,
  formatShippingFee,
} from "@/lib/shipping/fees";

export default function ShippingFeesTable({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Webáruházi bankkártyás fizetés
      </p>

      <div className="overflow-x-auto rounded-xl border border-brand-200">
        <table className="w-full min-w-[320px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-brand-200 bg-brand-50/60">
              <th className="px-4 py-2.5 font-bold text-brand-900" colSpan={2}>
                Magyarországi szállítási cím
              </th>
            </tr>
          </thead>
          <tbody>
            {FIXED_SHIPPING_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-brand-100 last:border-0">
                <td className="px-4 py-2.5 text-red-950/85">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                  {formatShippingFee(row.fee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3 text-sm">
          <p className="font-bold text-brand-900">EU országbeli szállítási cím</p>
          <p className="mt-1 font-semibold text-slate-900">{formatShippingFee(EU_ABROAD_SHIPPING_FEE)}</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3 text-sm">
          <p className="font-bold text-brand-900">EU területén kívüli szállítási cím</p>
          <p className="mt-1 text-red-950/80">
            Kérjen tőlünk árajánlatot! Egyedi árazás.
          </p>
        </div>
      </div>
    </div>
  );
}
