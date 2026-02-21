"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";

type StarRatingProps = {
  value: number | null; // null = sin selección
  onChange: (v: number | null) => void;
};

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  // Evita que un "double click" rápido (sin re-render del parent) vuelva a limpiar
  const lastClearedRef = useRef<number | null>(null);

  useEffect(() => {
    // Si el parent ya actualizó a un valor distinto, no necesitamos el "guard"
    if (value !== lastClearedRef.current) lastClearedRef.current = null;
  }, [value]);

  const active = hover ?? (value ?? 0);
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  return (
    <div
      className="flex items-center gap-0.5"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => {
        setHover(null);
        lastClearedRef.current = null;
      }}
    >
      {stars.map((n) => {
        const filled = active >= n;
        const selected = value === n;

        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={selected ? `Clear rating ${n}` : `Set rating ${n}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => {
              // 1) Si está seleccionado, primero lo limpiamos y marcamos "acabo de limpiar n"
              if (selected && lastClearedRef.current !== n) {
                lastClearedRef.current = n;
                onChange(null);
                return;
              }
              // 2) Si vuelven a clickear rápido (o sin salir del hover), forzamos setear
              lastClearedRef.current = null;
              onChange(n);
            }}
            className={[
              "group grid place-items-center rounded-xl p-1.5",
              "transition-colors",
              "hover:bg-[var(--color-purple-soft-12)] active:bg-[var(--color-purple-soft-16)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-purple-soft-16)]",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            ].join(" ")}
          >
            {filled ? (
              <FaStar className="h-5 w-5 text-[var(--color-accent-yellow)]" />
            ) : (
              <FaRegStar className="h-5 w-5 text-zinc-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}