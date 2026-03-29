import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const claimSchema = z.object({
  token: z.uuid(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Token invalido" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { qrToken: parsed.data.token },
      include: {
        store: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (order.userId && order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Este pedido ya esta asociado a otro usuario" },
        { status: 409 },
      );
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        userId: session.user.id,
        status: order.status === "CREATED" ? "CLAIMED" : order.status,
        claimedAt: order.claimedAt ?? new Date(),
        events: {
          create: {
            type: "CLAIMED",
            message: `Pedido asociado a ${session.user.email ?? "usuario"}`,
          },
        },
      },
      include: {
        store: true,
      },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch {
    return NextResponse.json({ error: "No se pudo reclamar el pedido" }, { status: 500 });
  }
}
