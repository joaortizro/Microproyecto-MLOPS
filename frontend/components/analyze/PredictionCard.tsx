"use client";

import { useMemo, useState } from "react";
import { FiStar } from "react-icons/fi";
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
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          className={[
            "h-4 w-4",
            v >= n ? "text-amber-500" : "text-zinc-300",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

export function PredictionCard({ order, prediction, index }: Props) {
  const [open, setOpen] = useState(false);

  const sentiment = sentimentFrom(prediction);
  const confidence = confidencePercent(prediction);

  const isPositive = sentiment === "positive";

  const rail = isPositive ? "border-emerald-500" : "border-red-500";
  const badge = isPositive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-700";

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

  return (
    <>
      <div className={`rounded-3xl border border-zinc-200 bg-white shadow-sm border-l-4 ${rail}`}>
        <div className="p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <StarsReadOnly value={order?.review_score ?? null} />
                <span className="text-sm font-semibold text-zinc-900">{orderLabel}</span>
              </div>

              <div className="text-xs text-zinc-600">
                <span className="font-semibold text-zinc-700">Confidence:</span> {confidence}%
              </div>
            </div>

            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
              {sentiment}
            </div>
          </div>

          {/* Message */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-zinc-900">Message</p>
            <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">{message}</p>
          </div>

          {/* extra info */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-zinc-50 px-3 py-1 font-semibold text-zinc-700">
              {states}
            </span>
            <span className="rounded-full bg-zinc-50 px-3 py-1 font-semibold text-zinc-700">
              payment: {payment}
            </span>
            <span className="rounded-full bg-zinc-50 px-3 py-1 font-semibold text-zinc-700">
              price: {price}
            </span>
            <span className="rounded-full bg-zinc-50 px-3 py-1 font-semibold text-zinc-700">
              freight: {freight}
            </span>
          </div>

          {/* CTA */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              View Full Explanation
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
