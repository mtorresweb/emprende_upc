import { NextResponse } from "next/server";
import { hash } from "bcrypt";

import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "Sopas123#";

export async function POST() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      if (existing.role !== "ADMIN" || !existing.passwordHash) {
        await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: {
            role: "ADMIN",
            passwordHash: existing.passwordHash || (await hash(ADMIN_PASSWORD, 10)),
            name: existing.name || "Administrador",
          },
        });
      }
      return NextResponse.json({ created: false, email: ADMIN_EMAIL });
    }

    const passwordHash = await hash(ADMIN_PASSWORD, 10);

    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: "Administrador",
        role: "ADMIN",
      },
    });

    return NextResponse.json({ created: true, email: ADMIN_EMAIL });
  } catch (error) {
    console.error("admin bootstrap error", error);
    return NextResponse.json({ error: "admin_bootstrap_failed" }, { status: 500 });
  }
}
