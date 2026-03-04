import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

function sanitizeResource(resource: string) {
  const clean = resource.replace(/^\/+/, "");
  return clean;
}

async function fileExists(relativePath: string) {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("path");

  if (!resource) {
    return NextResponse.json({ error: "Falta path" }, { status: 400 });
  }

  const sanitized = sanitizeResource(resource);
  if (!sanitized.startsWith("modulos de formacion/")) {
    return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
  }

  const exists = await fileExists(sanitized);
  if (!exists) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", `/formacion/open?path=${encodeURIComponent(sanitized)}`);
    return NextResponse.redirect(loginUrl);
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

  const target = new URL(`/${encodeURI(sanitized)}`, req.url);
  return NextResponse.redirect(target);
}
