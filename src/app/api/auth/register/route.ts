import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Ese email ya existe" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: isAdminEmail(email) ? UserRole.ADMIN : UserRole.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la cuenta" }, { status: 500 });
  }
}
