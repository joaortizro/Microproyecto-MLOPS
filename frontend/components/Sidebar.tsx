"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
    FiBarChart2,
    FiChevronLeft,
    FiGrid,
    FiHome,
    FiMessageSquare,
    FiSearch,
    FiSettings,
    FiStar,
    FiUser,
} from "react-icons/fi";

import { NAV_ITEMS } from "../data/navigation";
import * as Tooltip from "@radix-ui/react-tooltip";

type NormalizedItem = { label: string; href: string };
type NormalizedGroup = { title?: string; items: NormalizedItem[] };

const EXPANDED_W = 280; // px
const COLLAPSED_W = 72; // px
const LABEL_MAX = 220; // px (ancho máximo de labels)
const LABEL_PAD = 12; // px (gap lógico entre icono y texto)
const HEADER_LEFT_MAX = 260; // px

function normalizeNav(raw: unknown): NormalizedGroup[] {
    const isRecord = (v: unknown): v is Record<string, unknown> =>
        typeof v === "object" && v !== null;

    const pickLabel = (v: Record<string, unknown>) =>
        String(v.label ?? v.name ?? v.title ?? "");
    const pickHref = (v: Record<string, unknown>) =>
        String(v.href ?? v.to ?? v.path ?? "#");

    if (Array.isArray(raw)) {
        // array de grupos
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

        // array simple de items
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

    if (href === "/" || key.includes("home") || key.includes("dashboard")) return FiHome;
    if (key.includes("review") || key.includes("comment") || key.includes("feedback")) return FiMessageSquare;
    if (key.includes("analy") || key.includes("search") || key.includes("scan")) return FiSearch;
    if (key.includes("insight") || key.includes("report") || key.includes("metric")) return FiBarChart2;
    if (key.includes("setting") || key.includes("config")) return FiSettings;

    return FiGrid;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const groups = useMemo(() => normalizeNav(NAV_ITEMS as unknown), []);

    const sidebarRef = useRef<HTMLElement | null>(null);
    const toggleIconRef = useRef<HTMLSpanElement | null>(null);
    const headerLeftRef = useRef<HTMLDivElement | null>(null);

    // Init sin “saltos”
    useLayoutEffect(() => {
        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const basic = sidebar.querySelectorAll<HTMLElement>('[data-collapse="label"]');
        const padded = sidebar.querySelectorAll<HTMLElement>('[data-collapse="padded"]');

        gsap.set(sidebar, { width: collapsed ? COLLAPSED_W : EXPANDED_W });
        gsap.set(headerLeftRef.current, {
            maxWidth: collapsed ? 0 : HEADER_LEFT_MAX,
            opacity: collapsed ? 0 : 1,
            paddingRight: collapsed ? 0 : 12,
        });

        gsap.set(basic, {
            maxWidth: collapsed ? 0 : LABEL_MAX,
            opacity: collapsed ? 0 : 1,
        });

        gsap.set(padded, {
            maxWidth: collapsed ? 0 : LABEL_MAX,
            opacity: collapsed ? 0 : 1,
            paddingLeft: collapsed ? 0 : LABEL_PAD,
        });

        gsap.set(toggleIconRef.current, { rotate: collapsed ? 180 : 0 });
    }, []); // mount

    // Animación más rápida + desacelera al final + distinta en open/close
    useLayoutEffect(function () {
        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const basic = sidebar.querySelectorAll<HTMLElement>('[data-collapse="label"]');
        const padded = sidebar.querySelectorAll<HTMLElement>('[data-collapse="padded"]');

        // collapsed === true -> estamos cerrando
        const isClosing = collapsed;

        const widthDur = isClosing ? 0.18 : 0.22;
        const labelDur = isClosing ? 0.14 : 0.18;

        // “rápida” pero al final más suave: eases tipo *out*
        const widthEase = isClosing ? "power2.out" : "power4.out";
        const labelEase = isClosing ? "power2.out" : "power3.out";

        const tl = gsap.timeline();

        // width + header left (logo+titulo) colapsa completo => en collapsed queda SOLO el botón
        tl.to(
            sidebar,
            { width: isClosing ? COLLAPSED_W : EXPANDED_W, duration: widthDur, ease: widthEase },
            0
        ).to(
            headerLeftRef.current,
            {
                maxWidth: isClosing ? 0 : HEADER_LEFT_MAX,
                opacity: isClosing ? 0 : 1,
                paddingRight: isClosing ? 0 : 12,
                duration: widthDur,
                ease: widthEase,
            },
            0
        );

        // labels (se esconden rápido al cerrar; al abrir aparecen un poco después)
        tl.to(
            [...basic, ...padded],
            { opacity: isClosing ? 0 : 1, duration: isClosing ? 0.09 : 0.12, ease: labelEase },
            isClosing ? 0 : 0.06
        ).to(
            basic,
            { maxWidth: isClosing ? 0 : LABEL_MAX, duration: labelDur, ease: labelEase },
            0
        ).to(
            padded,
            {
                maxWidth: isClosing ? 0 : LABEL_MAX,
                paddingLeft: isClosing ? 0 : LABEL_PAD,
                duration: labelDur,
                ease: labelEase,
            },
            0
        );

        // toggle icon rotate
        tl.to(
            toggleIconRef.current,
            { rotate: isClosing ? 180 : 0, duration: widthDur, ease: widthEase },
            0
        );

        return function cleanup() {
            tl.kill();
        };
    }, [collapsed]);

    // Contenido del tooltip (styling único reutilizable)
    const tooltipContentClass =
        "z-[9999] rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10";

    return (
        <aside
            ref={(el) => {
                sidebarRef.current = el;
            }}
            className={[
                "shrink-0 w-[280px] h-dvh overflow-hidden border-r border-zinc-200 bg-white",
                "sticky top-0",
            ].join(" ")}
            style={{ willChange: "width" }}
        >
            <Tooltip.Provider delayDuration={180} skipDelayDuration={100}>
                <div className="flex h-full flex-col">
                    {/* HEADER */}
                    <div className="flex items-center px-3 pt-3">
                        {/* Left block (⭐ + title/subtitle) — colapsa completo a 0 => en collapsed desaparece TODO */}
                        <div
                            ref={headerLeftRef}
                            className="flex items-center overflow-hidden"
                            style={{ maxWidth: HEADER_LEFT_MAX }}
                            aria-hidden={collapsed}
                        >
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-900">
                                <FiStar className="text-lg" />
                            </div>

                            {/* Title + subtitle: colapsable */}
                            <div
                                data-collapse="padded"
                                className="block overflow-hidden"
                                aria-hidden={collapsed}
                            >
                                <div className="overflow-hidden whitespace-nowrap text-sm font-semibold text-zinc-900">
                                    Review Intelligence
                                </div>
                                <div className="overflow-hidden whitespace-nowrap text-xs text-zinc-500">
                                    AI Review Analysis
                                </div>
                            </div>
                        </div>

                        {/* Toggle (cuando colapsa queda esto solo) */}
                        <button
                            type="button"
                            onClick={() => setCollapsed((v) => !v)}
                            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none"
                            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <span ref={toggleIconRef} className="inline-flex">
                                <FiChevronLeft className="text-xl" />
                            </span>
                        </button>
                    </div>

                    {/* NAV: un poco más abajo del header */}
                    <div className="mt-6 flex-1 overflow-hidden">
                        <nav className="h-full overflow-y-auto px-2 pb-3">
                            {groups.map((group, gi) => (
                                <div key={gi} className="mb-6">
                                    {group.title ? (
                                        <div className="px-2 pb-2 pt-2">
                                            <span
                                                data-collapse="label"
                                                className="block overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-zinc-400"
                                                aria-hidden={collapsed}
                                            >
                                                {group.title}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="pb-2" />
                                    )}

                                    <ul className="space-y-1">
                                        {group.items.map((item) => {
                                            const Icon = iconFor(item.label, item.href);
                                            const active =
                                                item.href === "/"
                                                    ? pathname === "/"
                                                    : pathname?.startsWith(item.href);

                                            /**
                                             * Fix del “espacio raro a la derecha” en collapsed:
                                             * - En expanded el background activo/hover es en el row completo.
                                             * - En collapsed el highlight activo/hover vive SOLO en el contenedor del icono (40x40),
                                             *   así nunca se ve un “píldora” alargada con espacio sobrante.
                                             */
                                            const rowClass = [
                                                "group flex items-center rounded-lg py-2",
                                                "text-sm transition-colors",
                                                collapsed
                                                    ? "px-2 text-zinc-700 hover:text-zinc-900"
                                                    : "px-2 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                                                !collapsed && active ? "bg-zinc-100 text-zinc-900" : "",
                                            ].join(" ");

                                            const iconWrapClass = [
                                                "grid h-10 w-10 shrink-0 place-items-center rounded-md transition-colors",
                                                collapsed
                                                    ? active
                                                        ? "bg-zinc-100 text-zinc-900"
                                                        : "group-hover:bg-zinc-100 group-hover:text-zinc-900"
                                                    : "",
                                            ].join(" ");

                                            const linkEl = (
                                                <Link
                                                    href={item.href}
                                                    title={collapsed ? item.label : undefined} // fallback nativo
                                                    aria-label={item.label}
                                                    className={rowClass}
                                                >
                                                    <span className={iconWrapClass}>
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
                                                    {collapsed ? (
                                                        <Tooltip.Root>
                                                            <Tooltip.Trigger asChild>
                                                                {linkEl}
                                                            </Tooltip.Trigger>

                                                            <Tooltip.Portal>
                                                                <Tooltip.Content
                                                                    side="right"
                                                                    sideOffset={10}
                                                                    className={tooltipContentClass}
                                                                >
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
                    <div className="border-t border-zinc-200 p-3">
                        {(() => {
                            const userRow = (
                                <div
                                    className={[
                                        "group flex items-center rounded-lg px-2 py-2 transition-colors",
                                        collapsed ? "" : "hover:bg-zinc-100",
                                    ].join(" ")}
                                >
                                    {/* Avatar: default profile icon dentro del círculo */}
                                    <div
                                        className={[
                                            "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 transition-colors",
                                            collapsed ? "group-hover:bg-zinc-100" : "",
                                        ].join(" ")}
                                        aria-hidden="true"
                                    >
                                        <FiUser className="text-lg" />
                                    </div>

                                    {/* Nombre/email colapsables */}
                                    <div
                                        data-collapse="padded"
                                        className="block overflow-hidden whitespace-nowrap"
                                        aria-hidden={collapsed}
                                    >
                                        <div className="text-sm font-medium text-zinc-900">User</div>
                                        <div className="text-xs text-zinc-500">user@email.com</div>
                                    </div>
                                </div>
                            );

                            return collapsed ? (
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        {/* wrapper neutro para trigger */}
                                        <div title="User">{userRow}</div>
                                    </Tooltip.Trigger>

                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            side="right"
                                            sideOffset={10}
                                            className={tooltipContentClass}
                                        >
                                            <div className="leading-tight">
                                                <div className="text-xs font-semibold">User</div>
                                                <div className="text-[11px] text-white/80">
                                                    user@email.com
                                                </div>
                                            </div>
                                            <Tooltip.Arrow className="fill-zinc-900" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            ) : (
                                userRow
                            );
                        })()}
                    </div>
                </div>
            </Tooltip.Provider>
        </aside>
    );
}
