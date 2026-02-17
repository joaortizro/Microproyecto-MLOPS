import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { StatusPill } from "../../components/StatusPill";
import { DEMO_RUNS } from "../../data/demo";

export default function DemoPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Demo"
        subtitle="Lista hardcodeada de ejecuciones para validar UI y tipos (sin API)."
      />

      <Card title="Últimas ejecuciones">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="py-2 pr-4 font-medium">Run</th>
                <th className="py-2 pr-4 font-medium">Modelo</th>
                <th className="py-2 pr-4 font-medium">Dataset</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Accuracy</th>
                <th className="py-2 font-medium">Fecha</th>
              </tr>
            </thead>

            <tbody>
              {DEMO_RUNS.map((run) => (
                <tr key={run.id} className="border-b border-zinc-900">
                  <td className="py-3 pr-4 font-mono text-xs text-zinc-300">
                    {run.id}
                  </td>
                  <td className="py-3 pr-4">{run.model}</td>
                  <td className="py-3 pr-4 text-zinc-300">{run.dataset}</td>
                  <td className="py-3 pr-4">
                    <StatusPill status={run.status} />
                  </td>
                  <td className="py-3 pr-4">
                    {run.status === "completed"
                      ? `${(run.accuracy * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="py-3 text-zinc-300">{run.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Nota">
        <p className="text-sm text-zinc-300">
          En v2, esta tabla se alimentará desde una capa pequeña en{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5">/lib</code> sin
          cambiar estos componentes.
        </p>
      </Card>
    </div>
  );
}
