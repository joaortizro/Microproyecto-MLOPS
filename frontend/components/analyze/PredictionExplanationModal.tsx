"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { OrderInput } from "../../types/order";
import type { Prediction, PredictionReason } from "../../types/prediction";

type Props = {
  open: boolean;
  onClose: () => void;
  order: OrderInput | null;
  prediction: Prediction;
  orderLabel: string;
};

function sortReasonsByMagnitude(reasons: PredictionReason[]) {
  return [...reasons].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function formatFactor(factor: string) {
  return factor.replace(/_/g, " ");
}

function impactClass(impact: string) {
  const i = impact.toLowerCase();
  if (i === "high") return "bg-red-100 text-red-700";
  if (i === "medium") return "bg-amber-100 text-amber-700";
  return "bg-zinc-100 text-zinc-700";
}

export function PredictionExplanationModal({ open, onClose, order, prediction, orderLabel }: Props) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const reasons = useMemo(() => sortReasonsByMagnitude(prediction.reasons), [prediction.reasons]);

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

  const isPositive = prediction.sentiment === "positive";
  const confidence = Math.round(prediction.confidence * 100);

  const pill = isPositive ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
  const confidenceFill = isPositive ? "bg-emerald-500" : "bg-red-500";

  return (
    <div className="fixed inset-0 z-50">
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
          className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white/95 shadow-xl ring-1 ring-black/10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
            <div className="min-w-0">
              <p id={titleId} className="text-sm font-semibold text-[var(--color-dark-purple)]">
                Explicación completa
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
              aria-label="Cerrar modal"
            >
              <FiX className="h-4 w-4" aria-hidden="true" />
              Cerrar
            </button>
          </div>

          <div className="max-h-[85vh] overflow-auto">
            <div className="grid gap-4 p-5 lg:grid-cols-[320px_1fr]">
              <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-black/5">
                <p className="mb-2 text-xs font-semibold text-[rgba(33,11,44,0.78)]">JSON de la orden</p>

                <pre className="max-h-[360px] overflow-auto rounded-xl bg-[var(--color-purple-soft-12)] p-3 text-[11px] text-[var(--color-dark-purple)] opacity-90 ring-1 ring-black/5">
                  {JSON.stringify(order ?? {}, null, 2)}
                </pre>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-black/5">
                  <p className="text-xs font-semibold text-[rgba(33,11,44,0.78)]">Sentimiento predictivo</p>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-black/10",
                          pill,
                        ].join(" ")}
                      >
                        {prediction.sentiment.toUpperCase()}
                      </div>

                      <p className="mt-3 text-4xl font-semibold tabular-nums text-[var(--color-dark-purple)]">
                        {confidence}%
                      </p>
                      <p className="text-xs text-[rgba(33,11,44,0.7)]">Confianza</p>
                    </div>

                    <div className="w-full max-w-[260px]">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-dark-purple-soft-08)] ring-1 ring-black/5">
                        <div
                          className={["h-full rounded-full", confidenceFill].join(" ")}
                          style={{ width: `${confidence}%` }}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="mt-3 space-y-2 text-xs text-[rgba(33,11,44,0.74)]">
                        <div className="flex items-center justify-between gap-3">
                          <span>predicted_score</span>
                          <span className="font-mono tabular-nums text-[rgba(33,11,44,0.9)]">
                            {prediction.predicted_score}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>negative_probability</span>
                          <span className="font-mono tabular-nums text-[rgba(33,11,44,0.9)]">
                            {prediction.negative_probability.toFixed(4)}
                          </span>
                        </div>
                        {prediction.status ? (
                          <div className="flex items-center justify-between gap-3">
                            <span>status</span>
                            <span className="font-mono tabular-nums text-[rgba(33,11,44,0.9)]">{prediction.status}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-black/5">
                  <p className="text-xs font-semibold text-[rgba(33,11,44,0.78)]">Razones principales (todas)</p>

                  {reasons.length === 0 ? (
                    <p className="mt-3 text-xs text-[rgba(33,11,44,0.65)]">No se recibieron razones del backend.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {reasons.map((reason, idx) => (
                        <div
                          key={`${reason.factor}-${idx}`}
                          className="rounded-xl bg-[var(--color-purple-soft-12)] p-3 ring-1 ring-black/5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--color-dark-purple)]">
                              {idx + 1}. {formatFactor(reason.factor)}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={[
                                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                  impactClass(reason.impact),
                                ].join(" ")}
                              >
                                {reason.impact}
                              </span>
                              <span className="text-xs font-mono tabular-nums text-[rgba(33,11,44,0.85)]">
                                {reason.value}
                              </span>
                            </div>
                          </div>

                          {reason.description ? (
                            <p className="mt-1 text-xs text-[rgba(33,11,44,0.72)]">{reason.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
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
