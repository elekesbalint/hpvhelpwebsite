type Props = {
  className?: string;
  /** Nagyobb hangsúly (pl. főoldal szalag) */
  variant?: "default" | "prominent";
};

export default function GuestCheckoutNotice({ className = "", variant = "default" }: Props) {
  const panel =
    variant === "prominent"
      ? "border-brand-300 bg-gradient-to-r from-brand-50 via-white to-brand-50/80 shadow-sm"
      : "border-brand-200 bg-brand-50/80";

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 text-sm sm:px-5 sm:py-4 ${panel} ${className}`.trim()}
      role="status"
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-brand-900">Regisztráció nélkül is rendelhet</p>
          <p className="mt-1 leading-relaxed text-red-950/70">
            A rendeléshez elég a szállítási és kapcsolati adatok kitöltése a fizetésnél – nem kötelező fiókot létrehoznia.
            Ha regisztrál, később egy helyen követheti a rendeléseit.
          </p>
        </div>
      </div>
    </div>
  );
}
