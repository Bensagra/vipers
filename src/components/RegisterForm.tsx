"use client";

import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error || "No se pudo crear la cuenta");
      setLoading(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/post-login",
    });

    setLoading(false);

    if (loginResult?.error) {
      router.push("/login");
      return;
    }

    router.push(loginResult?.url || "/post-login");
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-md card-panel reveal p-6 md:p-8">
      <div className="relative z-10">
        <span className="chip-sun">Registro</span>
        <h1 className="mt-3 font-title text-3xl tracking-tight">Crear cuenta</h1>
      </div>

      <form className="relative z-10 mt-6 space-y-3" onSubmit={handleSubmit}>
        <input
          className="input-field"
          placeholder="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="email"
          className="input-field"
          placeholder="Correo"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          className="input-field"
          placeholder="Contrasena (minimo 8 caracteres)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <input
          type="password"
          className="input-field"
          placeholder="Repetir contrasena"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </section>
  );
}
