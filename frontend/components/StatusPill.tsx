import type { DemoRunStatus } from "../types/demo";

const stylesByStatus: Record<DemoRunStatus, string> = {
  queued: "bg-zinc-900 text-zinc-200 border-zinc-700",
  running: "bg-blue-950/50 text-blue-200 border-blue-900",
  completed: "bg-emerald-950/50 text-emerald-200 border-emerald-900",
  failed: "bg-red-950/50 text-red-200 border-red-900",
};

export function StatusPill({ status }: { status: DemoRunStatus }) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";
  const cls = stylesByStatus[status] ?? stylesByStatus.queued;

  return <span className={`${base} ${cls}`}>{status}</span>;
}
