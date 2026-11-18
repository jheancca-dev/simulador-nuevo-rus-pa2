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
  title: "Formulario Virtual N.º 1611 — Nuevo RUS",
  description:
    "Declaración mensual del Nuevo Régimen Único Simplificado (Nuevo RUS) mediante el Formulario Virtual N.º 1611. Esta no es una aplicación oficial de SUNAT y no realiza declaraciones ni pagos reales.",
  keywords: [
    "Formulario 1611",
    "Nuevo RUS",
    "declaración mensual",
    "proyecto universitario",
    "pruebas de software",
  ],
  authors: [{ name: "Proyecto universitario — Pruebas y Calidad de Software" }],
  openGraph: {
    title: "Formulario Virtual N.º 1611 — Nuevo RUS",
    description:
      "Declaración mensual del Nuevo RUS mediante el Formulario Virtual N.º 1611. No es una aplicación oficial de SUNAT.",
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
