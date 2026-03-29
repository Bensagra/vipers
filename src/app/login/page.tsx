import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { LoginForm } from "@/components/LoginForm";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/my-orders");
  }

  const providers = [
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? { id: "google", label: "Google" }
      : null,
    process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? { id: "facebook", label: "Facebook" }
      : null,
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? { id: "github", label: "GitHub" }
      : null,
  ].filter((value): value is { id: string; label: string } => value !== null);

  return <LoginForm providers={providers} />;
}
