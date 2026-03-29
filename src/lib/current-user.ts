import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUserFromSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUserFromSession();
  return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN;
}

export async function isCurrentUserSuperAdmin() {
  const user = await getCurrentUserFromSession();
  return user?.role === UserRole.SUPERADMIN;
}
