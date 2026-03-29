import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-6 py-10 md:grid-cols-[1.15fr_0.85fr] md:gap-8 md:py-16">
      <article className="rounded-[2.2rem] border border-black/5 bg-white/85 p-7 shadow-[0_30px_80px_-35px_rgba(35,28,26,0.35)] backdrop-blur md:p-10">
        <p className="mb-3 inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
          Restaurant Pager
        </p>
        <h1 className="font-title text-balance text-4xl leading-[1.05] tracking-tight md:text-6xl">
          QR por pedido y aviso instantaneo cuando esta listo.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-black/70 md:text-lg">
          El local crea el pedido, genera un QR unico y el cliente lo reclama en segundos.
          Cuando el pedido pasa a READY, el usuario recibe aviso en la web y push en su
          navegador.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/register">
            Crear cuenta
          </Link>
          <Link className="btn-secondary" href="/login">
            Ya tengo usuario
          </Link>
        </div>
      </article>

      <aside className="grid gap-4">
        <div className="feature-card">
          <h2 className="feature-title">Flujo simple</h2>
          <p className="feature-text">Admin crea pedido, cliente escanea QR, pedido queda vinculado.</p>
        </div>
        <div className="feature-card">
          <h2 className="feature-title">Notificacion fuerte</h2>
          <p className="feature-text">Push web + alerta persistente en base de datos + vista en pantalla.</p>
        </div>
        <div className="feature-card">
          <h2 className="feature-title">Multi login</h2>
          <p className="feature-text">Email/password y OAuth con Google, Facebook y GitHub opcional.</p>
        </div>
      </aside>
    </section>
  );
}
