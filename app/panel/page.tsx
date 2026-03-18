import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

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
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createVenture } from "./actions";

export default async function PanelPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; ok?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

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
        select: { id: true, name: true, url: true, mimeType: true, size: true },
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-10">
      <PanelToastTrigger initialError={params?.error} initialOk={params?.ok} />
      <AttachmentsGuard />

      <Card className="border-border/70 bg-linear-to-br from-card to-muted/60 shadow-sm">
        <CardHeader className="space-y-3 pb-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Panel</p>
          <CardTitle className="text-2xl">Emprendimientos y adjuntos</CardTitle>
          <CardDescription className="text-sm leading-6">
            Gestiona la ficha de cada proyecto, renombra o elimina adjuntos y publica nuevos emprendimientos con un solo flujo.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary">Máx 8MB por archivo</Badge>
          <Badge variant="secondary">Total sugerido ~30MB</Badge>
        </CardContent>
      </Card>

      <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="order-2 w-full min-w-0 border-border/70 bg-card/90 shadow-sm lg:order-1">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-xl">Mis emprendimientos</CardTitle>
            <CardDescription>Publica y edita tus proyectos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {ventures.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no tienes emprendimientos publicados. Crea el primero.</p>
            )}

            <div className="pl-1 pr-4 pb-2" style={{ height: "651px", overflowY: "auto" }}>
              <div className="grid grid-cols-1 gap-4 pr-2 pb-1">
                {ventures.map((venture) => (
                  <Link
                    key={venture.id}
                    href={`/panel/${venture.id}`}
                    className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-background/70 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:shadow-md"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary">{stageLabel[venture.stage]}</Badge>
                        <span className="text-muted-foreground">
                          {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(venture.createdAt))}
                        </span>
                        <span className="text-muted-foreground">{venture.attachments.length} adjuntos</span>
                      </div>
                      <p className="truncate text-base font-semibold text-foreground">{venture.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{venture.summary}</p>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-primary">Ver detalles</div>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="order-1 w-full min-w-0 border-border/70 bg-card/90 shadow-sm md:sticky md:top-6 lg:order-2"
          id="nuevo"
        >
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-xl">Publicar nuevo</CardTitle>
            <CardDescription>Completa la ficha básica. Puedes adjuntar un archivo inicial (opcional).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={createVentureAction} className="space-y-5" data-attachment-form="true">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input name="title" id="title" required minLength={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Descripción</Label>
                <Textarea name="summary" id="summary" required minLength={10} className="min-h-40" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Etapa</Label>
                  <select
                    name="stage"
                    id="stage"
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                  <Input name="tags" id="tags" placeholder="fintech, impacto, salud" />
                </div>
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
    </div>
  );
}
