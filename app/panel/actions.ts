"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del, put } from "@vercel/blob";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const ventureSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(10),
  stage: z.enum(["IDEA", "PROTOTYPE", "MVP", "GROWTH"]),
  tags: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  contactNumber: z.string().optional(),
});

const updateVentureSchema = ventureSchema.extend({ id: z.string().min(1) });

const attachmentSchema = z.object({
  ventureId: z.string().min(1),
});

const renameAttachmentSchema = z.object({
  attachmentId: z.string().min(1),
  name: z.string().min(1).max(255),
});

const coverSchema = z.object({
  ventureId: z.string().min(1),
});

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB por archivo
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function parseTags(input?: string) {
  if (!input) return [];
  const raw = input.trim();
  if (!raw) return [];

  // Preferred format: hashtags, e.g. "#fintech #salud #impacto".
  const hashMatches = Array.from(raw.matchAll(/#([^\s#,;]+)/g)).map((m) => m[1]?.trim()).filter(Boolean) as string[];
  if (hashMatches.length > 0) return hashMatches;

  // Backward compatibility for old comma-separated inputs.
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function nullableText(input?: string) {
  const value = input?.trim();
  return value ? value : null;
}

function getRedirectTo(formData: FormData, fallback: string): string {
  const redirectTo = formData.get("redirectTo")?.toString();
  return redirectTo && redirectTo.startsWith("/") ? redirectTo : fallback;
}

export async function createVenture(userId: string, formData: FormData) {
  const raw = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    stage: formData.get("stage"),
    tags: formData.get("tags"),
    instagram: formData.get("instagram"),
    facebook: formData.get("facebook"),
    contactNumber: formData.get("contactNumber"),
  };

  const parsed = ventureSchema.safeParse(raw);
  if (!parsed.success) redirect("/panel?error=Revisa%20los%20datos%20del%20formulario.");

  const tags = parseTags(parsed.data.tags?.toString());
  const instagram = nullableText(parsed.data.instagram);
  const facebook = nullableText(parsed.data.facebook);
  const contactNumber = nullableText(parsed.data.contactNumber);

  // Procesar portada si se envía
  let coverKey: string | undefined = undefined;
  let logoKey: string | undefined = undefined;
  const coverFile = formData.get("cover") as File | null;
  const logoFile = formData.get("logo") as File | null;
  if (coverFile && coverFile.size > 0) {
    if (!IMAGE_TYPES.includes(coverFile.type)) redirect("/panel?error=Formato%20de%20imagen%20no%20permitido.");
    if (coverFile.size > MAX_FILE_SIZE) redirect("/panel?error=Imagen%20supera%208MB.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");
    try {
      const ext = coverFile.name.split(".").pop() || "jpg";
      const blob = await put(`covers/new-${userId}-${Date.now()}.${ext}`, coverFile, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: coverFile.type || undefined,
      });
      coverKey = blob.url;
    } catch (err) {
      console.error("cover upload error", err);
      redirect("/panel?error=No%20se%20pudo%20subir%20la%20portada.");
    }
  }

  if (logoFile && logoFile.size > 0) {
    if (!IMAGE_TYPES.includes(logoFile.type)) redirect("/panel?error=Formato%20de%20logo%20no%20permitido.");
    if (logoFile.size > MAX_FILE_SIZE) redirect("/panel?error=Logo%20supera%208MB.");
    if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");
    try {
      const ext = logoFile.name.split(".").pop() || "png";
      const blob = await put(`logos/new-${userId}-${Date.now()}.${ext}`, logoFile, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: logoFile.type || undefined,
      });
      logoKey = blob.url;
    } catch (err) {
      console.error("logo upload error", err);
      redirect("/panel?error=No%20se%20pudo%20subir%20el%20logo.");
    }
  }

  const venture = await prisma.venture.create({
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      stage: parsed.data.stage,
      tags,
      instagram,
      facebook,
      contactNumber,
      logoKey: logoKey ?? undefined,
      ownerId: userId,
      coverKey: coverKey ?? undefined,
    },
  });

  const redirectTo = getRedirectTo(formData, `/panel/${venture.id}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?ok=1`);
}

export async function updateVenture(userId: string, formData: FormData) {
  const parsed = updateVentureSchema.safeParse({
    id: formData.get("ventureId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    stage: formData.get("stage"),
    tags: formData.get("tags"),
    instagram: formData.get("instagram"),
    facebook: formData.get("facebook"),
    contactNumber: formData.get("contactNumber"),
  });

  if (!parsed.success) redirect("/panel?error=Datos%20inv%C3%A1lidos.");

  const tags = parseTags(parsed.data.tags?.toString());
  const instagram = nullableText(parsed.data.instagram);
  const facebook = nullableText(parsed.data.facebook);
  const contactNumber = nullableText(parsed.data.contactNumber);

  await prisma.venture.update({
    where: { id: parsed.data.id, ownerId: userId },
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      stage: parsed.data.stage,
      tags,
      instagram,
      facebook,
      contactNumber,
    },
  });

  const redirectTo = getRedirectTo(formData, `/panel/${parsed.data.id}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?ok=1`);
}

