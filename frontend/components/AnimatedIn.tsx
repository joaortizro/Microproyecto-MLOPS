"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

type AnimatedInProps = {
  children: ReactNode;
  y?: number;
  delay?: number;
  duration?: number;
};

export function AnimatedIn({
  children,
  y = 12,
  delay = 0,
  duration = 0.5,
}: AnimatedInProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration, delay, ease: "power2.out" }
      );
    }, el);

    return () => ctx.revert();
  }, [y, delay, duration]);

  return <div ref={rootRef}>{children}</div>;
}
