import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
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
  managerName: z.string().trim().min(2).max(80),
  managerEmail: z.email().transform((value) => value.toLowerCase()),
  managerPassword: z.string().min(8).max(72),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const stores = await db.store.findMany({
    where: session.user.role === UserRole.SUPERADMIN ? undefined : { managerUserId: session.user.id },
    include: {
      managerUser: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ stores });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const passwordHash = await hash(parsed.data.managerPassword, 12);

    const result = await db.$transaction(async (tx) => {
      const manager = await tx.user.findUnique({
        where: { email: parsed.data.managerEmail },
      });

      if (manager?.role === UserRole.SUPERADMIN) {
        throw new Error("SUPERADMIN_CANNOT_BE_STORE_MANAGER");
      }

      if (manager) {
        const alreadyAssigned = await tx.store.findFirst({
          where: { managerUserId: manager.id },
          select: { id: true, name: true },
        });

        if (alreadyAssigned) {
          throw new Error("MANAGER_ALREADY_ASSIGNED");
        }
      }

      const managerUser = manager
        ? await tx.user.update({
            where: { id: manager.id },
            data: {
              name: parsed.data.managerName,
              passwordHash,
              role: UserRole.ADMIN,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          })
        : await tx.user.create({
            data: {
              name: parsed.data.managerName,
              email: parsed.data.managerEmail,
              passwordHash,
              role: UserRole.ADMIN,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          });

      const store = await tx.store.create({
        data: {
          name: parsed.data.name,
          slug: slugBase,
          managerUserId: managerUser.id,
          createdById: session.user.id,
        },
        include: {
          managerUser: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      });

      return { store, managerUser };
    });

    return NextResponse.json({ ok: true, store: result.store, manager: result.managerUser }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el local";

    if (message === "MANAGER_ALREADY_ASSIGNED") {
      return NextResponse.json(
        { error: "Esa cuenta ya esta asociada a otro local" },
        { status: 409 },
      );
    }

    if (message === "SUPERADMIN_CANNOT_BE_STORE_MANAGER") {
      return NextResponse.json(
        { error: "Una cuenta SUPERADMIN no puede ser cuenta de local" },
        { status: 409 },
      );
    }

    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "El local o correo ya existen" }, { status: 409 });
    }

    return NextResponse.json({ error: "No se pudo crear el local" }, { status: 500 });
  }
}
