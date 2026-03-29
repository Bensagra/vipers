import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { RegisterForm } from "@/components/RegisterForm";
import { authOptions } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    if (session.user.role === "SUPERADMIN") {
      redirect("/superadmin");
    }

    if (session.user.role === "ADMIN") {
      redirect("/admin");
    }

    redirect("/my-orders");
  }

  return <RegisterForm />;
}
