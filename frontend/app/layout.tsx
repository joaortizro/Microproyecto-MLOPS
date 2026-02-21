import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import AppShell from "../components/AppShell";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans", 
});

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
      <body className={`${poppins.variable} overflow-hidden antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}