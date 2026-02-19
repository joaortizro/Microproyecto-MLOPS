export type Prediction = {
  prediction: 0 | 1;
  label: "SATISFECHO" | "NO_SATISFECHO";
  probability_satisfied: number; // 0..1
  probability_not_satisfied: number; // 0..1
};

export type SinglePredictionResponse = Prediction;

export type BatchPredictionResponse = {
  predictions: Prediction[];
};
