import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { AuthSessionProvider } from "@/components/providers/SessionProvider";

import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
    <html
      lang="es"
      className={`${sora.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg)] text-[var(--ink)]">
        <AuthSessionProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_14%,rgba(255,107,53,0.18),transparent_32%),radial-gradient(circle_at_89%_6%,rgba(31,157,133,0.18),transparent_24%),linear-gradient(160deg,#fff9ef_0%,#fff3dd_45%,#fefaf5_100%)]" />
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 md:px-8">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
