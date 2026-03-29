import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasFirebaseAdminConfigured, sendPushMessage } from "@/lib/firebase-admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.id ||
    (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPERADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.order.findUnique({
    where: { id },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          managerUserId: true,
        },
      },
      user: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (session.user.role === UserRole.ADMIN && existing.store.managerUserId !== session.user.id) {
    return NextResponse.json({ error: "No tenes acceso a ese local" }, { status: 403 });
  }

  const order = await db.order.update({
    where: { id: existing.id },
    data: {
      status: "READY",
      readyAt: existing.readyAt ?? new Date(),
      events: {
        create: {
          type: "READY",
          message: "Pedido listo para retirar",
        },
      },
    },
    include: {
      store: true,
      user: true,
    },
  });

  if (order.userId) {
    await db.notification.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        channel: "IN_APP",
        deliveryStatus: "SENT",
        title: `${order.store.name}`,
        body: `Tu pedido ${order.orderNumber} ya esta listo`,
      },
    });

    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: order.userId },
      select: { id: true, fcmToken: true },
    });

    if (!hasFirebaseAdminConfigured()) {
      await db.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          channel: "PUSH",
          deliveryStatus: "FAILED",
          title: `Push no configurado`,
          body: "Falta configurar credenciales Firebase en el servidor",
          error: "FIREBASE_ADMIN_MISSING",
        },
      });
    } else if (subscriptions.length === 0) {
      await db.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          channel: "PUSH",
          deliveryStatus: "FAILED",
          title: "Push no entregado",
          body: "El usuario aun no activo notificaciones en un dispositivo",
          error: "NO_SUBSCRIPTIONS",
        },
      });
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const results = await Promise.all(
        subscriptions.map(async (subscription) => {
          const result = await sendPushMessage({
            token: subscription.fcmToken,
            notification: {
              title: `${order.store.name}`,
              body: `Tu pedido ${order.orderNumber} ya esta listo`,
            },
            webpush: {
              fcmOptions: {
                link: `${appUrl}/my-orders`,
              },
            },
            data: {
              orderId: order.id,
              status: order.status,
            },
          });

          if (!result.ok && /registration-token-not-registered|invalid-registration-token/i.test(result.error)) {
            await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
          }

          return result;
        }),
      );

      const successCount = results.filter((item) => item.ok).length;
      const failed = results.filter((item) => !item.ok);

      await db.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          channel: "PUSH",
          deliveryStatus: successCount > 0 ? "SENT" : "FAILED",
          title: successCount > 0 ? "Push enviado" : "Push no entregado",
          body:
            successCount > 0
              ? `Push entregado en ${successCount} dispositivo(s)`
              : "No se pudo entregar el push en ningun dispositivo",
          error: failed.length ? failed.map((item) => item.error).join(" | ").slice(0, 1000) : null,
        },
      });
    }
  }

  return NextResponse.json({ ok: true, order });
}
