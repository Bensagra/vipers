import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { AuthSessionProvider } from "@/components/providers/SessionProvider";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vipers | Turnos por QR",
  description: "Pedidos por QR con notificaciones push y panel de locales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${jakarta.variable} ${syne.variable} h-full antialiased`}>
      <body className="min-h-full text-[var(--ink)]">
        <AuthSessionProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_9%,rgba(43,108,246,0.18),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(229,107,45,0.14),transparent_30%),linear-gradient(155deg,#f7f9fe_0%,#f4f7ff_44%,#fcf8f6_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-50 [background-image:linear-gradient(to_right,rgba(16,24,40,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,24,40,0.03)_1px,transparent_1px)] [background-size:46px_46px]" />
          <SiteHeader />
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-8">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
