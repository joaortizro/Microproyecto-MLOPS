"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
    FiBarChart2,
    FiChevronLeft,
    FiGrid,
    FiMessageSquare,
    FiSearch,
    FiUser,
} from "react-icons/fi";
import * as Tooltip from "@radix-ui/react-tooltip";

import { NAV_ITEMS } from "../data/navigation";
import BrandMark from "./BrandMark";

type NormalizedItem = { label: string; href: string };
type NormalizedGroup = { title?: string; items: NormalizedItem[] };

const EXPANDED_W = 280; // px
const COLLAPSED_W = 72; // px
const LABEL_MAX = 220; // px
const LABEL_PAD = 6; // px
const HEADER_LEFT_MAX = 260; // px

// Paleta
const COLOR_DARK_PURPLE = "#210B2C";
const COLOR_PURPLE = "#BC96E6";

// Estados
const HOVER_BG = "bg-[rgba(188,150,230,0.16)]"; // purple suave
const ACTIVE_BG = "bg-[#210B2C]"; // dark purple
const ACTIVE_FG = "text-[#BC96E6]"; // purple claro
const HOVER_FG = "text-[#210B2C]"; // dark purple

function normalizeNav(raw: unknown): NormalizedGroup[] {
    const isRecord = (v: unknown): v is Record<string, unknown> =>
        typeof v === "object" && v !== null;

    const pickLabel = (v: Record<string, unknown>) =>
        String(v.label ?? v.name ?? v.title ?? "");
    const pickHref = (v: Record<string, unknown>) =>
        String(v.href ?? v.to ?? v.path ?? "#");

    if (Array.isArray(raw)) {
        if (
            raw.length > 0 &&
            isRecord(raw[0]) &&
            Array.isArray((raw[0] as Record<string, unknown>).items)
        ) {
            return raw
                .map((g) => {
                    const gr = g as Record<string, unknown>;
                    const title = String(gr.title ?? gr.section ?? "");
                    const itemsRaw = Array.isArray(gr.items) ? gr.items : [];
                    const items = itemsRaw
                        .filter(isRecord)
                        .map((it) => ({ label: pickLabel(it), href: pickHref(it) }))
                        .filter((it) => it.label && it.href);
                    return { title: title || undefined, items };
                })
                .filter((g) => g.items.length > 0);
        }

        const items = raw
            .filter(isRecord)
            .map((it) => ({ label: pickLabel(it), href: pickHref(it) }))
            .filter((it) => it.label && it.href);

        return items.length ? [{ items }] : [];
    }

    return [];
}

