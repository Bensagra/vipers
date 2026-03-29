"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  managerUser: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
  } | null;
  createdAt: string;
};

export function SuperAdminPanel() {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const linkedCount = useMemo(
    () => stores.filter((store) => store.managerUser?.id).length,
    [stores],
  );

  const fetchStores = useCallback(async () => {
    const response = await fetch("/api/stores", { cache: "no-store" });
    if (!response.ok) {
      setMessage("No se pudo cargar la lista.");
      return;
    }

    const data = (await response.json()) as { stores: StoreSummary[] };
    setStores(data.stores);
  }, []);

  useEffect(() => {
    void fetchStores();

    const timer = setInterval(() => {
      void fetchStores();
    }, 20000);

    return () => clearInterval(timer);
  }, [fetchStores]);

  async function handleCreateStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: storeName,
        slug: storeSlug || undefined,
        managerName,
        managerEmail,
        managerPassword,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "No se pudo crear el local.");
      return;
    }

    setStoreName("");
    setStoreSlug("");
    setManagerName("");
    setManagerEmail("");
    setManagerPassword("");
    setMessage("Local + cuenta creados.");
    await fetchStores();
  }

  return (
    <section className="grid gap-5">
      <header className="card-panel reveal p-6">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip-sun">Control center</span>
            <h1 className="mt-3 font-title text-3xl tracking-tight md:text-4xl">Panel Superadmin</h1>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="metric-card min-w-[112px]">
              <p className="metric-value">{stores.length}</p>
              <p className="metric-label">locales</p>
            </div>
            <div className="metric-card min-w-[112px]">
              <p className="metric-value">{linkedCount}</p>
              <p className="metric-label">cuentas</p>
            </div>
          </div>
        </div>
      </header>

      <article className="card-panel p-5">
        <div className="relative z-10">
          <h2 className="font-title text-2xl">Alta de local</h2>

          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateStore}>
            <input
              className="input-field"
              placeholder="Nombre local"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              required
            />
            <input
              className="input-field"
              placeholder="Slug opcional"
              value={storeSlug}
              onChange={(event) => setStoreSlug(event.target.value)}
            />

            <input
              className="input-field"
              placeholder="Nombre cuenta"
              value={managerName}
              onChange={(event) => setManagerName(event.target.value)}
              required
            />
            <input
              type="email"
              className="input-field"
              placeholder="Email cuenta"
              value={managerEmail}
              onChange={(event) => setManagerEmail(event.target.value)}
              required
            />

            <input
              type="password"
              className="input-field md:col-span-2"
              placeholder="Password inicial"
              minLength={8}
              value={managerPassword}
              onChange={(event) => setManagerPassword(event.target.value)}
              required
            />

            <button type="submit" className="btn-primary md:col-span-2" disabled={loading}>
              {loading ? "Creando..." : "Crear local + cuenta"}
            </button>
          </form>

          {message ? <p className="mt-3 text-sm subtle-text">{message}</p> : null}
        </div>
      </article>

      <article className="card-panel p-5">
        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-title text-2xl">Locales</h2>
            <button className="btn-secondary" type="button" onClick={() => void fetchStores()}>
              Refrescar
            </button>
          </div>

          <div className="grid gap-3">
            {stores.length === 0 ? (
              <p className="text-sm subtle-text">Sin locales cargados.</p>
            ) : (
              stores.map((store) => (
                <div
                  key={store.id}
                  className="rounded-2xl border border-[var(--line)] bg-white/80 p-4 md:flex md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-title text-2xl leading-none">{store.name}</p>
                    <p className="mt-1 text-sm subtle-text">/{store.slug}</p>
                    <p className="mt-1 text-sm subtle-text">
                      {store.managerUser?.email ?? "Sin cuenta asociada"}
                    </p>
                  </div>

                  <span className="status-pill bg-[var(--brand-soft)] text-[var(--brand-strong)]">
                    {store.managerUser?.role ?? "N/A"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