export async function updateVentureCover(userId: string, formData: FormData) {
  const parsed = coverSchema.safeParse({ ventureId: formData.get("ventureId") });
  if (!parsed.success) redirect("/panel?error=ID%20faltante");

  const file = formData.get("cover") as File | null;
  if (!file || !file.size) redirect("/panel?error=Sube%20una%20imagen%20de%20portada.");
  if (file.type && !IMAGE_TYPES.includes(file.type)) redirect("/panel?error=Formato%20de%20imagen%20no%20permitido.");
  if (file.size > MAX_FILE_SIZE) redirect("/panel?error=Imagen%20supera%208MB.");

  const venture = await prisma.venture.findFirst({
    where: { id: parsed.data.ventureId, ownerId: userId },
    select: { id: true, coverKey: true },
  });
  if (!venture) redirect("/panel?error=No%20autorizado.");

  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");

  try {
    if (venture.coverKey) await del(venture.coverKey, { token: process.env.BLOB_READ_WRITE_TOKEN });

    const ext = file.name.split(".").pop() || "jpg";
    const blob = await put(`covers/${venture.id}-${Date.now()}.${ext}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || undefined,
    });

    await prisma.venture.update({
      where: { id: venture.id },
      data: { coverKey: blob.url },
    });
  } catch (err) {
    console.error("cover upload error", err);
    redirect("/panel?error=No%20se%20pudo%20subir%20la%20portada.");
  }

  const redirectTo = getRedirectTo(formData, `/panel/${parsed.data.ventureId}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  revalidatePath(`/emprendimientos/${parsed.data.ventureId}`);
  redirect(`${redirectTo}?ok=1`);
}

export async function removeVentureCover(userId: string, formData: FormData) {
  const parsed = coverSchema.safeParse({ ventureId: formData.get("ventureId") });
  if (!parsed.success) redirect("/panel?error=ID%20faltante");

  const venture = await prisma.venture.findFirst({
    where: { id: parsed.data.ventureId, ownerId: userId },
    select: { id: true, coverKey: true },
  });
  if (!venture) redirect("/panel?error=No%20autorizado.");

  if (venture.coverKey && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(venture.coverKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (err) {
      console.error("cover delete error", err);
    }
  }

  await prisma.venture.update({ where: { id: venture.id }, data: { coverKey: null } });

  const redirectTo = getRedirectTo(formData, `/panel/${parsed.data.ventureId}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  revalidatePath(`/emprendimientos/${parsed.data.ventureId}`);
  redirect(`${redirectTo}?ok=1`);
}

export async function deleteVenture(userId: string, formData: FormData) {
  const ventureId = formData.get("ventureId")?.toString();
  if (!ventureId) redirect("/panel?error=ID%20faltante");

  const attachments = await prisma.attachment.findMany({
    where: { ventureId, venture: { ownerId: userId } },
    select: { id: true, blobKey: true },
  });

  for (const att of attachments) {
    if (att.blobKey) await del(att.blobKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
  }

  await prisma.attachment.deleteMany({ where: { ventureId, venture: { ownerId: userId } } });
  await prisma.venture.delete({ where: { id: ventureId, ownerId: userId } });

  revalidatePath("/panel");
  redirect("/panel?ok=1");
}

export async function addAttachment(userId: string, formData: FormData) {
  const parsed = attachmentSchema.safeParse({ ventureId: formData.get("ventureId") });
  if (!parsed.success) redirect("/panel?error=ID%20faltante");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) redirect("/panel?error=Sube%20un%20archivo.");

  const allowed = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  const venture = await prisma.venture.findUnique({
    where: { id: parsed.data.ventureId, ownerId: userId },
    select: { id: true },
  });
  if (!venture) redirect("/panel?error=No%20autorizado.");

  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");

  try {
    if (file.type && !allowed.includes(file.type)) redirect("/panel?error=Tipo%20de%20archivo%20no%20permitido.");
    if (file.size > MAX_FILE_SIZE) redirect("/panel?error=Archivo%20supera%208MB.");

    const ext = file.name.split(".").pop() || "bin";
    const blob = await put(`attachments/${parsed.data.ventureId}-${Date.now()}.${ext}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: file.type || undefined,
    });

    await prisma.attachment.create({
      data: {
        ventureId: parsed.data.ventureId,
        name: file.name,
        url: blob.url,
        blobKey: blob.url,
        mimeType: file.type || null,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("upload error", err);
    redirect("/panel?error=No%20se%20pudo%20subir%20el%20archivo.%20Intenta%20de%20nuevo.");
  }

  const redirectTo = getRedirectTo(formData, `/panel/${parsed.data.ventureId}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?ok=1`);
}

export async function deleteAttachment(userId: string, formData: FormData) {
  const attachmentId = formData.get("attachmentId")?.toString();
  if (!attachmentId) redirect("/panel?error=ID%20faltante");

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, venture: { ownerId: userId } },
    select: { id: true, blobKey: true, ventureId: true },
  });

  if (!attachment) redirect("/panel?error=No%20autorizado.");

  if (attachment.blobKey) await del(attachment.blobKey, { token: process.env.BLOB_READ_WRITE_TOKEN });

  await prisma.attachment.delete({ where: { id: attachmentId } });
  const redirectTo = getRedirectTo(formData, `/panel/${attachment.ventureId}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?ok=1`);
}

export async function renameAttachment(userId: string, formData: FormData) {
  const parsed = renameAttachmentSchema.safeParse({
    attachmentId: formData.get("attachmentId"),
    name: formData.get("name"),
  });

  if (!parsed.success) redirect("/panel?error=Datos%20inv%C3%A1lidos");

  const attachment = await prisma.attachment.findFirst({
    where: { id: parsed.data.attachmentId, venture: { ownerId: userId } },
    select: { id: true, ventureId: true },
  });

  if (!attachment) redirect("/panel?error=No%20autorizado.");

  await prisma.attachment.update({
    where: { id: parsed.data.attachmentId },
    data: { name: parsed.data.name },
  });

  const redirectTo = getRedirectTo(formData, `/panel/${attachment.ventureId}`);
  revalidatePath("/panel");
  revalidatePath(redirectTo);
  redirect(`${redirectTo}?ok=1`);
}
