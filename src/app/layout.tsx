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

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gwdigitalcompany.com").replace(/\/$/, "");
const DESCRICAO = "Sistema de gestão escolar para escolas da Guiné-Bissau: matrículas, notas de 0 a 20, faltas, boletins, propinas em FCFA com Orange Money e MTN MoMo, declarações com QR e portal do encarregado.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "edu.gw — Sistema de gestão escolar para a Guiné-Bissau", template: "%s · edu.gw" },
  description: DESCRICAO,
  applicationName: "edu.gw",
  manifest: "/manifest.webmanifest",
  keywords: ["gestão escolar", "software escolar", "Guiné-Bissau", "Bissau", "escola", "matrículas", "notas", "boletins", "propinas", "FCFA", "edu.gw", "GW Digital Company"],
  authors: [{ name: "GW Digital Company" }],
  openGraph: {
    type: "website",
    locale: "pt_GW",
    siteName: "edu.gw",
    url: SITE,
    title: "edu.gw — A secretaria da sua escola, organizada e no telemóvel",
    description: DESCRICAO,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "edu.gw — gestão escolar para a Guiné-Bissau" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = { themeColor: "#0B5D3B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${sans.variable} ${titulo.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
