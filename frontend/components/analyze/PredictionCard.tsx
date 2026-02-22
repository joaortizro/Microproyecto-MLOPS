"use client";

import { useMemo, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import type { OrderInput } from "../../types/order";
import type { Prediction } from "../../types/prediction";
import { PredictionExplanationModal } from "./PredictionExplanationModal";

type Props = {
  order: OrderInput | null;
  prediction: Prediction;
  index: number;
};

function sentimentFrom(p: Prediction) {
  return p.prediction === 1 ? "positive" : "negative";
}

function confidencePercent(p: Prediction) {
  const s = sentimentFrom(p);
  const conf = s === "positive" ? p.probability_satisfied : p.probability_not_satisfied;
  return Math.round(conf * 100);
}

function formatMoney(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function StarsReadOnly({ value }: { value: number | null }) {
  const v = value ?? 0;

  return (
    <div className="flex items-center gap-0.5" aria-label={`Review score: ${value ?? "N/A"} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = v >= n;
        return filled ? (
          <FaStar key={n} className="h-4 w-4 text-[var(--color-accent-yellow)]" />
        ) : (
          <FaRegStar key={n} className="h-4 w-4 text-[rgba(33,11,44,0.18)]" />
        );
      })}
    </div>
  );
}

export function PredictionCard({ order, prediction, index }: Props) {
  const [open, setOpen] = useState(false);

  const sentiment = sentimentFrom(prediction);
  const confidence = confidencePercent(prediction);
  const isPositive = sentiment === "positive";

  const orderId = order?.order_id?.trim() ? order.order_id : null;

  const orderLabel = useMemo(() => {
    return orderId ? `Order: ${orderId}` : `Order: #${index + 1}`;
  }, [orderId, index]);

  const message = order?.review_comment_message?.trim() || "—";
  const payment = order?.payment_type ?? "unknown";
  const states =
    order?.seller_state && order?.customer_state
      ? `${order.seller_state} → ${order.customer_state}`
      : "—";

  const price = formatMoney(order?.price ?? null);
  const freight = formatMoney(order?.freight_value ?? null);

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
          // Barra izquierda inset
          "before:absolute before:left-4 before:top-4 before:bottom-4 before:w-2 before:rounded-full",
          accentBar,
        ].join(" ")}
      >
        {/* Más espacio después de la barra */}
        <div className="px-5 py-5 pl-12">
          {/* Top: estrellas izquierda, order centrado, pill derecha */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <StarsReadOnly value={order?.review_score ?? null} />

            <div className="min-w-0 text-center">
              <span className="truncate text-sm font-semibold text-[var(--color-dark-purple)]">
                {orderLabel}
              </span>
            </div>

            <div
              className={[
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-black/10",
                sentimentPill,
              ].join(" ")}
              aria-label={`Sentiment: ${sentiment}`}
            >
              {isPositive ? "Positive" : "Negative"}
            </div>
          </div>

          {/* Confidence */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-[rgba(33,11,44,0.72)]">
              <span className="font-semibold text-[rgba(33,11,44,0.82)]">Confidence</span>
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

          {/* Message */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-[var(--color-dark-purple)]">Message</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[rgba(33,11,44,0.78)]">{message}</p>
          </div>

          {/* Extra info */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className={`${chipBase} bg-[var(--color-purple-soft-12)] text-[var(--color-dark-purple)]`}>
              {states}
            </span>
            <span className={`${chipBase} bg-[var(--color-purple-soft-12)] text-[var(--color-dark-purple)]`}>
              payment: <span className="ml-1 tabular-nums">{payment}</span>
            </span>
            <span className={`${chipBase} bg-[var(--color-purple-soft-12)] text-[var(--color-dark-purple)]`}>
              price: <span className="ml-1 tabular-nums">{price}</span>
            </span>
            <span className={`${chipBase} bg-[var(--color-purple-soft-12)] text-[var(--color-dark-purple)]`}>
              freight: <span className="ml-1 tabular-nums">{freight}</span>
            </span>
          </div>

          {/* CTA (morado oscuro + blanco) */}
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
              View Explanation
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