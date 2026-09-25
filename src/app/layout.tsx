import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Enchepaitos Tournament",
  description:
    "Plataforma de gestión del torneo privado Enchepaitos Tournament para Football League 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geist.variable} bg-turf-night antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
