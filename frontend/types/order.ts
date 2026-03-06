export type DeliveryInput = {
  purchase_date: string | null;
  promised_date: string | null;
  dispatched_date: string | null;
  delivered_date: string | null;
};

export type FinancialsInput = {
  order_total: number | null;
  shipping_cost: number | null;
  payment_installments: number | null;
  currency: string | null;
};

export type LocationInput = {
  distance_km: number | null;
};

export type ItemInput = {
  weight_g: number | null;
  description_length: number | null;
  media_count: number | null;
};

export type ReviewInput = {
  text: string;
};

export type OrderInput = {
  delivery: DeliveryInput;
  financials: FinancialsInput;
  location: LocationInput;
  item: ItemInput;
  review: ReviewInput;
};

export type AnalyzePayload = OrderInput;
