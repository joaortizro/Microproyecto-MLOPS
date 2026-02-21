import { Card } from "../../components/Card";
import { PageHeader } from "../../components/PageHeader";
import { AnimatedIn } from "../../components/AnimatedIn";

export default function InsightsPage() {
  return (
    <AnimatedIn>
      <div className="space-y-8">
        <PageHeader
          title="Insights"
          subtitle="Placeholder. Luego agregamos métricas agregadas, tendencias y breakdowns."
        />

        <Card title="Pendiente">
          <p className="text-sm text-zinc-700">
            Próximo paso: definir qué cards y qué gráficos quieres aquí (sin API en v1).
          </p>
        </Card>
      </div>
    </AnimatedIn>
  );
}
