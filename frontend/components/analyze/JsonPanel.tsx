"use client";

import { useMemo, useState } from "react";

type JsonPanelProps = {
  jsonValue: unknown;          // se actualiza en vivo
  onImport: (value: unknown) => void; // aplica el JSON pegado
  onClose?: () => void;
};

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function JsonPanel({ jsonValue, onImport, onClose }: JsonPanelProps) {
  const jsonText = useMemo(() => prettyJson(jsonValue), [jsonValue]);
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
      onImport(parsed);
      setImportText("");
    } catch {
      alert("JSON inválido. Verifica el formato.");
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">Formato JSON</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Copy
          </button>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      {/* Preview live (solo lectura) */}
      <pre className="max-h-[280px] overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800">
        {jsonText}
      </pre>

      {/* Paste/Import */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-zinc-700">Pegar JSON para importar</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='Pega {"order": {...}} o {"orders":[...]} y presiona Apply'
          className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleApply}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