function iconFor(label: string, href: string) {
    const key = `${label} ${href}`.toLowerCase();

    if (key.includes("review") || key.includes("comment") || key.includes("feedback"))
        return FiMessageSquare;
    if (key.includes("analy") || key.includes("search") || key.includes("scan"))
        return FiSearch;
    if (key.includes("insight") || key.includes("report") || key.includes("metric"))
        return FiBarChart2;

    return FiGrid;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [collapsedUI, setCollapsedUI] = useState(false);

    // Mantengo NAV_ITEMS, pero SOLO muestro Analyze Reviews + Insights.
    const groups = useMemo<NormalizedGroup[]>(() => {
        const normalized = normalizeNav(NAV_ITEMS as unknown);
        const flat = normalized.flatMap((g) => g.items);

        const pick = (label: string, fallbackHref: string): NormalizedItem => {
            const target = label.toLowerCase();
            const found =
                flat.find((i) => i.label.toLowerCase() === target) ||
                flat.find((i) => i.label.toLowerCase().includes(target));
            return found ?? { label, href: fallbackHref };
        };

        return [{ items: [pick("Analyze Reviews", "/"), pick("Insights", "/insights")] }];
    }, []);

    const sidebarRef = useRef<HTMLElement | null>(null);
    const toggleIconRef = useRef<HTMLSpanElement | null>(null);
    const headerLeftRef = useRef<HTMLDivElement | null>(null);

    // Init sin saltos
    useLayoutEffect(() => {
        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const basic = sidebar.querySelectorAll<HTMLElement>('[data-collapse="label"]');
        const padded = sidebar.querySelectorAll<HTMLElement>('[data-collapse="padded"]');

        gsap.set(sidebar, { width: collapsed ? COLLAPSED_W : EXPANDED_W });
        gsap.set(headerLeftRef.current, {
            maxWidth: collapsed ? 0 : HEADER_LEFT_MAX,
            opacity: collapsed ? 0 : 1,
            // paddingRight: collapsed ? 0 : 12,
        });

        gsap.set(basic, { maxWidth: collapsed ? 0 : LABEL_MAX, opacity: collapsed ? 0 : 1 });
        gsap.set(padded, {
            maxWidth: collapsed ? 0 : LABEL_MAX,
            opacity: collapsed ? 0 : 1,
            paddingLeft: collapsed ? 0 : LABEL_PAD,
        });

        gsap.set(toggleIconRef.current, { rotate: collapsed ? 180 : 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useLayoutEffect(() => {
        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const basic = sidebar.querySelectorAll<HTMLElement>('[data-collapse="label"]');
        const padded = sidebar.querySelectorAll<HTMLElement>('[data-collapse="padded"]');

        const isClosing = collapsed;

        const widthDur = isClosing ? 0.18 : 0.22;
        const labelDur = isClosing ? 0.14 : 0.18;

        const widthEase = isClosing ? "power2.out" : "power4.out";
        const labelEase = isClosing ? "power2.out" : "power3.out";

        const tl = gsap.timeline({
            onComplete: () => {
                // Si el target terminó en collapsed=true, ahora sí aplica clases colapsadas
                if (collapsed) setCollapsedUI(true);
            },
        });

        tl.to(
            sidebar,
            { width: isClosing ? COLLAPSED_W : EXPANDED_W, duration: widthDur, ease: widthEase },
            0
        ).to(
            headerLeftRef.current,
            {
                maxWidth: isClosing ? 0 : HEADER_LEFT_MAX,
                opacity: isClosing ? 0 : 1,
                // paddingRight: isClosing ? 0 : 12,
                duration: widthDur,
                ease: widthEase,
            },
            0
        );

        tl.to(
            [...basic, ...padded],
            { opacity: isClosing ? 0 : 1, duration: isClosing ? 0.09 : 0.12, ease: labelEase },
            isClosing ? 0 : 0.06
        )
            .to(basic, { maxWidth: isClosing ? 0 : LABEL_MAX, duration: labelDur, ease: labelEase }, 0)
            .to(
                padded,
                {
                    maxWidth: isClosing ? 0 : LABEL_MAX,
                    paddingLeft: isClosing ? 0 : LABEL_PAD,
                    duration: labelDur,
                    ease: labelEase,
                },
                0
            );

        tl.to(toggleIconRef.current, { rotate: isClosing ? 180 : 0, duration: widthDur, ease: widthEase }, 0);

        // tl.kill() retorna Timeline; wrapper => cleanup retorna void
        return () => {
            tl.kill();
        };
    }, [collapsed]);

    const tooltipContentClass =
        "z-[9999] rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10";

    return (
        <aside
            ref={(el) => {
                sidebarRef.current = el;
            }}
            className={["relative shrink-0 h-dvh bg-white", "sticky top-0", "w-[280px]"].join(" ")}
            style={{ willChange: "width" }}
        >
            {/* ✅ Línea divisoria (siempre visible, encima del shadow) */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-30 w-px bg-zinc-200" />

            {/* ✅ Shadow/fade:
          - MÁS ANCHO total (w-24)
          - MENOS tramo blanco sólido
          - MÁS tramo degradado */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -right-24 z-20 w-24 bg-[linear-gradient(to_right,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.96)_45%,rgba(255,255,255,0)_100%)]"
            />

            <div className="h-full overflow-hidden">
                <Tooltip.Provider delayDuration={180} skipDelayDuration={100}>
                    <div className="flex h-full flex-col">
                        {/* HEADER */}
                        <div className="relative flex items-center px-3 pt-3 pr-14">
                            <div
                                ref={headerLeftRef}
                                className="flex items-center overflow-hidden"
                                style={{ maxWidth: HEADER_LEFT_MAX }}
                                aria-hidden={collapsed}
                            >
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#BC96E6]/20 text-[#BC96E6]">
                                    <BrandMark className="h-5 w-5" />
                                </div>

                                <div data-collapse="padded" className="block overflow-hidden" aria-hidden={collapsed}>
                                    <div className="overflow-hidden whitespace-nowrap text-sm font-semibold text-[#210B2C]">
                                        Review Intelligence
                                    </div>
                                    <div className="overflow-hidden whitespace-nowrap text-xs text-zinc-500">
                                        AI Review Analysis
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setCollapsed((prev) => {
                                        const next = !prev;

                                        // Si estamos ABRIENDO (prev=true -> next=false), aplica UI inmediato.
                                        if (prev === true && next === false) setCollapsedUI(false);

                                        // Si estamos CERRANDO (prev=false -> next=true), NO cambies UI todavía.
                                        return next;
                                    });
                                }}
                                className={[
                                    "absolute top-3 grid h-10 w-10 place-items-center rounded-lg",
                                    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                                    // ✅ en collapsed queda centrado en el sidebar (72px => (72-40)/2 = 16px)
                                    collapsed ? "right-4" : "right-3",
                                ].join(" ")}
                            >
                                <span ref={toggleIconRef} className="inline-flex">
                                    <FiChevronLeft className="text-xl" />
                                </span>
                            </button>
                        </div>

                        {/* NAV */}
                        <div className="mt-15 flex-1 overflow-hidden">
                            <nav className="h-full overflow-y-auto px-2 pb-3">
                                {groups.map((group, gi) => (
                                    <div key={gi} className="mb-4">
                                        <ul className="space-y-2">
                                            {group.items.map((item) => {
                                                const Icon = iconFor(item.label, item.href);
                                                const active =
                                                    item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);

                                                // Active => negrilla - al momento no esta haciendo nada
                                                const activeWeight = active ? "font-medium" : "font-medium";

                                                const rowExpandedClass = [
                                                    "group flex w-full items-center rounded-2xl py-2 px-2 text-sm transition-colors",
                                                    active
                                                        ? `${ACTIVE_BG} ${ACTIVE_FG} ${activeWeight}`
                                                        : `text-zinc-700 ${activeWeight} hover:bg-[rgba(188,150,230,0.12)] hover:text-[#210B2C]`,
                                                ].join(" ");

                                                const rowCollapsedClass = [

                                                    "group flex w-full items-center justify-center rounded-2xl py-2 px-2 text-sm transition-colors",
                                                    active
                                                        ? `${ACTIVE_BG} ${ACTIVE_FG} ${activeWeight}`
                                                        : `text-zinc-700 ${activeWeight} hover:bg-[rgba(188,150,230,0.12)] hover:text-[#210B2C]`,
                                                ].join(" ");

                                                const iconWrapCollapsedClass = [

                                                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-colors",
                                                ].join(" ");

                                                const linkEl = (
                                                    <Link
                                                        href={item.href}
                                                        title={collapsed ? item.label : undefined}
                                                        aria-label={item.label}
                                                        className={collapsedUI ? rowCollapsedClass : rowExpandedClass}
                                                    >
                                                        <span
                                                            className={
                                                                collapsed
                                                                    ? iconWrapCollapsedClass
                                                                    : // En expanded, el icono hereda color del row (active/hover)
                                                                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                                                            }
                                                        >
                                                            <Icon className="text-lg" />
                                                        </span>

                                                        <span
                                                            data-collapse="padded"
                                                            className="block overflow-hidden whitespace-nowrap"
                                                            aria-hidden={collapsed}
                                                        >
                                                            {item.label}
                                                        </span>
                                                    </Link>
                                                );

                                                return (
                                                    <li key={item.href}>
                                                        {collapsedUI ? (
                                                            <Tooltip.Root>
                                                                <Tooltip.Trigger asChild>{linkEl}</Tooltip.Trigger>
                                                                <Tooltip.Portal>
                                                                    <Tooltip.Content side="right" sideOffset={10} className={tooltipContentClass}>
                                                                        {item.label}
                                                                        <Tooltip.Arrow className="fill-zinc-900" />
                                                                    </Tooltip.Content>
                                                                </Tooltip.Portal>
                                                            </Tooltip.Root>
                                                        ) : (
                                                            linkEl
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </nav>
                        </div>

                        {/* FOOTER / USER */}
                        <div className="shrink-0 border-t border-zinc-200 p-3 h-[76px] flex items-center">
                            {collapsedUI ? (
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <div className="group flex w-full items-center justify-center rounded-lg px-2 py-2" title="User">
                                            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#BC96E6] text-[#210B2C]">
                                                <FiUser className="text-lg" />
                                            </div>
                                        </div>
                                    </Tooltip.Trigger>

                                    <Tooltip.Portal>
                                        <Tooltip.Content side="right" sideOffset={10} className={tooltipContentClass}>
                                            <div className="leading-tight">
                                                <div className="text-xs font-semibold">User</div>
                                                <div className="text-[11px] text-white/80">user@email.com</div>
                                            </div>
                                            <Tooltip.Arrow className="fill-zinc-900" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            ) : (
                                <div className="group flex items-center px-2 py-2 transition-colors hover:bg-zinc-100">

                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#BC96E6] text-[#210B2C]">
                                        <FiUser className="text-lg" />
                                    </div>

                                    <div data-collapse="padded" className="block overflow-hidden whitespace-nowrap" aria-hidden={collapsed}>
                                        <div className="text-sm font-medium text-[#210B2C]">User</div>
                                        <div className="text-xs text-zinc-500">user@email.com</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Tooltip.Provider>
            </div>
        </aside>
    );
}