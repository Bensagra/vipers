"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PushPermissionButton } from "@/components/PushPermissionButton";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  readyAt: string | null;
  store: { name: string };
  events: { id: string; type: string; message: string | null; createdAt: string }[];
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  channel: "IN_APP" | "PUSH";
  deliveryStatus: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
  readAt: string | null;
  order: { orderNumber: string; status: string; store: { name: string } } | null;
};

function orderStatusClass(status: string) {
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

function notificationStatusClass(status: string) {
  if (status === "SENT") {
    return "bg-[var(--mint-soft)] text-[var(--mint)]";
  }

  if (status === "FAILED") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function MyOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const latestSeenNotificationId = useRef<string | null>(null);
  const firstFetchDone = useRef(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  async function loadData() {
    const [ordersResponse, notificationsResponse] = await Promise.all([
      fetch("/api/me/orders", { cache: "no-store" }),
      fetch("/api/me/notifications", { cache: "no-store" }),
    ]);

    if (!ordersResponse.ok || !notificationsResponse.ok) {
      setMessage("No se pudo actualizar la informacion.");
      setLoading(false);
      return;
    }

    const ordersData = (await ordersResponse.json()) as { orders: Order[] };
    const notificationsData = (await notificationsResponse.json()) as {
      notifications: NotificationItem[];
    };

    setOrders(ordersData.orders);
    setNotifications(notificationsData.notifications);
    setLoading(false);
    setMessage("");

    const newest = notificationsData.notifications[0];
    if (!newest) {
      return;
    }

    if (!firstFetchDone.current) {
      firstFetchDone.current = true;
      latestSeenNotificationId.current = newest.id;
      return;
    }

    if (
      newest.id !== latestSeenNotificationId.current &&
      newest.channel === "IN_APP" &&
      newest.deliveryStatus === "SENT" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      // Browser notification while page is open, acts as web fallback if push fails.
      new Notification(newest.title, { body: newest.body });
    }

    latestSeenNotificationId.current = newest.id;
  }

  useEffect(() => {
    void loadData();

    const interval = setInterval(() => {
      void loadData();
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  async function markAllAsRead() {
    const response = await fetch("/api/me/notifications", { method: "POST" });
    if (!response.ok) {
      setMessage("No se pudieron marcar como leidas.");
      return;
    }

    await loadData();
  }

  return (
    <section className="grid gap-5">
      <header className="card-panel p-6">
        <p className="inline-flex rounded-full bg-[var(--mint-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mint)]">
          Cliente
        </p>
        <h1 className="mt-3 font-title text-3xl tracking-tight md:text-4xl">Mis pedidos</h1>
        <p className="mt-2 text-sm text-black/70">
          Esta pantalla se actualiza automaticamente y conserva historial de notificaciones.
        </p>
      </header>

      <PushPermissionButton />

      <article className="card-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-title text-xl">Notificaciones</h2>
          <div className="flex items-center gap-2">
            <span className="status-pill bg-black/10 text-black/70">Sin leer: {unreadCount}</span>
            <button className="btn-secondary" type="button" onClick={markAllAsRead}>
              Marcar leidas
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-black/60">Todavia no hay notificaciones.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-2xl border border-black/10 bg-white/85 p-4"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="status-pill bg-black/10 text-black/70">{notification.channel}</span>
                  <span
                    className={`status-pill ${notificationStatusClass(notification.deliveryStatus)}`}
                  >
                    {notification.deliveryStatus}
                  </span>
                  {!notification.readAt ? (
                    <span className="status-pill bg-[var(--brand-soft)] text-[var(--brand)]">NUEVA</span>
                  ) : null}
                </div>

                <p className="font-semibold tracking-tight">{notification.title}</p>
                <p className="text-sm text-black/70">{notification.body}</p>
                <p className="mt-1 text-xs text-black/45">{formatDate(notification.createdAt)}</p>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="card-panel p-5">
        <h2 className="mb-4 font-title text-xl">Pedidos vinculados</h2>

        {loading ? <p className="text-sm text-black/65">Cargando pedidos...</p> : null}
        {message ? <p className="text-sm text-rose-700">{message}</p> : null}

        <div className="grid gap-3">
          {orders.length === 0 ? (
            <p className="text-sm text-black/60">Escanea el QR del local para vincular un pedido.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-black/10 bg-white/85 p-4 md:flex md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold tracking-tight">Pedido {order.orderNumber}</p>
                  <p className="text-sm text-black/65">Local: {order.store.name}</p>
                  <p className="text-xs text-black/45">Creado: {formatDate(order.createdAt)}</p>
                  {order.readyAt ? (
                    <p className="text-xs text-black/45">Listo: {formatDate(order.readyAt)}</p>
                  ) : null}
                </div>

                <div className="mt-3 md:mt-0">
                  <span className={`status-pill ${orderStatusClass(order.status)}`}>{order.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
