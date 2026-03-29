"use client";

import { FormEvent, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

type OAuthProvider = {
  id: string;
  label: string;
};

type LoginFormProps = {
  providers: OAuthProvider[];
};

export function LoginForm({ providers }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") || "/post-login",
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Credenciales invalidas");
      return;
    }

    router.push(result.url || callbackUrl);
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-md card-panel p-6 md:p-8">
      <h1 className="font-title text-3xl tracking-tight">Entrar</h1>
      <p className="mt-2 text-sm text-black/65">Accede para reclamar y seguir tus pedidos.</p>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <input
          type="email"
          className="input-field"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          className="input-field"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {providers.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-black/45">o continuar con</p>

          <div className="grid gap-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                className="btn-secondary w-full"
                onClick={() => signIn(provider.id, { callbackUrl })}
              >
                {provider.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
