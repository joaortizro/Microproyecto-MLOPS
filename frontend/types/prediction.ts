import type { OrderInput } from "./order";

export type PredictionSentiment = "positive" | "negative";

export type PredictionReason = {
  factor: string;
  description: string;
  value: number;
  impact: "high" | "medium" | "low" | string;
};

export type Prediction = {
  predicted_score: number;
  negative_probability: number;
  sentiment: PredictionSentiment;
  confidence: number;
  reasons: PredictionReason[];
  status?: string;
  timestamp?: string;
};

export type StoredPrediction = {
  id: string;
  order: OrderInput;
  prediction: Prediction;
  raw_response: unknown;
  created_at: string;
};
