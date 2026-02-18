"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import { NAV_ITEMS } from "../data/navigation";

export function Navbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: -8 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={navRef}
      className="border-b border-zinc-800 bg-black/40 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Microproyecto MLOps
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-xl px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-zinc-800/60 text-white"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
