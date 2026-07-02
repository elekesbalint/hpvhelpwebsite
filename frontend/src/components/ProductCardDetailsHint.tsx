import type { MouseEvent } from "react";

/** Hover overlay + „Részletek” gomb a termékkártyákon – jelzi, hogy a kép/kártya kattintható. */
export function ProductCardImageHint() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-900/0 opacity-0 transition duration-300 group-hover:bg-brand-900/35 group-hover:opacity-100"
      aria-hidden="true"
    >
      <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-900 shadow-lg">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
        Részletek
      </span>
    </div>
  );
}

type DetailsButtonProps = {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
};

export function ProductCardDetailsButton({ onClick }: DetailsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-press w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-400 hover:bg-brand-50"
    >
      Részletek →
    </button>
  );
}
