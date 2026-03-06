"use client";

import { useMemo, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import type { PredictionReason, StoredPrediction } from "../../types/prediction";
import { PredictionExplanationModal } from "./PredictionExplanationModal";

type Props = {
  item: StoredPrediction;
  index: number;
};

function sortReasonsByMagnitude(reasons: PredictionReason[]) {
  return [...reasons].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function formatFactor(factor: string) {
  return factor.replace(/_/g, " ");
}

export function PredictionCard({ item, index }: Props) {
  const [open, setOpen] = useState(false);

  const { order, prediction } = item;
  const isPositive = prediction.sentiment === "positive";
  const confidence = Math.round(prediction.confidence * 100);

  const topReasons = useMemo(
    () => sortReasonsByMagnitude(prediction.reasons).slice(0, 5),
    [prediction.reasons]
  );

  const orderLabel = useMemo(() => `Orden #${index + 1}`, [index]);

  const message = order.review.text?.trim() || "—";

  const accentBar = isPositive ? "before:bg-emerald-500" : "before:bg-red-500";
  const sentimentPill = isPositive ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
  const confidenceFill = isPositive ? "bg-emerald-500" : "bg-red-500";

  const chipBase =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/5";

  // Positive = verde, Negative = rojo
  const accentBar = isPositive ? "before:bg-emerald-500" : "before:bg-red-500";
  const sentimentPill = isPositive ? "bg-emerald-500 text-white" : "bg-red-500 text-white";
  const confidenceFill = isPositive ? "bg-emerald-500" : "bg-red-500";

  const chipBase =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/5";

  return (
    <>
      <div
        className={[
          "relative overflow-hidden rounded-3xl bg-white/95 shadow-sm ring-1 ring-black/5",
          "before:absolute before:left-4 before:top-4 before:bottom-4 before:w-2 before:rounded-full",
          accentBar,
        ].join(" ")}
      >
        <div className="px-5 py-5 pl-12">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <span className="truncate text-sm font-semibold text-[var(--color-dark-purple)]">{orderLabel}</span>
            </div>

            <div
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/10",
                sentimentPill,
              ].join(" ")}
              aria-label={`Sentimiento: ${prediction.sentiment}`}
            >
              {isPositive ? "Positivo" : "Negativo"}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-[rgba(33,11,44,0.72)]">
              <span className="font-semibold text-[rgba(33,11,44,0.82)]">Confianza</span>
              <span className="tabular-nums">{confidence}%</span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-dark-purple-soft-08)] ring-1 ring-black/5">
              <div
                className={["h-full rounded-full", confidenceFill].join(" ")}
                style={{ width: `${confidence}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--color-dark-purple)]">Reseña</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[rgba(33,11,44,0.78)]">{message}</p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--color-dark-purple)]">Top 5 razones</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {topReasons.length === 0 ? (
                <span className="text-xs text-[rgba(33,11,44,0.6)]">No se recibieron razones.</span>
              ) : (
                topReasons.map((reason) => (
                  <span
                    key={`${item.id}-${reason.factor}`}
                    className={`${chipBase} ${isPositive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
                  >
                    {formatFactor(reason.factor)}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-start">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-xl px-4",
                "bg-[var(--color-dark-purple)] text-white shadow-sm ring-1 ring-black/10",
                "transition-colors hover:bg-[rgba(33,11,44,0.92)] active:bg-[rgba(33,11,44,0.86)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
            >
              Ver explicación
              <FiArrowUpRight className="h-4 w-4 opacity-90" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <PredictionExplanationModal
        open={open}
        onClose={() => setOpen(false)}
        order={order}
        prediction={prediction}
        orderLabel={orderLabel}
      />
    </>
  );
}
