"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { OrderInput } from "../../types/order";
import type { Prediction, PredictionReason, StoredPrediction } from "../../types/prediction";
import { PredictionList } from "./PredictionList";
import { JsonPanel } from "./JsonPanel";
import BrandMark from "../../components/BrandMark";
import { FiChevronDown, FiCode, FiLoader, FiSend } from "react-icons/fi";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const STORAGE_KEY = "hybrid_prediction_history_v1";

type ViewMode = "form" | "predictions";

const emptySubscribe = () => () => {};

function emptyOrder(): OrderInput {
  return {
    delivery: {
      purchase_date: null,
      promised_date: null,
      dispatched_date: null,
      delivered_date: null,
    },
    financials: {
      order_total: null,
      shipping_cost: null,
      payment_installments: null,
      currency: "BRL",
    },
    location: {
      distance_km: null,
    },
    item: {
      weight_g: null,
      description_length: null,
      media_count: null,
    },
    review: {
      text: "",
    },
  };
}

function buildExampleOrder(): OrderInput {
  return {
    delivery: {
      purchase_date: "2024-01-07T10:00:00",
      promised_date: "2024-01-12T23:59:59",
      dispatched_date: "2024-01-08T08:12:00",
      delivered_date: "2024-01-16T15:30:00",
    },
    financials: {
      order_total: 20000.9,
      shipping_cost: 1124.5,
      payment_installments: 1,
      currency: "BRL",
    },
    location: {
      distance_km: 11750,
    },
    item: {
      weight_g: 850,
      description_length: 320,
      media_count: 2,
    },
    review: {
      text: "O produto demorou muito para chegar e veio com a embalagem danificada!",
    },
  };
}

function parseImported(value: unknown): OrderInput | null {
  if (!value || typeof value !== "object") return null;

  const v = value as { order?: unknown; orders?: unknown };

  if (v.order && typeof v.order === "object") return v.order as OrderInput;
  if (Array.isArray(v.orders) && v.orders[0] && typeof v.orders[0] === "object") {
    return v.orders[0] as OrderInput;
  }

  const maybeSingle = value as Partial<OrderInput>;
  if (maybeSingle.delivery && maybeSingle.financials && maybeSingle.location && maybeSingle.item && maybeSingle.review) {
    return maybeSingle as OrderInput;
  }

  return null;
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function parseReason(raw: unknown): PredictionReason | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  return {
    factor: typeof r.factor === "string" ? r.factor : "unknown_factor",
    description: typeof r.description === "string" ? r.description : "",
    value: typeof r.value === "number" && Number.isFinite(r.value) ? r.value : 0,
    impact: typeof r.impact === "string" ? r.impact : "low",
  };
}

function parsePrediction(rawResponse: unknown): Prediction {
  const envelope = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;
  const envObj = envelope && typeof envelope === "object" ? (envelope as Record<string, unknown>) : null;

  const data = envObj?.data && typeof envObj.data === "object" ? (envObj.data as Record<string, unknown>) : envObj;

  const sentiment: "positive" | "negative" = data?.sentiment === "negative" ? "negative" : "positive";

  const negativeProbability = clamp01(
    typeof data?.negative_probability === "number" ? data.negative_probability : 0.5
  );

  const confidence = sentiment === "negative" ? negativeProbability : 1 - negativeProbability;

  const reasons = Array.isArray(data?.reasons)
    ? data.reasons.map(parseReason).filter((x): x is PredictionReason => x !== null)
    : [];

  return {
    predicted_score: typeof data?.predicted_score === "number" ? data.predicted_score : 0,
    negative_probability: negativeProbability,
    sentiment,
    confidence,
    reasons,
    status: typeof envObj?.status === "string" ? envObj.status : undefined,
    timestamp: typeof envObj?.timestamp === "string" ? envObj.timestamp : undefined,
  };
}

