
export type OrderStatus =
  | "created"
  | "approved"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled"
  | "unknown";

export type PaymentType = "credit_card" | "boleto" | "debit_card" | "pix" | "unknown";

export type OrderInput = {
  // Required-ish (pero permitimos null para demo/import)
  order_purchase_timestamp: string | null;
  order_approved_at: string | null;
  order_delivered_carrier_date: string | null;
  order_delivered_customer_date: string | null;
  order_estimated_delivery_date: string | null;
  shipping_limit_date: string | null;

  // Product / financial
  product_length_cm: number | null;
  product_height_cm: number | null;
  product_width_cm: number | null;
  price: number | null;
  freight_value: number | null;

  // Location / meta
  customer_state: string | null;
  seller_state: string | null;
  payment_type: PaymentType | null;
  product_category_name: string | null;

  // Requested extra fields (main)
  review_score: number | null; // 0..5
  review_comment_message: string;
  order_status: OrderStatus;

  
  order_id: string | null;

};

export type SingleOrderPayload = { order: { order: OrderInput } | OrderInput };
export type BatchOrderPayload = { orders: OrderInput[] };
export type AnalyzePayload = SingleOrderPayload | BatchOrderPayload;
