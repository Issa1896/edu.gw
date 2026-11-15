import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fontes alojadas no próprio projeto: carregam sem depender do Google em redes lentas.
const sans = localFont({
  src: [
    { path: "../fonts/IBMPlexSans-400.woff2", weight: "400" },
    { path: "../fonts/IBMPlexSans-500.woff2", weight: "500" },
    { path: "../fonts/IBMPlexSans-600.woff2", weight: "600" },
    { path: "../fonts/IBMPlexSans-700.woff2", weight: "700" },
  ],
  variable: "--fonte-sans",
  display: "swap",
});
const titulo = localFont({
  src: [
    { path: "../fonts/Fraunces-600.woff2", weight: "600" },
    { path: "../fonts/Fraunces-700.woff2", weight: "700" },
  ],
  variable: "--fonte-titulo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "edu.gw — Gestão Escolar", template: "%s · edu.gw" },
  description: "Sistema de gestão escolar para escolas da Guiné-Bissau: matrículas, notas, faltas, propinas e comunicação com encarregados.",
  manifest: "/manifest.webmanifest",
  applicationName: "edu.gw",
};

export const viewport: Viewport = { themeColor: "#0B5D3B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${sans.variable} ${titulo.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
