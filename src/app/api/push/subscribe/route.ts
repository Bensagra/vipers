import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const subscribeSchema = z.object({
  fcmToken: z.string().trim().min(20),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "fcmToken invalido" }, { status: 400 });
    }

    await db.pushSubscription.upsert({
      where: { fcmToken: parsed.data.fcmToken },
      update: {
        userId: session.user.id,
        userAgent: req.headers.get("user-agent") || undefined,
      },
      create: {
        userId: session.user.id,
        fcmToken: parsed.data.fcmToken,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la suscripcion" }, { status: 500 });
  }
}
