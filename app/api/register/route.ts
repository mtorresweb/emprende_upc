import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const dynamicParams = true;
export const preferredRegion = "auto";

const PROGRAM_OPTIONS = [
  "contaduria publica",
  "economia",
  "administracion de empresas",
  "ingenieria agroindustrial",
  "ingenieria ambiental y sanitaria",
  "ingenieria de sistemas",
  "tecnologia agropecuaria",
] as const;

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  documentNumber: z.string().min(6).max(30),
  program: z.enum(PROGRAM_OPTIONS),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, documentNumber, program } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este correo." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        profile: {
          create: {
            fullName: name,
            documentNumber,
            program,
          },
        },
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("register_error", error);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
