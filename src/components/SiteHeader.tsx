"use client";

import clsx from "clsx";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/75 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-[var(--brand)] shadow-[0_0_0_6px_rgba(255,107,53,0.15)] transition group-hover:scale-110" />
          <span className="text-lg font-semibold tracking-tight">Vipers</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm md:gap-3">
          <Link className="rounded-full px-3 py-1.5 hover:bg-black/5" href="/my-orders">
            Mis pedidos
          </Link>

          {session?.user.role === "SUPERADMIN" && (
            <Link className="rounded-full px-3 py-1.5 hover:bg-black/5" href="/superadmin">
              Superadmin
            </Link>
          )}

          {(session?.user.role === "ADMIN" || session?.user.role === "SUPERADMIN") && (
            <Link className="rounded-full px-3 py-1.5 hover:bg-black/5" href="/admin">
              Admin
            </Link>
          )}

          {status === "loading" && <span className="rounded-full bg-black/5 px-3 py-1.5">...</span>}

          {session?.user ? (
            <>
              <span
                className={clsx(
                  "hidden rounded-full px-3 py-1 text-xs font-medium md:inline-flex",
                  session.user.role === "SUPERADMIN"
                    ? "bg-[var(--brand)] text-white"
                    : session.user.role === "ADMIN"
                    ? "bg-[var(--ink)] text-white"
                    : "bg-[var(--mint-soft)] text-[var(--mint)]",
                )}
              >
                {session.user.role}
              </span>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-white transition hover:opacity-90"
                type="button"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-full px-3 py-1.5 hover:bg-black/5" href="/login">
                Entrar
              </Link>
              <Link
                className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-white transition hover:translate-y-[-1px] hover:shadow-lg"
                href="/register"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
