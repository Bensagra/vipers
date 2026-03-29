import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:py-14">
      <article className="card-panel reveal p-7 md:p-10">
        <div className="relative z-10">
          <span className="chip-brand">Vipers pager</span>
          <h1 className="mt-4 max-w-3xl font-title text-balance text-4xl leading-[0.98] tracking-tight md:text-6xl">
            Pedidos con QR.
            <br />
            Aviso en tiempo real.
          </h1>
          <p className="mt-5 max-w-xl text-base subtle-text md:text-lg">
            Escaneo rapido, claim automatico y estado listo al instante.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/login">
              Entrar
            </Link>
            <Link className="btn-secondary" href="/register">
              Crear cuenta
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="metric-card">
              <p className="metric-value">1s</p>
              <p className="metric-label">claim qr</p>
            </div>
            <div className="metric-card">
              <p className="metric-value">push</p>
              <p className="metric-label">+ in-app</p>
            </div>
            <div className="metric-card">
              <p className="metric-value">24/7</p>
              <p className="metric-label">estado live</p>
            </div>
          </div>
        </div>
      </article>

      <aside className="grid gap-4 reveal">
        <div className="card-panel p-5">
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-title text-xl">Live board</p>
              <span className="chip-mint">online</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2">
                <span className="font-semibold">#182</span>
                <span className="status-pill bg-amber-100 text-amber-700">CREATED</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2">
                <span className="font-semibold">#183</span>
                <span className="status-pill bg-sky-100 text-sky-700">CLAIMED</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2">
                <span className="font-semibold">#184</span>
                <span className="status-pill bg-[var(--mint-soft)] text-[var(--mint)]">READY</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-panel p-5">
          <div className="relative z-10">
            <p className="font-title text-xl">Todo en una vista</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip-brand">QR token</span>
              <span className="chip-sun">roles</span>
              <span className="chip-mint">push web</span>
              <span className="chip-brand">historial</span>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
