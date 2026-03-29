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
  title: "Vipers | Restaurant Pager",
  description: "Pedidos por QR con notificaciones push y panel admin.",
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
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_14%,rgba(14,165,233,0.23),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(255,107,53,0.2),transparent_26%),linear-gradient(150deg,#f4f8ff_0%,#eef4ff_42%,#fdf7f3_100%)]" />
          <div className="pointer-events-none fixed inset-0 -z-10 opacity-55 [background-image:linear-gradient(to_right,rgba(13,21,40,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(13,21,40,0.035)_1px,transparent_1px)] [background-size:42px_42px]" />
          <SiteHeader />
          <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-8">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
