import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AdminPanel } from "@/components/AdminPanel";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/my-orders");
  }

  return <AdminPanel />;
}
