import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { Navbar } from "../components/Navbar";
import { Container } from "../components/Container";

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
      <body className="min-h-dvh bg-black text-zinc-100 antialiased">
        <Navbar />

        <main className="py-10">
          <Container>{children}</Container>
        </main>

        <footer className="border-t border-zinc-800 py-6">
          <Container>
            <p className="text-xs text-zinc-400">
              © {new Date().getFullYear()} Microproyecto-MLOPS · Demo UI
            </p>
          </Container>
        </footer>
      </body>
    </html>
  );
}
