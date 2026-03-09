import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AttachmentsGuard } from "@/components/panel/attachments-guard";
import { AttachmentPreviewButton } from "@/components/panel/attachment-preview-button";
import { DeleteAttachmentButton } from "@/components/panel/delete-attachment-button";
import { PanelToastTrigger } from "@/components/panel/panel-toast-trigger";
import { CoverPreviewDialog } from "@/components/panel/cover-preview-dialog";
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
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addAttachment,
  deleteAttachment,
  deleteVenture,
  updateVentureCover,
  removeVentureCover,
  renameAttachment,
  updateVenture,
} from "../actions";
import { CoverPicker } from "@/components/panel/cover-picker";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function VentureDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ error?: string; ok?: string } | { error?: string; ok?: string }>;
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const venture = await prisma.venture.findFirst({
    where: { id: resolvedParams.id, ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      summary: true,
      stage: true,
      tags: true,
      coverKey: true,
      createdAt: true,
      attachments: {
        select: { id: true, name: true, url: true, mimeType: true, size: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!venture) redirect("/panel?error=No%20autorizado.");

  const stageLabel: Record<string, string> = {
    IDEA: "Idea",
    PROTOTYPE: "Prototipo",
    MVP: "MVP",
    GROWTH: "Crecimiento",
  };

  const updateVentureAction = updateVenture.bind(null, session.user.id);
  const deleteVentureAction = deleteVenture.bind(null, session.user.id);
  const addAttachmentAction = addAttachment.bind(null, session.user.id);
  const updateCoverAction = updateVentureCover.bind(null, session.user.id);
  const removeCoverAction = removeVentureCover.bind(null, session.user.id);
  const deleteAttachmentAction = deleteAttachment.bind(null, session.user.id);
  const renameAttachmentAction = renameAttachment.bind(null, session.user.id);

  const redirectTo = `/panel/${venture.id}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <PanelToastTrigger initialError={resolvedSearchParams?.error} initialOk={resolvedSearchParams?.ok} />
      <AttachmentsGuard />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Emprendimiento</p>
          <h1 className="text-2xl font-semibold text-foreground">{venture.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{stageLabel[venture.stage]}</Badge>
            <span>
              {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(venture.createdAt))}
            </span>
            <span>{venture.attachments.length} adjuntos</span>
            {venture.tags.length > 0 && (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide">Tags:</span>
                {venture.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground">
                    {tag}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/panel"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← Volver
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-xl">Ficha</CardTitle>
            <CardDescription>Actualiza la información principal del proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form id="update-venture" action={updateVentureAction} className="space-y-4">
              <input type="hidden" name="ventureId" value={venture.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" defaultValue={venture.title} required minLength={3} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="summary">Descripción</Label>
                  <Textarea
                    id="summary"
                    name="summary"
                    defaultValue={venture.summary}
                    required
                    minLength={10}
                    className="min-h-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Etapa</Label>
                  <select
                    id="stage"
                    name="stage"
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue={venture.stage}
                  >
                    <option value="IDEA">Idea</option>
                    <option value="PROTOTYPE">Prototipo</option>
                    <option value="MVP">MVP</option>
                    <option value="GROWTH">Crecimiento</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Etiquetas (coma separadas)</Label>
                  <Input id="tags" name="tags" defaultValue={venture.tags.join(", ")} />
                </div>
              </div>
            </form>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end sm:gap-4">
              <Button form="update-venture" type="submit" size="sm" className="sm:w-40">
                Guardar
              </Button>
              <form
                action={deleteVentureAction}
                data-confirm="¿Eliminar este emprendimiento?"
                className="flex"
              >
                <input type="hidden" name="ventureId" value={venture.id} />
                <Button type="submit" variant="destructive" size="sm" className="sm:w-36">
                  Eliminar
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-xl">Adjuntos</CardTitle>
            <CardDescription>Sube, renombra o elimina archivos del proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {venture.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin archivos por ahora.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {venture.attachments.map((att) => (
                  <li key={att.id} className="rounded-lg bg-background/80 p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={att.url}
                          className="truncate text-primary underline-offset-2 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {att.name}
                        </a>
                        <AttachmentPreviewButton url={att.url} name={att.name} mime={att.mimeType} />
                          <DeleteAttachmentButton
                            action={deleteAttachmentAction}
                            attachmentId={att.id}
                            redirectTo={redirectTo}
                            name={att.name}
                            data-preserve-form="update-venture"
                          />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {att.mimeType || "archivo"} · {att.size ? `${Math.round(att.size / 1024)} KB` : ""}
                      </p>
                      <form
                        action={renameAttachmentAction}
                        className="flex flex-col gap-3 md:flex-row md:items-center"
                        data-preserve-form="update-venture"
                      >
                        <input type="hidden" name="attachmentId" value={att.id} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <Input
                          name="name"
                          defaultValue={att.name}
                          className="h-10 md:flex-1"
                          aria-label="Renombrar adjunto"
                        />
                        <Button type="submit" size="sm" variant="secondary" className="md:w-auto">
                          Renombrar
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form
              action={addAttachmentAction}
              className="space-y-3"
              data-attachment-form="true"
              data-preserve-form="update-venture"
            >
              <input type="hidden" name="ventureId" value={venture.id} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Input name="files" type="file" className="text-sm" multiple />
              <Button type="submit" size="sm" className="w-full">
                Subir archivos
              </Button>
              <p className="text-xs text-muted-foreground">Máx 8MB por archivo. Total sugerido ~30MB.</p>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="text-xl">Portada</CardTitle>
          <CardDescription>Sube una imagen horizontal para la portada pública.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CoverPreviewDialog url={venture.coverKey ?? undefined} />
            {venture.coverKey && (
              <form action={removeCoverAction} className="sm:ml-2">
                <input type="hidden" name="ventureId" value={venture.id} />
                <input type="hidden" name="redirectTo" value={`/panel/${venture.id}`} />
                <Button type="submit" variant="ghost" size="sm">Quitar portada</Button>
              </form>
            )}
          </div>

          <form action={updateCoverAction} className="space-y-3">
            <CoverPicker defaultUrl={venture.coverKey ?? undefined} />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
              <input type="hidden" name="ventureId" value={venture.id} />
              <input type="hidden" name="redirectTo" value={`/panel/${venture.id}`} />
              <Button type="submit" className="sm:w-40">Actualizar portada</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
