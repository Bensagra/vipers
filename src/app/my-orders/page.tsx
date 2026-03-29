import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { MyOrdersClient } from "@/components/MyOrdersClient";
import { authOptions } from "@/lib/auth";

export default async function MyOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-orders");
  }

  return <MyOrdersClient />;
}
