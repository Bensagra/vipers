"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import QRCode from "react-qr-code";

type Store = {
  id: string;
  name: string;
  slug: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  store: { id: string; name: string };
  user: { email: string | null; name: string | null } | null;
};

function statusClass(status: string) {
  switch (status) {
    case "READY":
      return "bg-[var(--mint-soft)] text-[var(--mint)]";
    case "CLAIMED":
      return "bg-sky-100 text-sky-700";
    case "CREATED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-black/10 text-black/70";
  }
}

export function AdminPanel() {
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [claimUrl, setClaimUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) || null,
    [stores, selectedStoreId],
  );

  const fetchStores = useCallback(async () => {
    const response = await fetch("/api/stores", { cache: "no-store" });
    if (!response.ok) {
      setMessage("No se pudieron cargar tus locales.");
      return;
    }

    const data = (await response.json()) as { stores: Store[] };
    setStores(data.stores);

    if (data.stores.length === 0) {
      setSelectedStoreId("");
      return;
    }

    if (!selectedStoreId || !data.stores.some((store) => store.id === selectedStoreId)) {
      setSelectedStoreId(data.stores[0].id);
    }
  }, [selectedStoreId]);

  const fetchOrders = useCallback(async (storeId: string) => {
    if (!storeId) {
      setOrders([]);
      return;
    }

    const response = await fetch(`/api/orders?storeId=${storeId}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { orders: Order[] };
    setOrders(data.orders);
  }, []);

  useEffect(() => {
    void fetchStores();

    const timer = setInterval(() => {
      void fetchStores();
    }, 20000);

    return () => clearInterval(timer);
  }, [fetchStores]);

  useEffect(() => {
    if (!selectedStoreId) {
      return;
    }

    void fetchOrders(selectedStoreId);

    const timer = setInterval(() => {
      void fetchOrders(selectedStoreId);
    }, 9000);

    return () => clearInterval(timer);
  }, [selectedStoreId, fetchOrders]);

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStoreId || !orderNumber.trim()) {
      setMessage("Completa local y numero de pedido");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: selectedStoreId, orderNumber }),
    });

    const data = (await response.json()) as { error?: string; claimUrl?: string };
    setLoading(false);

    if (!response.ok || !data.claimUrl) {
      setMessage(data.error || "No se pudo crear el pedido");
      return;
    }

    setClaimUrl(data.claimUrl);
    setOrderNumber("");
    setMessage("Pedido creado y QR generado");
    await fetchOrders(selectedStoreId);
  }

  async function markAsReady(orderId: string) {
    const response = await fetch(`/api/orders/${orderId}/ready`, { method: "POST" });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(data.error || "No se pudo marcar READY");
      return;
    }

    setMessage("Pedido marcado como READY");
    if (selectedStoreId) {
      await fetchOrders(selectedStoreId);
    }
  }

  return (
    <section className="grid gap-5">
      <header className="card-panel p-6">
        <p className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          Panel de local
        </p>
        <h1 className="mt-3 font-title text-3xl tracking-tight md:text-4xl">Crear pedido y QR</h1>
        <p className="mt-2 text-sm text-black/70">
          El superadmin define y asigna locales. Vos operas pedidos de tus locales asignados.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <article className="card-panel space-y-3 p-5">
          <h2 className="font-title text-xl">1) Elegir local</h2>

          {stores.length > 0 ? (
            <select
              className="input-field"
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.slug})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-black/60">
              Tu cuenta aun no tiene local asignado. Pedile al superadmin que te asigne uno.
            </p>
          )}
        </article>

        <article className="card-panel space-y-3 p-5">
          <h2 className="font-title text-xl">2) Crear pedido + QR</h2>

          <form className="space-y-3" onSubmit={handleCreateOrder}>
            <input
              className="input-field"
              placeholder="Numero de pedido"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
            />
            <button className="btn-primary w-full" disabled={loading || !selectedStore} type="submit">
              Crear pedido
            </button>
          </form>

          {claimUrl ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="mb-2 text-sm font-medium">QR del pedido</p>
              <div className="inline-block rounded-xl bg-white p-3">
                <QRCode value={claimUrl} size={190} />
              </div>
              <p className="mt-3 break-all text-xs text-black/60">{claimUrl}</p>
            </div>
          ) : null}
        </article>
      </div>

      {message ? <p className="text-sm font-medium text-[var(--ink)]">{message}</p> : null}

      <article className="card-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-title text-xl">Pedidos recientes</h2>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => selectedStoreId && void fetchOrders(selectedStoreId)}
          >
            Refrescar
          </button>
        </div>

        <div className="grid gap-3">
          {orders.length === 0 ? (
            <p className="text-sm text-black/60">Aun no hay pedidos para este local.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold tracking-tight">Pedido {order.orderNumber}</p>
                  <p className="text-sm text-black/65">
                    {order.user?.email ? `Reclamado por ${order.user.email}` : "Aun sin reclamar"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`status-pill ${statusClass(order.status)}`}>{order.status}</span>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={order.status === "READY"}
                    onClick={() => void markAsReady(order.id)}
                  >
                    Marcar READY
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
