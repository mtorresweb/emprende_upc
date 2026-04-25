import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTrainingPath } from "@/lib/training";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

function sanitizeResource(resource: string) {
  const clean = resource.replace(/^\/+/, "");
  return clean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("path");

  if (!resource) {
    return NextResponse.json({ error: "Falta path" }, { status: 400 });
  }

  const sanitized = sanitizeResource(resource);
  if (!sanitized.startsWith("modulo de formacion final/")) {
    return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
  }

  if (!isValidTrainingPath(sanitized)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Encode every path segment to avoid issues with spaces/diacritics when opening on mobile browsers.
  const encodedPath = sanitized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const target = new URL(`/${encodedPath}`, req.url);
  return NextResponse.redirect(target);
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("path");

  if (!resource) {
    return NextResponse.json({ error: "Falta path" }, { status: 400 });
  }

  const sanitized = sanitizeResource(resource);
  if (!sanitized.startsWith("modulo de formacion final/")) {
    return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
  }

  if (!isValidTrainingPath(sanitized)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.trainingProgress.upsert({
    where: {
      userId_resourcePath: {
        userId: session.user.id,
        resourcePath: sanitized,
      },
    },
    update: {
      openedAt: new Date(),
      progress: 1,
    },
    create: {
      userId: session.user.id,
      resourcePath: sanitized,
      progress: 1,
    },
  });

  return NextResponse.json({ ok: true });
}
