import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simulador Académico — Formulario Virtual N.º 1611 (Nuevo RUS)",
  description:
    "Prototipo educativo del curso Pruebas y Calidad de Software: simula la declaración mensual del Nuevo Régimen Único Simplificado (Nuevo RUS) mediante el Formulario Virtual N.º 1611. No es una aplicación oficial de SUNAT; no realiza declaraciones ni pagos reales.",
  keywords: [
    "simulador académico",
    "Nuevo RUS",
    "Formulario 1611",
    "proyecto universitario",
    "pruebas de software",
  ],
  authors: [{ name: "Proyecto universitario — Pruebas y Calidad de Software" }],
  openGraph: {
    title: "Simulador Académico — Formulario Virtual N.º 1611 (Nuevo RUS)",
    description:
      "Prototipo educativo que simula la declaración mensual del Nuevo RUS. No es una aplicación oficial de SUNAT.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
