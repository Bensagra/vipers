import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { RegisterForm } from "@/components/RegisterForm";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/my-orders");
  }

  return <RegisterForm />;
}
