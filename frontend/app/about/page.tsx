import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="About"
        subtitle="Estructura y decisiones para conectar API más adelante sin reestructurar toda la app."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Estructura del frontend">
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>
              <span className="font-mono text-zinc-200">/app</span>: rutas App
              Router.
            </li>
            <li>
              <span className="font-mono text-zinc-200">/components</span>: UI
              reusable.
            </li>
            <li>
              <span className="font-mono text-zinc-200">/data</span>: data
              hardcodeada (demo).
            </li>
            <li>
              <span className="font-mono text-zinc-200">/types</span>: tipos
              compartidos.
            </li>
          </ul>
        </Card>

        <Card title="Estrategia para v2 (API)">
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>
              Crear servicios (fetch) en{" "}
              <span className="font-mono text-zinc-200">/lib</span>.
            </li>
            <li>
              Páginas delgadas: orquestan data + componentes.
            </li>
            <li>
              Componentes puros (props → UI) para fácil mantenimiento.
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Convenciones">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Componentes</p>
            <p className="text-sm text-zinc-300">
              PascalCase en{" "}
              <span className="font-mono text-zinc-200">/components</span>.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Hooks / eventos / GSAP</p>
            <p className="text-sm text-zinc-300">
              Solo en Client Components con{" "}
              <span className="font-mono text-zinc-200">"use client"</span>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