function makeStoredPrediction(order: OrderInput, rawResponse: unknown): StoredPrediction {
  const prediction = parsePrediction(rawResponse);
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${timePart}-${randomPart}`;

  return {
    id,
    order,
    prediction,
    raw_response: rawResponse,
    created_at: new Date().toISOString(),
  };
}

function loadStoredPredictions(): StoredPrediction[] {
  if (typeof window === "undefined") return [];

  try {
    const rawLocal = window.localStorage.getItem(STORAGE_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      return Array.isArray(parsed) ? (parsed as StoredPrediction[]) : [];
    }

    // one-time fallback: move previous session data into local storage
    const rawSession = window.sessionStorage.getItem(STORAGE_KEY);
    if (!rawSession) return [];
    const parsed = JSON.parse(rawSession);
    if (!Array.isArray(parsed)) return [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed as StoredPrediction[];
  } catch {
    return [];
  }
}

function saveStoredPredictions(items: StoredPrediction[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export function AnalyzeWorkspace() {
  const [order, setOrder] = useState<OrderInput>(emptyOrder());
  const [savedPredictions, setSavedPredictions] = useState<StoredPrediction[]>(() => loadStoredPredictions());
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [jsonOpen, setJsonOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const hasPredictions = savedPredictions.length > 0;
  const payloadPreview = useMemo(() => ({ order }), [order]);

  useEffect(() => {
    saveStoredPredictions(savedPredictions);
  }, [savedPredictions]);

  async function handleSend() {
    setIsSending(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const url = `${apiBaseUrl}/analyze/hybrid`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${errorBody}`);
      }

      const rawResponse = (await res.json()) as unknown;
      console.log("/analyze/hybrid raw response:", rawResponse);

      const item = makeStoredPrediction(order, rawResponse);
      setSavedPredictions((prev) => [item, ...prev]);
      setViewMode("predictions");
    } catch (err) {
      console.error("Error calling /analyze/hybrid:", err);
      alert("Error enviando la orden. Revisa consola para ver el detalle.");
    } finally {
      setIsSending(false);
    }
  }

  function handleImportJson(value: unknown) {
    const parsed = parseImported(value);
    if (!parsed) {
      alert("No pude detectar un payload de orden válido en el JSON.");
      return;
    }

    setOrder({ ...emptyOrder(), ...parsed });
  }

  function handleLoadExample() {
    setOrder(buildExampleOrder());
  }

  function handleAddAnotherOrder() {
    setOrder(emptyOrder());
    setViewMode("form");
  }

  function handleClearAllPredictions() {
    setSavedPredictions([]);
    setViewMode("form");
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 z-0",
          "opacity-70",
          "bg-[repeating-radial-gradient(circle_at_center,rgba(24,24,27,0.07)_0,rgba(24,24,27,0.07)_1px,transparent_1px,transparent_56px)]",
          "[mask-image:radial-gradient(circle_at_center,black_52%,transparent_100%)]",
        ].join(" ")}
      />

      {viewMode === "form" ? (
        <div className="fixed right-6 top-6 z-40 hidden w-[340px] lg:block">
          <div className="rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-semibold text-[var(--color-dark-purple)]">JSON</p>
            <p className="mt-1 text-xs text-[rgba(33,11,44,0.72)]">Ver, copiar o importar el formato.</p>

            <button
              type="button"
              onClick={() => setJsonOpen((v) => !v)}
              className={[
                "mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl px-4",
                "whitespace-nowrap text-xs font-semibold text-[var(--color-dark-purple)]",
                "transition-colors",
                "hover:bg-[var(--color-purple-soft-12)] active:bg-[var(--color-purple-soft-16)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
              aria-label={jsonOpen ? "Cerrar JSON" : "Revisar JSON"}
              title={jsonOpen ? "Cerrar JSON" : "Revisar JSON"}
              aria-expanded={jsonOpen}
            >
              <FiCode className="h-4 w-4 text-[var(--color-purple)]" aria-hidden="true" />
              <span>{jsonOpen ? "Cerrar JSON" : "Revisar JSON"}</span>
            </button>

            {jsonOpen ? (
              <div className="mt-4">
                <JsonPanel jsonValue={payloadPreview} onImport={handleImportJson} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-3xl flex-col">
        {viewMode === "predictions" ? (
          <div className="mb-6">
            <PredictionList items={savedPredictions} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full">
              <div className="relative mb-6 text-center">
                <div className="relative">
                  <div className="mx-auto mb-3 grid w-fit place-items-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(188,150,230,0.16)] text-[var(--color-purple)] ring-1 ring-black/5">
                      <BrandMark className="h-6 w-6" />
                    </div>
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-dark-purple)]">
                    Escribe tu orden
                  </h1>

                  <p className="mt-1 text-sm text-zinc-600">
                    Pega un JSON o completa el formulario y presiona{" "}
                    <span className="font-semibold text-[var(--color-dark-purple)]">Send</span>.
                  </p>

                  {isHydrated && hasPredictions ? (
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setViewMode("predictions")}
                        className="rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Ver predicciones guardadas ({savedPredictions.length})
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <Composer
                order={order}
                isSending={isSending}
                onUpdate={setOrder}
                onSend={handleSend}
                onOpenJson={() => setJsonOpen(true)}
                onLoadExample={handleLoadExample}
              />
            </div>
          </div>
        )}

        {viewMode === "predictions" ? (
          <div className="sticky bottom-4 mt-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
              <button
                type="button"
                onClick={handleAddAnotherOrder}
                className="rounded-full border border-zinc-200 bg-white/90 px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Agregar otra orden
              </button>

              <button
                type="button"
                onClick={handleClearAllPredictions}
                className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Borrar todas las predicciones
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Composer(props: {
  order: OrderInput;
  isSending: boolean;
  onUpdate: (v: OrderInput) => void;
  onSend: () => void;
  onOpenJson: () => void;
  onLoadExample: () => void;
}) {
  const { order, isSending, onUpdate, onSend, onOpenJson, onLoadExample } = props;

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
  }, [order.review.text]);

  return (
    <div className="space-y-0">
      <div className="relative z-40 rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-4 pt-4">
          <textarea
            ref={taRef}
            value={order.review.text}
            onChange={(e) => onUpdate({ ...order, review: { ...order.review, text: e.target.value } })}
            onInput={(e) => syncTextarea(e.currentTarget)}
            placeholder="Escribe el texto del review..."
            className={[
              "w-full rounded-2xl",
              "bg-transparent p-3 text-sm text-zinc-900",
              "resize-none",
              "outline-none focus:outline-none",
              "focus:ring-0",
            ].join(" ")}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onLoadExample}
            className={[
              "inline-flex h-9 items-center rounded-xl px-3",
              "text-xs font-semibold text-[var(--color-dark-purple)]",
              "transition-colors",
              "hover:bg-[var(--color-purple-soft-12)] active:bg-[var(--color-purple-soft-16)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            ].join(" ")}
            aria-label="Generar ejemplo automáticamente"
            title="Generar ejemplo automáticamente"
          >
            Generar ejemplo automáticamente
          </button>

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
              disabled={isSending}
              className={[
                "grid h-10 w-10 place-items-center rounded-full",
                "bg-[var(--color-purple)] text-[var(--color-dark-purple)] shadow-sm",
                "transition-colors hover:brightness-95 active:brightness-90",
                "disabled:cursor-not-allowed disabled:opacity-70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
              aria-label="Send"
              title="Send"
            >
              {isSending ? <FiLoader className="h-4.5 w-4.5 animate-spin" /> : <FiSend className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-8 overflow-hidden rounded-3xl rounded-tl-none rounded-tr-none bg-[var(--color-purple)] shadow-sm">
        <details className="group">
          <summary
            className={[
              "block w-full cursor-pointer select-none list-none",
              "[&::-webkit-details-marker]:hidden",
              "px-4 pb-4 pt-10",
              "text-center",
              "focus:outline-none",
              "hover:bg-white/10 active:bg-white/15",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-2">
              <FiChevronDown className="h-4 w-4 text-[rgba(33,11,44,0.8)]" aria-hidden="true" />
              <p className="text-xs text-[rgba(33,11,44,0.78)]">
                Haz clic aquí para abrir y editar los detalles de tu orden
              </p>
            </div>
          </summary>

          <div className="px-4 pb-4">
            <div className="rounded-2xl bg-[var(--color-purple-soft-12)] p-4">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold tracking-wide text-white">Delivery</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="purchase_date"
                      value={order.delivery.purchase_date ?? ""}
                      placeholder="YYYY-MM-DDTHH:mm:ss"
                      onChange={(v) =>
                        onUpdate({
                          ...order,
                          delivery: { ...order.delivery, purchase_date: v.trim() ? v : null },
                        })
                      }
                    />
                    <TextField
                      label="promised_date"
                      value={order.delivery.promised_date ?? ""}
                      placeholder="YYYY-MM-DDTHH:mm:ss"
                      onChange={(v) =>
                        onUpdate({
                          ...order,
                          delivery: { ...order.delivery, promised_date: v.trim() ? v : null },
                        })
                      }
                    />
                    <TextField
                      label="dispatched_date"
                      value={order.delivery.dispatched_date ?? ""}
                      placeholder="YYYY-MM-DDTHH:mm:ss"
                      onChange={(v) =>
                        onUpdate({
                          ...order,
                          delivery: { ...order.delivery, dispatched_date: v.trim() ? v : null },
                        })
                      }
                    />
                    <TextField
                      label="delivered_date"
                      value={order.delivery.delivered_date ?? ""}
                      placeholder="YYYY-MM-DDTHH:mm:ss"
                      onChange={(v) =>
                        onUpdate({
                          ...order,
                          delivery: { ...order.delivery, delivered_date: v.trim() ? v : null },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold tracking-wide text-white">Financials</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <NumberField
                      label="order_total"
                      value={order.financials.order_total}
                      onChange={(v) =>
                        onUpdate({ ...order, financials: { ...order.financials, order_total: v } })
                      }
                    />
                    <NumberField
                      label="shipping_cost"
                      value={order.financials.shipping_cost}
                      onChange={(v) =>
                        onUpdate({ ...order, financials: { ...order.financials, shipping_cost: v } })
                      }
                    />
                    <NumberField
                      label="payment_installments"
                      value={order.financials.payment_installments}
                      onChange={(v) =>
                        onUpdate({ ...order, financials: { ...order.financials, payment_installments: v } })
                      }
                    />
                    <TextField
                      label="currency"
                      value={order.financials.currency ?? ""}
                      placeholder="BRL"
                      onChange={(v) =>
                        onUpdate({
                          ...order,
                          financials: { ...order.financials, currency: v.trim() ? v.toUpperCase() : null },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold tracking-wide text-white">Location</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <NumberField
                      label="distance_km"
                      value={order.location.distance_km}
                      onChange={(v) => onUpdate({ ...order, location: { ...order.location, distance_km: v } })}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold tracking-wide text-white">Item</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <NumberField
                      label="weight_g"
                      value={order.item.weight_g}
                      onChange={(v) => onUpdate({ ...order, item: { ...order.item, weight_g: v } })}
                    />
                    <NumberField
                      label="description_length"
                      value={order.item.description_length}
                      onChange={(v) =>
                        onUpdate({ ...order, item: { ...order.item, description_length: v } })
                      }
                    />
                    <NumberField
                      label="media_count"
                      value={order.item.media_count}
                      onChange={(v) => onUpdate({ ...order, item: { ...order.item, media_count: v } })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
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
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[rgba(33,11,44,0.78)]">{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "h-10 w-full rounded-2xl px-3 text-sm",
          "bg-white/95 text-[var(--color-dark-purple)]",
          "placeholder:text-[rgba(33,11,44,0.40)]",
          "ring-1 ring-black/5",
          "outline-none transition-shadow",
          "focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
        ].join(" ")}
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
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[rgba(33,11,44,0.78)]">{label}</label>

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
        className={[
          "h-10 w-full rounded-2xl px-3 text-sm",
          "bg-white/95 text-[var(--color-dark-purple)]",
          "placeholder:text-[rgba(33,11,44,0.40)]",
          "ring-1 ring-black/5",
          "outline-none transition-shadow",
          "focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
        ].join(" ")}
      />
    </div>
  );
}
