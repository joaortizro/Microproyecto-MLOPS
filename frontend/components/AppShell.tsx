import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-zinc-50 text-zinc-900">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto bg-zinc-50">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}