"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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

  const fetchStores = useCallback(async () => {
    const response = await fetch("/api/stores", { cache: "no-store" });
    if (!response.ok) {
      setMessage("No se pudo cargar la lista de locales.");
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
      setMessage(data.error || "No se pudo crear el local y su cuenta.");
      return;
    }

    setStoreName("");
    setStoreSlug("");
    setManagerName("");
    setManagerEmail("");
    setManagerPassword("");
    setMessage("Local y cuenta creados correctamente.");
    await fetchStores();
  }

  return (
    <section className="grid gap-5">
      <header className="card-panel p-6">
        <p className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">
          Superadmin
        </p>
        <h1 className="mt-3 font-title text-3xl tracking-tight md:text-4xl">
          Crear locales y asignar cuentas
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Solo SUPERADMIN puede crear un local y asociar su cuenta administradora.
        </p>
      </header>

      <article className="card-panel p-5">
        <h2 className="font-title text-xl">Nuevo local + cuenta</h2>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateStore}>
          <input
            className="input-field"
            placeholder="Nombre del local"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            required
          />
          <input
            className="input-field"
            placeholder="Slug (opcional)"
            value={storeSlug}
            onChange={(event) => setStoreSlug(event.target.value)}
          />

          <input
            className="input-field"
            placeholder="Nombre de la cuenta del local"
            value={managerName}
            onChange={(event) => setManagerName(event.target.value)}
            required
          />
          <input
            type="email"
            className="input-field"
            placeholder="Email de la cuenta del local"
            value={managerEmail}
            onChange={(event) => setManagerEmail(event.target.value)}
            required
          />

          <input
            type="password"
            className="input-field md:col-span-2"
            placeholder="Password inicial de la cuenta del local"
            minLength={8}
            value={managerPassword}
            onChange={(event) => setManagerPassword(event.target.value)}
            required
          />

          <button type="submit" className="btn-primary md:col-span-2" disabled={loading}>
            {loading ? "Creando..." : "Crear local + cuenta"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm font-medium text-[var(--ink)]">{message}</p> : null}
      </article>

      <article className="card-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-title text-xl">Locales creados</h2>
          <button className="btn-secondary" type="button" onClick={() => void fetchStores()}>
            Refrescar
          </button>
        </div>

        <div className="grid gap-3">
          {stores.length === 0 ? (
            <p className="text-sm text-black/60">Todavia no hay locales cargados.</p>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="rounded-2xl border border-black/10 bg-white/85 p-4 md:flex md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold tracking-tight">{store.name}</p>
                  <p className="text-sm text-black/65">Slug: {store.slug}</p>
                  <p className="text-sm text-black/65">
                    Cuenta local: {store.managerUser?.email ?? "Sin cuenta asociada"}
                  </p>
                </div>
                <span className="status-pill bg-black/10 text-black/70">{store.managerUser?.role ?? "N/A"}</span>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
