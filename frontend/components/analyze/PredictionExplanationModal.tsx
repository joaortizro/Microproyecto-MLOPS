"use client";

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
  if (!open) return null;

  const sentiment = sentimentFrom(prediction);
  const confidence = confidencePercent(prediction);

  const isPositive = sentiment === "positive";
  const pill = isPositive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-700";

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Full Explanation</p>
              <p className="text-xs text-zinc-600">{orderLabel}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1fr_280px]">
            {/* JSON */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="mb-2 text-xs font-semibold text-zinc-700">Order JSON</p>
              <pre className="max-h-[420px] overflow-auto text-xs text-zinc-800">
                {JSON.stringify(order ?? {}, null, 2)}
              </pre>
            </div>

            {/* Sentiment */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-semibold text-zinc-700">Predictive Sentiment</p>

              <div className="mt-3">
                <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${pill}`}>
                  {isPositive ? "Positive" : "Negative"}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold text-zinc-700">Confidence</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{confidence}%</p>

                <div className="mt-3 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>prob_satisfied</span>
                    <span className="font-mono">{prediction.probability_satisfied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>prob_not_satisfied</span>
                    <span className="font-mono">{prediction.probability_not_satisfied}</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-zinc-600">
                *(Demo)* Luego esto vendrá del backend, pero la UI quedará igual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
