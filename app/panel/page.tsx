import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { del, put } from "@vercel/blob";
import { AttachmentsGuard } from "@/components/panel/attachments-guard";
import { PanelToastTrigger } from "@/components/panel/panel-toast-trigger";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

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

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB por archivo

async function createVenture(userId: string, formData: FormData) {
  "use server";

  const raw = {
    title: formData.get("title"),
    summary: formData.get("summary"),
    stage: formData.get("stage"),
    tags: formData.get("tags"),
  };

  const parsed = ventureSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/panel?error=Revisa%20los%20datos%20del%20formulario.");
  }

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
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");
    }
    try {
      for (const file of files) {
        if (!file || file.size === 0) continue;
        if (file.type && !allowed.includes(file.type)) {
              redirect("/panel?error=Tipo%20de%20archivo%20no%20permitido.");
        }

        if (file.size > MAX_FILE_SIZE) {
            redirect("/panel?error=Archivo%20supera%208MB.");
        }

        const ext = file.name.split(".").pop() || "bin";
        const blob = await put(
          `attachments/${venture.id}-${Date.now()}.${ext}`,
          file,
          {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
            contentType: file.type || undefined,
          }
        );

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
      redirect(
        "/panel?error=No%20se%20pudieron%20subir%20los%20archivos.%20Intenta%20con%20archivos%20m%C3%A1s%20livianos."
      );
    }
  }

  revalidatePath("/panel");
  redirect("/panel?ok=1");
}

async function updateVenture(userId: string, formData: FormData) {
  "use server";

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

  revalidatePath("/panel");
  redirect("/panel?ok=1");
}

