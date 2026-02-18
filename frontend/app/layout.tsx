import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// import { AppShell } from "../components/AppShell";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Microproyecto MLOps",
    template: "%s | Microproyecto MLOps",
  },
  description: "Frontend demo (Next.js + TypeScript) dentro de un monorepo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
