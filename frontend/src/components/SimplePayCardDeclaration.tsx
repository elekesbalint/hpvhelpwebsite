import Link from "next/link";
import {
  SIMPLEPAY_BUYER_AFF_URL,
  SIMPLEPAY_CARD_PAYMENT_INTRO,
  SIMPLEPAY_DATA_TRANSFER_CONSENT,
  SIMPLEPAY_TRANSFERRED_DATA_ITEMS,
} from "@/lib/simplepay-legal";

/** Checkout / fizetési mód: SimplePay adattovábbítási nyilatkozat (support követelmény). */
export default function SimplePayCardDeclaration({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`space-y-3 text-xs leading-relaxed text-red-950/80 ${compact ? "" : "rounded-xl border border-brand-100 bg-brand-50 p-4"}`}
    >
      <p>{SIMPLEPAY_CARD_PAYMENT_INTRO}</p>
      <p>{SIMPLEPAY_DATA_TRANSFER_CONSENT}</p>
      <div>
        <p className="font-semibold text-red-950">Az adatkezelő által továbbított adatok köre:</p>
        <ul className="ml-5 mt-1 list-disc space-y-0.5">
          {SIMPLEPAY_TRANSFERRED_DATA_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p>
        Az adatfeldolgozó által végzett adatfeldolgozási tevékenység jellege és célja a SimplePay Adatkezelési
        tájékoztatóban, az alábbi linken tekinthető meg:{" "}
        <Link
          href={SIMPLEPAY_BUYER_AFF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-800 underline underline-offset-2"
        >
          simplepay.hu/vasarlo-aff
        </Link>
      </p>
    </div>
  );
}
