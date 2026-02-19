"use client";

import { useMemo, useState } from "react";
import type { AnalyzePayload, OrderInput, OrderStatus, PaymentType } from "../../types/order";
import type { Prediction } from "../../types/prediction";
import { mockPredict } from "../../lib/mockPredict";
import { PredictionGrid } from "./PredictionGrid";
import { StarRating } from "./StarRating";
import { JsonPanel } from "./JsonPanel";
import { PredictionList } from "./PredictionList";

function emptyOrder(): OrderInput {
  return {
    order_id: null,

    order_purchase_timestamp: null,
    order_approved_at: null,
    order_delivered_carrier_date: null,
    order_delivered_customer_date: null,
    order_estimated_delivery_date: null,
    shipping_limit_date: null,

    product_length_cm: null,
    product_height_cm: null,
    product_width_cm: null,
    price: null,
    freight_value: null,

    customer_state: null,
    seller_state: null,
    payment_type: "unknown",
    product_category_name: null,

    review_score: null,
    review_comment_message: "",
    order_status: "unknown",
  };
}

function buildPayload(orders: OrderInput[]): AnalyzePayload {
  if (orders.length <= 1) return { order: orders[0] };
  return { orders };
}

function parseImported(value: unknown): OrderInput[] | null {
  if (!value || typeof value !== "object") return null;
  const v: any = value;

  if (Array.isArray(v.orders)) return v.orders as OrderInput[];

  if (v.order) {
    const o = v.order.order ?? v.order;
    return [o as OrderInput];
  }

  return null;
}

