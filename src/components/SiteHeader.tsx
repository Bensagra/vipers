"use client";

import clsx from "clsx";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-3 z-30 px-4 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/75 px-3 py-2 backdrop-blur-xl shadow-[0_18px_35px_-28px_rgba(8,17,40,0.65)]">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(140deg,var(--brand),var(--brand-strong))] text-xs font-bold text-white shadow-[0_8px_20px_-12px_rgba(2,132,199,0.9)]">
            VP
          </span>
          <span className="font-title text-lg">Vipers</span>
        </Link>

        <nav className="flex max-w-[62vw] items-center gap-1.5 overflow-x-auto text-sm md:max-w-none md:gap-2">
          <Link className="nav-pill" href="/my-orders">
            Mis pedidos
          </Link>

          {session?.user.role === "SUPERADMIN" && (
            <Link className="nav-pill" href="/superadmin">
              Superadmin
            </Link>
          )}

          {(session?.user.role === "ADMIN" || session?.user.role === "SUPERADMIN") && (
            <Link className="nav-pill" href="/admin">
              Admin
            </Link>
          )}

          {status === "loading" && <span className="nav-pill">...</span>}

          {session?.user ? (
            <>
              <span
                className={clsx(
                  "hidden rounded-full px-2.5 py-1 text-[11px] font-semibold md:inline-flex",
                  session.user.role === "SUPERADMIN"
                    ? "bg-[var(--sun-soft)] text-[var(--sun)]"
                    : session.user.role === "ADMIN"
                    ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                    : "bg-[var(--mint-soft)] text-[var(--mint)]",
                )}
              >
                {session.user.role}
              </span>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-secondary"
                type="button"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="nav-pill" href="/login">
                Entrar
              </Link>
              <Link className="btn-primary" href="/register">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
