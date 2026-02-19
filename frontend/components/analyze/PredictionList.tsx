import type { OrderInput } from "../../types/order";
import type { Prediction } from "../../types/prediction";
import { PredictionCard } from "./PredictionCard";

export function PredictionList({
  orders,
  predictions,
}: {
  orders: OrderInput[];
  predictions: Prediction[];
}) {
  return (
    <div className="space-y-4">
      {predictions.map((p, idx) => (
        <PredictionCard
          key={idx}
          index={idx}
          prediction={p}
          order={orders[idx] ?? null}
        />
      ))}
    </div>
  );
}