export function AnalyzeWorkspace() {
  const [orders, setOrders] = useState<OrderInput[]>([emptyOrder()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);

  const [jsonOpen, setJsonOpen] = useState(false);

  const payload = useMemo(() => buildPayload(orders), [orders]);
  const isEmpty = predictions === null;

  const active = orders[activeIndex];

  function updateActive(partial: Partial<OrderInput>) {
    setOrders((prev) => prev.map((o, idx) => (idx === activeIndex ? { ...o, ...partial } : o)));
  }

  function handleSend() {
    const res = mockPredict(payload);
    if ("predictions" in res) setPredictions(res.predictions);
    else setPredictions([res]);
  }

  function handleNewAnalysis() {
    setPredictions(null);
    setOrders([emptyOrder()]);
    setActiveIndex(0);
  }

  function addOrder() {
    setOrders((prev) => [...prev, emptyOrder()]);
    setActiveIndex((prev) => Math.min(prev + 1, orders.length));
  }

  function removeActiveOrder() {
    if (orders.length <= 1) return;
    setOrders((prev) => prev.filter((_, idx) => idx !== activeIndex));
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }

  function handleImportJson(value: unknown) {
    const parsed = parseImported(value);
    if (!parsed || parsed.length === 0) {
      alert("No pude detectar {order:{...}} o {orders:[...]} en el JSON.");
      return;
    }
    setOrders(parsed.map((o) => ({ ...emptyOrder(), ...o })));
    setActiveIndex(0);
    setPredictions(null);
  }

  return (
    <div className="relative">
      {/* JSON flotante (no empuja el layout) */}
      <div className="fixed right-6 top-6 z-40 hidden w-[360px] lg:block">
        {!jsonOpen ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">JSON</p>
            <p className="mt-1 text-xs text-zinc-600">Ver, copiar o importar el formato.</p>
            <button
              type="button"
              onClick={() => setJsonOpen(true)}
              className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Revisar JSON
            </button>
          </div>
        ) : (
          <JsonPanel jsonValue={payload} onImport={handleImportJson} onClose={() => setJsonOpen(false)} />
        )}
      </div>

      {/* MAIN centrado */}
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col">
        {/* Results */}
        {!isEmpty ? (
          <div className="mb-6">
            <PredictionList orders={orders} predictions={predictions ?? []} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full">
              {/* Título fuera del container */}
              <div className="mb-4 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Escribe tu orden</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Pega un JSON o completa el formulario y presiona <span className="font-semibold">Send</span>.
                </p>
              </div>

              <Composer
                orders={orders}
                activeIndex={activeIndex}
                active={active}
                onSetActiveIndex={setActiveIndex}
                onUpdateActive={updateActive}
                onSend={handleSend}
                onAddOrder={addOrder}
                onRemoveActiveOrder={removeActiveOrder}
                onOpenJson={() => setJsonOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Footer sticky SIN fondo */}
        {!isEmpty ? (
          <div className="sticky bottom-4 mt-auto">
            <div className="flex justify-center pb-2">
              <button
                type="button"
                onClick={handleNewAnalysis}
                className="rounded-full border border-zinc-200 bg-transparent px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Nuevo análisis
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Composer(props: {
  orders: OrderInput[];
  activeIndex: number;
  active: OrderInput;
  onSetActiveIndex: (n: number) => void;
  onUpdateActive: (p: Partial<OrderInput>) => void;
  onSend: () => void;
  onAddOrder: () => void;
  onRemoveActiveOrder: () => void;
  onOpenJson: () => void;
}) {
  const {
    orders,
    activeIndex,
    active,
    onSetActiveIndex,
    onUpdateActive,
    onSend,
    onAddOrder,
    onRemoveActiveOrder,
    onOpenJson,
  } = props;

  const canRemove = orders.length > 1;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
      {/* Textarea */}
      <div className="px-5 pt-5">
        <textarea
          value={active.review_comment_message}
          onChange={(e) => onUpdateActive({ review_comment_message: e.target.value })}
          placeholder="Escribe el comentario del review..."
          className="min-h-[120px] w-full resize-y rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      {/* Row: estrellas izquierda | Agregar JSON + Send derecha */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3">
        <StarRating value={active.review_score} onChange={(v) => onUpdateActive({ review_score: v })} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenJson}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Agregar JSON
          </button>

          <button
            type="button"
            onClick={onSend}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Send
          </button>
        </div>
      </div>

      {/* Acordeón compacto */}
      <div className="px-5 pb-5 pt-3">
        <details className="mt-2">
          <summary className="mx-auto w-fit cursor-pointer select-none rounded-full px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50">
            Detalles de órdenes
          </summary>

          <div className="mt-4 space-y-4">
            {/* Orden selector + add/remove */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-700">Orden</span>
                <div className="flex gap-1">
                  {orders.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSetActiveIndex(idx)}
                      className={[
                        "rounded-xl px-3 py-1.5 text-xs font-semibold",
                        idx === activeIndex
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onAddOrder}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  + Agregar
                </button>
                <button
                  type="button"
                  onClick={onRemoveActiveOrder}
                  disabled={!canRemove}
                  className={[
                    "rounded-xl px-3 py-1.5 text-xs font-semibold",
                    canRemove
                      ? "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      : "cursor-not-allowed border border-zinc-100 text-zinc-300",
                  ].join(" ")}
                >
                  Quitar
                </button>
              </div>
            </div>

            {/* Selects */}
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField
                label="Tipo de pago"
                value={active.payment_type ?? "unknown"}
                options={[
                  { value: "unknown", label: "Desconocido" },
                  { value: "credit_card", label: "Tarjeta de crédito" },
                  { value: "boleto", label: "Boleto" },
                  { value: "debit_card", label: "Tarjeta débito" },
                  { value: "pix", label: "Pix" },
                ]}
                onChange={(v) => onUpdateActive({ payment_type: v as PaymentType })}
              />

              <SelectField
                label="Estado del pedido"
                value={active.order_status}
                options={[
                  { value: "unknown", label: "Desconocido" },
                  { value: "created", label: "Creado" },
                  { value: "approved", label: "Aprobado" },
                  { value: "processing", label: "Procesando" },
                  { value: "shipped", label: "Enviado" },
                  { value: "delivered", label: "Entregado" },
                  { value: "canceled", label: "Cancelado" },
                ]}
                onChange={(v) => onUpdateActive({ order_status: v as OrderStatus })}
              />
            </div>

            {/* Advanced */}
            <details className="rounded-2xl border border-zinc-200 p-3">
              <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-900 hover:text-zinc-950">
                Advanced fields
              </summary>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TextField
                  label="order_purchase_timestamp"
                  value={active.order_purchase_timestamp ?? ""}
                  onChange={(v) => onUpdateActive({ order_purchase_timestamp: v || null })}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
                <TextField
                  label="order_estimated_delivery_date"
                  value={active.order_estimated_delivery_date ?? ""}
                  onChange={(v) => onUpdateActive({ order_estimated_delivery_date: v || null })}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
                <TextField
                  label="order_approved_at"
                  value={active.order_approved_at ?? ""}
                  onChange={(v) => onUpdateActive({ order_approved_at: v || null })}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
                <TextField
                  label="shipping_limit_date"
                  value={active.shipping_limit_date ?? ""}
                  onChange={(v) => onUpdateActive({ shipping_limit_date: v || null })}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />

                <TextField
                  label="order_delivered_carrier_date"
                  value={active.order_delivered_carrier_date ?? ""}
                  onChange={(v) => onUpdateActive({ order_delivered_carrier_date: v || null })}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
                <TextField
                  label="order_delivered_customer_date"
                  value={active.order_delivered_customer_date ?? ""}
                  onChange={(v) => onUpdateActive({ order_delivered_customer_date: v || null })}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />

                <NumberField
                  label="product_length_cm"
                  value={active.product_length_cm}
                  onChange={(v) => onUpdateActive({ product_length_cm: v })}
                />
                <NumberField
                  label="product_height_cm"
                  value={active.product_height_cm}
                  onChange={(v) => onUpdateActive({ product_height_cm: v })}
                />
                <NumberField
                  label="product_width_cm"
                  value={active.product_width_cm}
                  onChange={(v) => onUpdateActive({ product_width_cm: v })}
                />
                <NumberField
                  label="price"
                  value={active.price}
                  onChange={(v) => onUpdateActive({ price: v })}
                />
                <NumberField
                  label="freight_value"
                  value={active.freight_value}
                  onChange={(v) => onUpdateActive({ freight_value: v })}
                />

                <TextField
                  label="customer_state"
                  value={active.customer_state ?? ""}
                  onChange={(v) => onUpdateActive({ customer_state: v || null })}
                  placeholder="SP, RJ, RS..."
                />
                <TextField
                  label="seller_state"
                  value={active.seller_state ?? ""}
                  onChange={(v) => onUpdateActive({ seller_state: v || null })}
                  placeholder="SP, MG..."
                />

                <TextField
                  label="product_category_name"
                  value={active.product_category_name ?? ""}
                  onChange={(v) => onUpdateActive({ product_category_name: v || null })}
                  placeholder="beleza_saude..."
                />
              </div>
            </details>
          </div>
        </details>
      </div>
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  const { label, value, options, onChange } = props;

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField(props: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const { label, value, placeholder, onChange } = props;
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
    </div>
  );
}

function NumberField(props: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const { label, value, onChange } = props;

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-zinc-700">{label}</label>
      <input
        inputMode="decimal"
        value={value === null ? "" : String(value)}
        onChange={(e) => {
          const t = e.target.value.trim();
          if (!t) return onChange(null);
          const n = Number(t);
          onChange(Number.isFinite(n) ? n : null);
        }}
        placeholder="—"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
    </div>
  );
}
