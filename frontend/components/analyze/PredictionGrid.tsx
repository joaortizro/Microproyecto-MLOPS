import { Card } from "../Card";
import type { Prediction } from "../../types/prediction";

export function PredictionGrid({ predictions }: { predictions: Prediction[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {predictions.map((p, idx) => (
        <Card key={idx} title={`Prediction ${idx + 1}`}>
          <div className="space-y-2 text-sm text-zinc-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900">{p.sentiment}</span>
              <span className="font-mono">{Math.round(p.confidence * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>predicted_score</span>
              <span className="font-mono">{p.predicted_score}</span>
            </div>
            <div className="flex justify-between">
              <span>negative_probability</span>
              <span className="font-mono">{p.negative_probability}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
