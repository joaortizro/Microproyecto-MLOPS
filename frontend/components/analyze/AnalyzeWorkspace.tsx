"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AnalyzePayload, OrderInput, OrderStatus, PaymentType } from "../../types/order";
import type { Prediction } from "../../types/prediction";
import { mockPredict } from "../../lib/mockPredict";
import { PredictionGrid } from "./PredictionGrid";
import { StarRating } from "./StarRating";
import { JsonPanel } from "./JsonPanel";
import { PredictionList } from "./PredictionList";
import BrandMark from "../../components/BrandMark";
import { FiChevronDown, FiCode, FiSend } from "react-icons/fi";

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
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 z-0",
          "opacity-70",
          // más separados: 56px (sube/baja a gusto)
          "bg-[repeating-radial-gradient(circle_at_center,rgba(24,24,27,0.07)_0,rgba(24,24,27,0.07)_1px,transparent_1px,transparent_56px)]",
          // fade suave en bordes
          "[mask-image:radial-gradient(circle_at_center,black_52%,transparent_100%)]",
        ].join(" ")}
      />

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
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col">

        {/* Results */}
        {!isEmpty ? (
          <div className="mb-6">
            <PredictionList orders={orders} predictions={predictions ?? []} />
          </div>
        ) : (

          <div className="flex flex-1 items-center justify-center">

            <div className="w-full">
              {/* Header con logo + fondo de círculos */}
              <div className="relative mb-6 text-center">


                <div className="relative">
                  {/* Logo arriba */}
                  <div className="mx-auto mb-3 grid w-fit place-items-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(188,150,230,0.16)] text-[var(--color-purple)] ring-1 ring-black/5">
                      <BrandMark className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Título: dark purple */}
                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-dark-purple)]">
                    Escribe tu orden
                  </h1>

                  <p className="mt-1 text-sm text-zinc-600">
                    Pega un JSON o completa el formulario y presiona{" "}
                    <span className="font-semibold text-[var(--color-dark-purple)]">Send</span>.
                  </p>
                </div>
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

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function syncTextarea(el: HTMLTextAreaElement) {
    const MIN = 40;
    const MAX = 180;

    el.style.height = "0px";
    const next = Math.max(MIN, Math.min(el.scrollHeight, MAX));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX ? "auto" : "hidden";
  }

  useLayoutEffect(() => {
    if (taRef.current) syncTextarea(taRef.current);
    // cuando cambias de orden o se actualiza el texto, recalcula altura
  }, [active.review_comment_message, activeIndex]);

  return (
    <div className="space-y-0">
      {/* Sección A: comentario + estrellas + acciones */}
      <div className="relative z-40 rounded-3xl border border-zinc-200 bg-white shadow-sm">
        {/* Textarea */}
        <div className="px-4 pt-4">
          <textarea
            ref={taRef}
            value={active.review_comment_message}
            onChange={(e) => onUpdateActive({ review_comment_message: e.target.value })}
            onInput={(e) => syncTextarea(e.currentTarget)}
            placeholder="Escribe el comentario del review..."
            className={[
              "w-full rounded-2xl",
              "bg-transparent p-3 text-sm text-zinc-900",
              "resize-none", // quita el handle de expandir
              "outline-none focus:outline-none", // sin borde/outline del navegador
              "focus:ring-0", // por si algo agrega ring
            ].join(" ")}
          />
        </div>

        {/* Row: estrellas izquierda | Ver JSON + Send derecha */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-3">
          <StarRating value={active.review_score} onChange={(v) => onUpdateActive({ review_score: v })} />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenJson}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-xl px-4",
                "text-xs font-semibold text-[var(--color-dark-purple)]",
                "transition-colors",
                "hover:bg-[var(--color-purple-soft-12)] active:bg-[var(--color-purple-soft-16)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
              aria-label="Ver JSON"
              title="Ver JSON"
            >
              <FiCode className="h-4 w-4 text-[var(--color-purple)]" />
              <span>Ver JSON</span>
            </button>

            <button
              type="button"
              onClick={onSend}
              className={[
                "grid h-10 w-10 place-items-center rounded-full",
                "bg-[var(--color-purple)] text-[var(--color-dark-purple)] shadow-sm",
                "transition-colors hover:brightness-95 active:brightness-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
              aria-label="Send"
              title="Send"
            >
              <FiSend className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sección B: Detalles (contenedor separado) */}
      <div className="relative z-10 -mt-8 overflow-hidden rounded-3xl rounded-tl-none rounded-tr-none bg-[var(--color-purple)] shadow-sm">
        <details className="group">
          <summary
            className={[
              // que sea un bloque “grande” clickeable
              "block w-full cursor-pointer select-none list-none",
              "[&::-webkit-details-marker]:hidden",
              "focus:outline-none",
              // padding/altura del header morado (ajusta a gusto)
              "px-4 pb-4 pt-10 text-center",
              // hover/active sutil para indicar clic
              "transition-colors hover:bg-white/10 active:bg-white/15",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-3">
        
              <p className="text-xs text-[rgba(33,11,44,0.78)]">
                Haz clic aquí para abrir y editar los detalles de tu orden
              </p>
            </div>
          </summary>

          <div className="px-4 pb-4">
            {/* Panel interno blanco para mantener tus fields sin re-estilizarlos */}
            <div
  className={[
    "!block", 
    "grid grid-rows-[0fr]",
    "transition-[grid-template-rows] duration-300 ease-out",
    "group-open:grid-rows-[1fr]",
    "motion-reduce:transition-none",
  ].join(" ")}
>
  <div className="overflow-hidden">
    <div
      className={[
        "px-4 pb-4",
        "transition-opacity duration-200 ease-out",
        "opacity-0 group-open:opacity-100",
        "motion-reduce:transition-none motion-reduce:opacity-100",
      ].join(" ")}
    >
            <div className="rounded-2xl bg-white p-4">
              {/* 👇 Pega aquí tu contenido actual de detalles tal cual */}
              <div className="space-y-4">
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
                    {/* ...tu contenido actual igual... */}
                  </div>
                </details>
              </div>
            </div>
            </div></div></div>
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
