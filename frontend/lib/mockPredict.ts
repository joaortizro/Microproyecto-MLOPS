import type { AnalyzePayload, OrderInput } from "../types/order";
import type { BatchPredictionResponse, Prediction, SinglePredictionResponse } from "../types/prediction";

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeText(s: string) {
  return (s || "").toLowerCase();
}

function scoreOrder(o: OrderInput) {
  // Heurística simple demo (luego se reemplaza por API)
  let risk = 0;

  // review_score: bajo => más riesgo
  if (o.review_score !== null) {
    if (o.review_score <= 2) risk += 3;
    else if (o.review_score === 3) risk += 1;
  }

  // status
  if (o.order_status === "canceled") risk += 4;
  if (o.order_status === "shipped") risk += 1;

  // texto review
  const txt = normalizeText(o.review_comment_message);
  const negativeHints = ["late", "delay", "damaged", "broken", "malo", "mal", "tarde", "dañado", "defect"];
  if (negativeHints.some((k) => txt.includes(k))) risk += 2;

  // costo flete vs precio
  if (o.price !== null && o.freight_value !== null && o.price > 0) {
    const ratio = o.freight_value / o.price;
    if (ratio >= 0.5) risk += 2;
    else if (ratio >= 0.25) risk += 1;
  }

  // faltantes críticos (para demo)
  const missingCritical =
    !o.order_purchase_timestamp || !o.order_estimated_delivery_date || o.price === null;
  if (missingCritical) risk += 1;

  return risk;
}

function predictOne(o: OrderInput): Prediction {
  const risk = scoreOrder(o);

  // Convertimos "risk" a probabilidad (demo)
  // risk alto => probability_not_satisfied alta
  const pNot = clamp01(0.15 + risk * 0.12);
  const pSat = clamp01(1 - pNot);

  const prediction: 0 | 1 = pSat >= 0.5 ? 1 : 0;
  const label = prediction === 1 ? "SATISFECHO" : "NO_SATISFECHO";

  return {
    prediction,
    label,
    probability_satisfied: Number(pSat.toFixed(2)),
    probability_not_satisfied: Number((1 - pSat).toFixed(2)),
  };
}

export function mockPredict(payload: AnalyzePayload): SinglePredictionResponse | BatchPredictionResponse {
  if ("orders" in payload) {
    return {
      predictions: payload.orders.map(predictOne),
    };
  }

  const maybeOrder = (payload as any).order;
  // tolerante: { order: OrderInput } o { order: { order: OrderInput } }
  const order: OrderInput = maybeOrder?.order ?? maybeOrder;

  return predictOne(order);
}
