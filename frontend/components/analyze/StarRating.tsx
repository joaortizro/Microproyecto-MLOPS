"use client";

import { useMemo, useState } from "react";
import { FiStar, FiX } from "react-icons/fi";

type StarRatingProps = {
  value: number | null; // null = sin selección
  onChange: (v: number | null) => void;
};

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const active = hover ?? (value ?? 0);
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  return (
    <div className="flex items-center gap-1">
      {stars.map((n) => {
        const filled = active >= n;

        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(n)}
            aria-label={`Set rating ${n}`}
            className="rounded-lg p-1"
          >
            <FiStar
              className={[
                "h-5 w-5 transition-colors",
                filled ? "text-amber-500" : "text-zinc-300",
              ].join(" ")}
            />
          </button>
        );
      })}

      {/* Clear */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className="ml-2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
        aria-label="Clear rating"
        title="Limpiar estrellas"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}
