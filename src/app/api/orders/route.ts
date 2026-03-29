import { randomUUID } from "crypto";

import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(50),
  storeId: z.string().trim().min(1),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const storeId = url.searchParams.get("storeId");

  const orders = await db.order.findMany({
    where: storeId ? { storeId } : undefined,
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
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const { orderNumber, storeId } = parsed.data;

    const store = await db.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        storeId,
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
