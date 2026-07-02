import { formatSimplePayTransactionId } from "@/lib/simplepay-legal";

export default function SimplePayTransactionId({
  transactionId,
  className = "text-sm text-red-950/70",
}: {
  transactionId?: string | null;
  className?: string;
}) {
  const id = formatSimplePayTransactionId(transactionId);
  if (!id) return null;

  return (
    <p className={className}>
      SimplePay tranzakció azonosító:{" "}
      <span className="font-mono font-semibold text-slate-900">{id}</span>
    </p>
  );
}
