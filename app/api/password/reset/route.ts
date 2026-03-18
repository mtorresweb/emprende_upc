import { NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "bcrypt";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || typeof token !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await prisma.verificationToken.findFirst({
      where: { token: tokenHash, expires: { gt: new Date() } },
    });

    if (!record || !record.identifier.startsWith("reset:")) {
      return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 400 });
    }

    const email = record.identifier.replace("reset:", "");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("password reset error", err);
    return NextResponse.json({ error: "No se pudo restablecer la contraseña" }, { status: 500 });
  }
}
