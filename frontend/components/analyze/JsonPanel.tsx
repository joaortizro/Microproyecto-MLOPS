"use client";

import { useMemo, useState } from "react";

type JsonPanelProps = {
  jsonValue: unknown; // se actualiza en vivo
  onImport: (value: unknown) => void; // aplica el JSON pegado
  onClose?: () => void; // compatibilidad (puede no usarse aquí)
};

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function JsonPanel(props: JsonPanelProps) {
  const jsonText = useMemo(() => prettyJson(props.jsonValue), [props.jsonValue]);
  const [importText, setImportText] = useState("");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jsonText);
    } catch {
      // fallback: el usuario copia manualmente
    }
  }

  function handleApply() {
    try {
      const parsed = JSON.parse(importText);
      props.onImport(parsed);
      setImportText("");
    } catch {
      alert("JSON inválido. Verifica el formato.");
    }
  }

  return (
    <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-black/5">
      {/* Preview live (solo lectura) */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-[rgba(33,11,44,0.72)]">Preview</p>

        <button
          type="button"
          onClick={handleCopy}
          className={[
            "inline-flex h-8 items-center rounded-xl px-3",
            "text-xs font-semibold text-[var(--color-dark-purple)]",
            "transition-colors",
            "hover:bg-[var(--color-purple-soft-12)] active:bg-[var(--color-purple-soft-16)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          ].join(" ")}
          aria-label="Copiar JSON"
          title="Copiar JSON"
        >
          Copy
        </button>
      </div>

      <pre className="mt-2 max-h-[220px] overflow-auto rounded-xl bg-[var(--color-purple-soft-12)] p-3 text-xs text-[var(--color-dark-purple)] opacity-90 ring-1 ring-black/5">
        {jsonText}
      </pre>

      {/* Paste/Import */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-[rgba(33,11,44,0.72)]">
          Pegar JSON para importar
        </p>

        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='Pega {"order": {...}} o {"orders":[...]} y presiona Apply'
          className={[
            "min-h-[96px] w-full resize-y rounded-xl bg-white p-3 text-xs",
            "text-[var(--color-dark-purple)] ring-1 ring-black/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
          ].join(" ")}
        />

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleApply}
            className={[
              "inline-flex h-9 items-center rounded-xl px-4",
              "text-xs font-semibold text-[var(--color-dark-purple)]",
              "bg-[var(--color-purple)] shadow-sm ring-1 ring-black/5",
              "hover:brightness-95 active:brightness-90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            ].join(" ")}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
