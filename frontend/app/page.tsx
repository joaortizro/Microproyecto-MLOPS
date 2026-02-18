import Link from "next/link";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { AnimatedIn } from "@/components/AnimatedIn";

export default function HomePage() {
  return (
    <AnimatedIn>
      <div className="space-y-10">
        <PageHeader
          title="Frontend demo"
          subtitle="Next.js App Router + TypeScript + Tailwind v4. Datos hardcodeados por ahora."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card title="¿Qué encontrarás aquí?">
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>2 páginas nuevas (Demo y About) para validar estructura.</li>
              <li>Componentes reutilizables en /components.</li>
              <li>Datos hardcodeados en /data (sin API en v1).</li>
            </ul>
          </Card>

          <Card title="Siguientes pasos (v2)">
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>Agregar una capa pequeña de data-fetch en /lib.</li>
              <li>Conectar el API sin reestructurar UI.</li>
              <li>Opcional: caché/estado según necesidades del backend.</li>
            </ul>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            Ver Demo
          </Link>
          <Link
            href="/about"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900"
          >
            About
          </Link>
        </div>
      </div>
    </AnimatedIn>
  );
}
