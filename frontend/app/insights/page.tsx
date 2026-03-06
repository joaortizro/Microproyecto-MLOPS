"use client";

import { useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { AnimatedIn } from "../../components/AnimatedIn";
import type { PredictionReason, StoredPrediction } from "../../types/prediction";

const STORAGE_KEY = "hybrid_prediction_history_v1";

type AggregatedReason = {
  factor: string;
  totalValue: number;
  absTotalValue: number;
  count: number;
  impact: "high" | "medium" | "low";
};

function impactRank(impact: string) {
  if (impact === "high") return 3;
  if (impact === "medium") return 2;
  return 1;
}

function toImpactLabel(impact: string): "high" | "medium" | "low" {
  if (impact === "high" || impact === "medium" || impact === "low") return impact;
  return "low";
}

function formatFactorName(factor: string) {
  return factor.replace(/_/g, " ");
}

function loadStoredPredictions(): StoredPrediction[] {
  if (typeof window === "undefined") return [];

  try {
    const rawLocal = window.localStorage.getItem(STORAGE_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      return Array.isArray(parsed) ? (parsed as StoredPrediction[]) : [];
    }

    const rawSession = window.sessionStorage.getItem(STORAGE_KEY);
    if (!rawSession) return [];
    const parsed = JSON.parse(rawSession);
    if (!Array.isArray(parsed)) return [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed as StoredPrediction[];
  } catch {
    return [];
  }
}

function aggregateReasons(items: StoredPrediction[]) {
  const map = new Map<string, AggregatedReason>();

  for (const item of items) {
    const reasons = Array.isArray(item?.prediction?.reasons) ? item.prediction.reasons : [];

    for (const reason of reasons) {
      const r = reason as PredictionReason;
      const current = map.get(r.factor);
      const impact = toImpactLabel((r.impact ?? "low").toLowerCase());

      if (!current) {
        map.set(r.factor, {
          factor: r.factor,
          totalValue: r.value,
          absTotalValue: Math.abs(r.value),
          count: 1,
          impact,
        });
        continue;
      }

      const totalValue = current.totalValue + r.value;
      map.set(r.factor, {
        factor: current.factor,
        totalValue,
        absTotalValue: Math.abs(totalValue),
        count: current.count + 1,
        impact: impactRank(impact) > impactRank(current.impact) ? impact : current.impact,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.absTotalValue - a.absTotalValue);
}

export default function InsightsPage() {
  const [items] = useState<StoredPrediction[]>(() => loadStoredPredictions());

  const aggregatedReasons = useMemo(() => aggregateReasons(items), [items]);

  return (
    <AnimatedIn>
      <div className="space-y-8">
        <PageHeader
          title="Insights"
          subtitle="Vista acumulada de razones basada en predicciones guardadas localmente."
        />

        {items.length === 0 ? (
          <Card title="Sin predicciones todavía">
            <p className="text-sm text-zinc-700">
              Aún no hay datos para mostrar. Ve a Analyze, envía al menos una predicción y vuelve aquí.
            </p>
          </Card>
        ) : (
          <Card title="Razones acumuladas">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold ring-1 ring-zinc-200">
                Predicciones: {items.length}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold ring-1 ring-zinc-200">
                Factores únicos: {aggregatedReasons.length}
              </span>
            </div>

            <div className="space-y-2">
              {aggregatedReasons.map((reason) => {
                const isPositive = reason.totalValue >= 0;
                const impactClass =
                  reason.impact === "high"
                    ? "bg-red-100 text-red-700"
                    : reason.impact === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-zinc-100 text-zinc-700";

                return (
                  <div
                    key={reason.factor}
                    className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--color-dark-purple)]">
                        {formatFactorName(reason.factor)}
                      </p>

                      <div className="flex items-center gap-2 text-xs">
                        <span className={["rounded-full px-2.5 py-1 font-semibold", impactClass].join(" ")}>
                          {reason.impact}
                        </span>
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 font-mono font-semibold",
                            isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                          ].join(" ")}
                        >
                          total: {reason.totalValue.toFixed(2)}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono font-semibold text-zinc-700">
                          |abs|: {reason.absTotalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-zinc-600">Apariciones acumuladas: {reason.count}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AnimatedIn>
  );
}