async function deleteVenture(userId: string, formData: FormData) {
  "use server";

  const ventureId = formData.get("ventureId")?.toString();
  if (!ventureId) redirect("/panel?error=ID%20faltante");

  const attachments = await prisma.attachment.findMany({
    where: { ventureId, venture: { ownerId: userId } },
    select: { id: true, blobKey: true },
  });

  // delete blobs first
  for (const att of attachments) {
    if (att.blobKey) {
      await del(att.blobKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
  }

  await prisma.attachment.deleteMany({ where: { ventureId, venture: { ownerId: userId } } });
  await prisma.venture.delete({ where: { id: ventureId, ownerId: userId } });

  revalidatePath("/panel");
  redirect("/panel?ok=1");
}

async function addAttachment(userId: string, formData: FormData) {
  "use server";

  const parsed = attachmentSchema.safeParse({
    ventureId: formData.get("ventureId"),
  });
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

  // ensure ownership
  const venture = await prisma.venture.findUnique({
    where: { id: parsed.data.ventureId, ownerId: userId },
    select: { id: true },
  });
  if (!venture) redirect("/panel?error=No%20autorizado.");

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    redirect("/panel?error=Falta%20BLOB_READ_WRITE_TOKEN");
  }

  try {
    for (const file of files) {
      if (!file || file.size === 0) continue;
      if (file.type && !allowed.includes(file.type)) {
        redirect("/panel?error=Tipo%20de%20archivo%20no%20permitido.");
      }

      if (file.size > MAX_FILE_SIZE) {
        redirect("/panel?error=Archivo%20supera%208MB.");
      }

      const ext = file.name.split(".").pop() || "bin";
      const blob = await put(
        `attachments/${parsed.data.ventureId}-${Date.now()}.${ext}`,
        file,
        {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: file.type || undefined,
        }
      );

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
    redirect(
      "/panel?error=No%20se%20pudieron%20subir%20los%20archivos.%20Intenta%20con%20archivos%20m%C3%A1s%20livianos."
    );
  }

  revalidatePath("/panel");
  redirect("/panel?ok=1");
}

async function deleteAttachment(userId: string, formData: FormData) {
  "use server";

  const attachmentId = formData.get("attachmentId")?.toString();
  if (!attachmentId) redirect("/panel?error=ID%20faltante");

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, venture: { ownerId: userId } },
    select: { id: true, blobKey: true },
  });

  if (!attachment) redirect("/panel?error=No%20autorizado.");

  if (attachment.blobKey) {
    await del(attachment.blobKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidatePath("/panel");
  redirect("/panel?ok=1");
}

export default async function PanelPage({
  searchParams,
}: {
  searchParams?: { error?: string; ok?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const ventures = await prisma.venture.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      stage: true,
      tags: true,
      createdAt: true,
      attachments: {
        select: {
          id: true,
          name: true,
          url: true,
          mimeType: true,
          size: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const stageLabel: Record<string, string> = {
    IDEA: "Idea",
    PROTOTYPE: "Prototipo",
    MVP: "MVP",
    GROWTH: "Crecimiento",
  };

  const createVentureAction = createVenture.bind(null, session.user.id);
  const updateVentureAction = updateVenture.bind(null, session.user.id);
  const deleteVentureAction = deleteVenture.bind(null, session.user.id);
  const addAttachmentAction = addAttachment.bind(null, session.user.id);
  const deleteAttachmentAction = deleteAttachment.bind(null, session.user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <PanelToastTrigger initialError={searchParams?.error} initialOk={searchParams?.ok} />
      <AttachmentsGuard />
      <Card className="border-border/80 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Mis emprendimientos</CardTitle>
          <CardDescription>Publica y edita tus proyectos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ventures.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aún no tienes emprendimientos publicados. Crea el primero.
            </p>
          )}
          <div className="grid gap-3">
            {ventures.map((venture) => (
              <div
                key={venture.id}
                className="rounded-lg border border-border/70 bg-muted/30 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("es", {
                        dateStyle: "medium",
                      }).format(new Date(venture.createdAt))}
                    </p>
                    <h3 className="text-base font-semibold leading-tight text-foreground">
                      {venture.title}
                    </h3>
                  </div>
                  <Badge variant="secondary">{stageLabel[venture.stage]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {venture.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {venture.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="space-y-3 rounded-md border border-border/60 bg-background/80 p-3">
                    <form action={updateVentureAction} className="space-y-3">
                      <input type="hidden" name="ventureId" value={venture.id} />
                      <div className="space-y-1">
                        <Label htmlFor={`title-${venture.id}`}>Título</Label>
                        <Input
                          id={`title-${venture.id}`}
                          name="title"
                          defaultValue={venture.title}
                          required
                          minLength={3}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`summary-${venture.id}`}>Descripción</Label>
                        <Textarea
                          id={`summary-${venture.id}`}
                          name="summary"
                          defaultValue={venture.summary}
                          required
                          minLength={10}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`stage-${venture.id}`}>Etapa</Label>
                        <select
                          id={`stage-${venture.id}`}
                          name="stage"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          defaultValue={venture.stage}
                        >
                          <option value="IDEA">Idea</option>
                          <option value="PROTOTYPE">Prototipo</option>
                          <option value="MVP">MVP</option>
                          <option value="GROWTH">Crecimiento</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`tags-${venture.id}`}>Etiquetas (coma separadas)</Label>
                        <Input
                          id={`tags-${venture.id}`}
                          name="tags"
                          defaultValue={venture.tags.join(", ")}
                        />
                      </div>
                      <Button type="submit" size="sm" className="w-full">
                        Guardar cambios
                      </Button>
                    </form>
                    <form action={deleteVentureAction}>
                      <input type="hidden" name="ventureId" value={venture.id} />
                      <Button type="submit" variant="destructive" size="sm" className="w-full">
                        Eliminar
                      </Button>
                    </form>
                  </div>

                  <div className="space-y-2 rounded-md border border-border/60 bg-background/70 p-3">
                    <p className="text-sm font-medium">Adjuntos</p>
                    {venture.attachments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sin archivos.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {venture.attachments.map((att) => (
                          <li key={att.id} className="flex items-center justify-between gap-3">
                            <a
                              href={att.url}
                              className="truncate text-primary underline-offset-2 hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {att.name}
                            </a>
                            <form action={deleteAttachmentAction}>
                              <input type="hidden" name="attachmentId" value={att.id} />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                ×
                              </Button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form action={addAttachmentAction} className="space-y-2" data-attachment-form="true">
                      <input type="hidden" name="ventureId" value={venture.id} />
                      <Input name="files" type="file" className="text-sm" multiple />
                      <Button type="submit" size="sm" className="w-full">
                        Subir archivos
                      </Button>
                      <p className="text-xs text-muted-foreground">Máx 8MB por archivo, total ~30MB.</p>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Publicar nuevo</CardTitle>
          <CardDescription>Completa la ficha básica. Puedes adjuntar un archivo inicial (opcional).</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createVentureAction} className="space-y-4" data-attachment-form="true">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input name="title" id="title" required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Descripción</Label>
              <Textarea name="summary" id="summary" required minLength={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa</Label>
              <select
                name="stage"
                id="stage"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="IDEA"
              >
                <option value="IDEA">Idea</option>
                <option value="PROTOTYPE">Prototipo</option>
                <option value="MVP">MVP</option>
                <option value="GROWTH">Crecimiento</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (coma separadas)</Label>
              <Input
                name="tags"
                id="tags"
                placeholder="fintech, impacto, salud"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="files">Adjuntos iniciales (opcional)</Label>
              <Input name="files" id="files" type="file" className="text-sm" multiple />
              <p className="text-xs text-muted-foreground">Máx 8MB por archivo, total ~30MB.</p>
            </div>
            <Button type="submit" className="w-full">
              Publicar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}