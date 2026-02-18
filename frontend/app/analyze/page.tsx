import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { AnimatedIn } from "../../components/AnimatedIn";

const exampleInput = `{
  "context": { "country_code": "BR" },
  "delivery": {
    "purchase_date": "2024-01-01T10:00:00",
    "dispatched_date": "2024-01-03T08:00:00",
    "delivered_date": "2024-01-12T15:30:00",
    "promised_date": "2024-01-08T23:59:59"
  },
  "financials": {
    "order_total": 189.90,
    "shipping_cost": 24.50,
    "payment_installments": 3,
    "currency": "BRL"
  },
  "item": {
    "category": "electronics",
    "weight_g": 850,
    "description_length": 320,
    "media_count": 2
  },
  "review": {
    "text": "O produto demorou muito para chegar e veio com a embalagem danificada."
  }
}`;

const exampleOutput = `{
  "data": {
    "predicted_score": 2,
    "negative_probability": 0.81,
    "sentiment": "negative",
    "reasons": [
      { "factor": "delivery_delay", "value": 4, "impact": "high" },
      { "factor": "freight_cost", "value": 24.50, "impact": "medium" },
      { "factor": "review_text", "value": "damaged packaging", "impact": "medium" }
    ]
  },
  "status": "ok",
  "timestamp": "2024-01-13T00:00:00+00:00"
}`;

export default function AnalyzePage() {
  return (
    <AnimatedIn>
      <div className="space-y-8">
        <PageHeader
          title="Analyze Reviews"
          subtitle="Por ahora: UI + estructura. Luego conectamos el backend cambiando solo una capa pequeña."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Ejemplo de payload (input)">
            <pre className="overflow-x-auto rounded-xl bg-zinc-50 p-4 text-xs text-zinc-800">
              {exampleInput}
            </pre>
          </Card>

          <Card title="Ejemplo de respuesta esperada (output)">
            <pre className="overflow-x-auto rounded-xl bg-zinc-50 p-4 text-xs text-zinc-800">
              {exampleOutput}
            </pre>
          </Card>
        </div>

        <Card title="Siguiente UI (placeholder)">
          <p className="text-sm text-zinc-700">
            Aquí vamos a montar la lista de reviews (cards como tu diseño) + el detalle
            de razones y confianza. En v1 será hardcodeado; en v2 conectamos API.
          </p>
        </Card>
      </div>
    </AnimatedIn>
  );
}
