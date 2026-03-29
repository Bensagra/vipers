import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SuperAdminPanel } from "@/components/SuperAdminPanel";
import { authOptions } from "@/lib/auth";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/superadmin");
  }

  if (session.user.role !== "SUPERADMIN") {
    redirect("/my-orders");
  }

  return <SuperAdminPanel />;
}
