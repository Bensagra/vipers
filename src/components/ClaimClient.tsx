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
    <section className="mx-auto w-full max-w-xl card-panel reveal p-7 md:p-10">
      <div className="relative z-10">
        <span className="chip-brand">QR claim</span>
        <h1 className="mt-3 font-title text-3xl tracking-tight">Vincular pedido</h1>
        <p className="mt-4 text-base subtle-text">{message}</p>
        {error ? <p className="mt-3 text-sm font-medium text-red-700">Proba con un QR nuevo.</p> : null}
      </div>
    </section>
  );
}
