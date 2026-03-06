import type { AnalyzePayload } from "../types/order";
import type { Prediction } from "../types/prediction";

function normalizeText(s: string) {
  return (s || "").toLowerCase();
}

export function mockPredict(payload: AnalyzePayload): Prediction {
  const txt = normalizeText(payload.review.text);
  const negativeHints = ["late", "delay", "damaged", "broken", "malo", "mal", "tarde", "dañado", "defect"];
  const negative = negativeHints.some((k) => txt.includes(k));

  const negativeProbability = negative ? 0.78 : 0.18;
  const sentiment = negative ? "negative" : "positive";

  return {
    predicted_score: negative ? 2 : 5,
    negative_probability: negativeProbability,
    sentiment,
    confidence: negative ? negativeProbability : 1 - negativeProbability,
    reasons: [],
  };
}
