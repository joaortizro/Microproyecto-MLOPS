import { Card } from "../Card";
import type { Prediction } from "../../types/prediction";

export function PredictionGrid({ predictions }: { predictions: Prediction[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {predictions.map((p, idx) => (
        <Card key={idx} title={`Prediction ${idx + 1}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">{p.label}</span>
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  p.prediction === 1
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700",
                ].join(" ")}
              >
                {p.prediction === 1 ? "Satisfecho" : "No satisfecho"}
              </span>
            </div>

            <div className="text-sm text-zinc-700">
              <div className="flex justify-between">
                <span>prob_satisfied</span>
                <span className="font-mono">{p.probability_satisfied}</span>
              </div>
              <div className="flex justify-between">
                <span>prob_not_satisfied</span>
                <span className="font-mono">{p.probability_not_satisfied}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
