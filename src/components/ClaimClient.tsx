"use client";

import { useEffect, useRef, useState } from "react";

import { signIn, useSession } from "next-auth/react";

type ClaimClientProps = {
  token: string;
};

export function ClaimClient({ token }: ClaimClientProps) {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("Verificando sesion...");
  const [error, setError] = useState(false);
  const hasAttempted = useRef(false);

  useEffect(() => {
    async function claimOrder() {
      if (status === "loading") {
        return;
      }

      if (!session) {
        await signIn(undefined, { callbackUrl: `/claim/${token}` });
        return;
      }

      if (hasAttempted.current) {
        return;
      }

      hasAttempted.current = true;
      setMessage("Asociando pedido...");

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json()) as {
        error?: string;
        order?: { orderNumber: string; store: { name: string } };
      };

      if (!response.ok || !data.order) {
        setError(true);
        setMessage(data.error || "No se pudo asociar el pedido");
        return;
      }

      setError(false);
      setMessage(`Listo. Pedido ${data.order.orderNumber} de ${data.order.store.name} vinculado.`);
    }

    void claimOrder();
  }, [session, status, token]);

  return (
    <section className="mx-auto w-full max-w-xl card-panel p-7 md:p-10">
      <p className="mb-3 inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">
        Claim por QR
      </p>
      <h1 className="font-title text-3xl tracking-tight">Seguimiento de pedido</h1>
      <p className="mt-4 text-base leading-7 text-black/75">{message}</p>
      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700">
          Si el problema persiste, pedi al local que regenere el QR del pedido.
        </p>
      ) : null}
    </section>
  );
}
