import { randomUUID } from "crypto";

import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(50),
  storeId: z.string().trim().min(1).optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPERADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedStoreId = url.searchParams.get("storeId");

  let whereFilter: { storeId?: string | { in: string[] } } | undefined;

  if (session.user.role === UserRole.SUPERADMIN) {
    whereFilter = requestedStoreId ? { storeId: requestedStoreId } : undefined;
  } else {
    const managedStores = await db.store.findMany({
      where: { managerUserId: session.user.id },
      select: { id: true },
    });
    const managedStoreIds = managedStores.map((store) => store.id);

    if (managedStoreIds.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    if (requestedStoreId && !managedStoreIds.includes(requestedStoreId)) {
      return NextResponse.json({ error: "No tenes acceso a ese local" }, { status: 403 });
    }

    whereFilter = requestedStoreId
      ? { storeId: requestedStoreId }
      : { storeId: { in: managedStoreIds } };
  }

  const orders = await db.order.findMany({
    where: whereFilter,
    include: {
      store: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPERADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const { orderNumber, storeId: storeIdFromBody } = parsed.data;

    let effectiveStoreId = storeIdFromBody;

    if (session.user.role === UserRole.ADMIN) {
      const managedStore = await db.store.findFirst({
        where: { managerUserId: session.user.id },
        select: { id: true },
      });

      if (!managedStore) {
        return NextResponse.json(
          { error: "Tu cuenta no tiene local asignado. Contacta al superadmin." },
          { status: 403 },
        );
      }

      if (effectiveStoreId && effectiveStoreId !== managedStore.id) {
        return NextResponse.json({ error: "No tenes acceso a ese local" }, { status: 403 });
      }

      effectiveStoreId = managedStore.id;
    }

    if (!effectiveStoreId) {
      return NextResponse.json({ error: "Falta storeId" }, { status: 400 });
    }

    const store = await db.store.findUnique({ where: { id: effectiveStoreId } });
    if (!store) {
      return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
    }

    if (session.user.role === UserRole.ADMIN && store.managerUserId !== session.user.id) {
      return NextResponse.json({ error: "No tenes acceso a ese local" }, { status: 403 });
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        storeId: effectiveStoreId,
        qrToken: randomUUID(),
        events: {
          create: {
            type: "CREATED",
            message: "Pedido creado por admin",
          },
        },
      },
      include: {
        store: true,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const claimUrl = `${appUrl}/claim/${order.qrToken}`;

    return NextResponse.json({ order, claimUrl }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el pedido";

    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe ese numero de pedido para el local" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "No se pudo crear el pedido" }, { status: 500 });
  }
}
