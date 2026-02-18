import type { DemoRunStatus } from "../types/demo";

const stylesByStatus: Record<DemoRunStatus, string> = {
  queued: "bg-zinc-50 text-zinc-700 border-zinc-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

export function StatusPill({ status }: { status: DemoRunStatus }) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";
  const cls = stylesByStatus[status] ?? stylesByStatus.queued;

  return <span className={`${base} ${cls}`}>{status}</span>;
}
