"use client";

import { useEffect, useId, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { OrderInput } from "../../types/order";
import type { Prediction } from "../../types/prediction";

type Props = {
  open: boolean;
  onClose: () => void;
  order: OrderInput | null;
  prediction: Prediction;
  orderLabel: string;
};

function sentimentFrom(p: Prediction) {
  return p.prediction === 1 ? "positive" : "negative";
}

function confidencePercent(p: Prediction) {
  const s = sentimentFrom(p);
  const conf = s === "positive" ? p.probability_satisfied : p.probability_not_satisfied;
  return Math.round(conf * 100);
}

export function PredictionExplanationModal({ open, onClose, order, prediction, orderLabel }: Props) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sentiment = sentimentFrom(prediction);
  const confidence = confidencePercent(prediction);
  const isPositive = sentiment === "positive";

  // ✅ Positive = verde, Negative = rojo
  const pill = isPositive ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
  const confidenceFill = isPositive ? "bg-emerald-500" : "bg-red-500";

  // Reasons demo (solo UI; luego vendrá del backend)
  const reasons: string[] = isPositive
    ? ["Review score", "Payment type", "Freight value", "Seller → Customer", "Review message"]
    : ["Review score", "Freight value", "Seller → Customer", "Payment type", "Review message"];

  // Sutil, pero coherente con el sentimiento (si quieres morado fijo, cambia esto a purple-soft)
  const reasonPill = isPositive
    ? "bg-[rgba(16,185,129,0.12)] text-[var(--color-dark-purple)]"
    : "bg-[rgba(239,68,68,0.12)] text-[var(--color-dark-purple)]";

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(33,11,44,0.45)] backdrop-blur-[2px]"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white/95 shadow-xl ring-1 ring-black/10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
            <div className="min-w-0">
              <p id={titleId} className="text-sm font-semibold text-[var(--color-dark-purple)]">
                Full Explanation
              </p>
              <p className="truncate text-xs text-[rgba(33,11,44,0.72)]">{orderLabel}</p>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                "bg-white/80 text-[var(--color-dark-purple)] ring-1 ring-black/5",
                "hover:bg-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
              ].join(" ")}
              aria-label="Close modal"
            >
              <FiX className="h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[85vh] overflow-auto">
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_300px]">
              {/* JSON panel */}
              <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-black/5">
                <p className="mb-2 text-xs font-semibold text-[rgba(33,11,44,0.78)]">Order JSON</p>

                <pre className="max-h-[420px] overflow-auto rounded-xl bg-[var(--color-purple-soft-12)] p-3 text-xs text-[var(--color-dark-purple)] opacity-90 ring-1 ring-black/5">
                  {JSON.stringify(order ?? {}, null, 2)}
                </pre>
              </div>

              {/* Sentiment panel */}
              <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-black/5">
                <p className="text-xs font-semibold text-[rgba(33,11,44,0.78)]">Predictive Sentiment</p>

                <div className="mt-3">
                  <div
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-black/10",
                      pill,
                    ].join(" ")}
                  >
                    {isPositive ? "Positive" : "Negative"}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[var(--color-purple-soft-12)] p-4 ring-1 ring-black/5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[rgba(33,11,44,0.78)]">Confidence</p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--color-dark-purple)] tabular-nums">
                        {confidence}%
                      </p>
                    </div>

                    <div className="w-[120px]">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-dark-purple-soft-08)] ring-1 ring-black/5">
                        <div
                          className={["h-full rounded-full", confidenceFill].join(" ")}
                          style={{ width: `${confidence}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-[rgba(33,11,44,0.72)]">
                    <div className="flex items-center justify-between gap-3">
                      <span>prob_satisfied</span>
                      <span className="font-mono tabular-nums text-[rgba(33,11,44,0.82)]">
                        {prediction.probability_satisfied}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>prob_not_satisfied</span>
                      <span className="font-mono tabular-nums text-[rgba(33,11,44,0.82)]">
                        {prediction.probability_not_satisfied}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-[rgba(33,11,44,0.68)]">
                  *(Demo)* Luego esto vendrá del backend, pero la UI quedará igual.
                </p>

                {/* Main reasons (demo) */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-[rgba(33,11,44,0.78)]">Main reasons</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="list" aria-label="Main reasons">
                    {reasons.map((r) => (
                      <span
                        key={r}
                        className={[
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          "ring-1 ring-black/5",
                          reasonPill,
                        ].join(" ")}
                        role="listitem"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-2 bg-transparent" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
