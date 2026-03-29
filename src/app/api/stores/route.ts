import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const createStoreSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(50).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stores = await db.store.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ stores });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createStoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    const slugBase = parsed.data.slug ? toSlug(parsed.data.slug) : toSlug(parsed.data.name);
    if (!slugBase) {
      return NextResponse.json({ error: "Slug invalido" }, { status: 400 });
    }

    const existing = await db.store.findUnique({ where: { slug: slugBase } });
    if (existing) {
      return NextResponse.json({ error: "Ese slug ya existe" }, { status: 409 });
    }

    const store = await db.store.create({
      data: {
        name: parsed.data.name,
        slug: slugBase,
      },
    });

    return NextResponse.json({ ok: true, store }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear el local" }, { status: 500 });
  }
}
