import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function PostLoginPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "SUPERADMIN") {
    redirect("/superadmin");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/my-orders");
}
