import type { StoredPrediction } from "../../types/prediction";
import { PredictionCard } from "./PredictionCard";

export function PredictionList({ items }: { items: StoredPrediction[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <PredictionCard key={item.id} index={idx} item={item} />
      ))}
    </div>
  );
}
