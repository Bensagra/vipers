import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          store: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
