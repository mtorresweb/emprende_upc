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
  };

  const parsed = ventureSchema.safeParse(raw);
  if (!parsed.success) redirect("/panel?error=Revisa%20los%20datos%20del%20formulario.");

  const tags = parsed.data.tags
    ? parsed.data.tags
        .toString()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const venture = await prisma.venture.create({
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      stage: parsed.data.stage,
      tags,
      ownerId: userId,
    },
  });

  const files = formData.getAll("files") as File[];
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

  if (files.length > 0) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");
    try {
      for (const file of files) {
        if (!file || file.size === 0) continue;
        if (file.type && !allowed.includes(file.type)) redirect("/panel?error=Tipo%20de%20archivo%20no%20permitido.");
        if (file.size > MAX_FILE_SIZE) redirect("/panel?error=Archivo%20supera%208MB.");

        const ext = file.name.split(".").pop() || "bin";
        const blob = await put(`attachments/${venture.id}-${Date.now()}.${ext}`, file, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: file.type || undefined,
        });

        await prisma.attachment.create({
          data: {
            ventureId: venture.id,
            name: file.name,
            url: blob.url,
            blobKey: blob.url,
            mimeType: file.type || null,
            size: file.size,
          },
        });
      }
    } catch (err) {
      console.error("upload error", err);
      redirect("/panel?error=No%20se%20pudieron%20subir%20los%20archivos.%20Intenta%20con%20archivos%20m%C3%A1s%20livianos.");
    }
  }

  const redirectTo = getRedirectTo(formData, "/panel");
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
  });

  if (!parsed.success) redirect("/panel?error=Datos%20inv%C3%A1lidos.");

  const tags = parsed.data.tags
    ? parsed.data.tags
        .toString()
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  await prisma.venture.update({
    where: { id: parsed.data.id, ownerId: userId },
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      stage: parsed.data.stage,
      tags,
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

  const files = formData.getAll("files") as File[];
  if (!files.length) redirect("/panel?error=Sube%20al%20menos%20un%20archivo.");

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
    for (const file of files) {
      if (!file || file.size === 0) continue;
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
    }
  } catch (err) {
    console.error("upload error", err);
    redirect("/panel?error=No%20se%20pudieron%20subir%20los%20archivos.%20Intenta%20con%20archivos%20m%C3%A1s%20livianos.");
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
