import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

const stageLabel: Record<string, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototipo",
  MVP: "MVP",
  GROWTH: "Crecimiento",
};

export default async function VenturePublicPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;

  const venture = await prisma.venture.findFirst({
    where: { id: resolvedParams.id, published: true },
    select: {
      id: true,
      title: true,
      summary: true,
      stage: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      coverKey: true,
      owner: {
        select: {
          name: true,
          profile: { select: { fullName: true, avatarKey: true } },
        },
      },
      attachments: {
        select: { id: true, name: true, url: true, size: true, mimeType: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      updates: {
        select: { id: true, content: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!venture) notFound();

  const ownerName = venture.owner?.profile?.fullName || venture.owner?.name || "Emprendedor";
  const avatarUrl = venture.owner?.profile?.avatarKey || null;
  const coverUrl = venture.coverKey || null;
  const initials = venture.title.slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-16">
      <div className="overflow-hidden rounded-2xl">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Portada de ${venture.title}`}
            className="h-44 w-full border border-border/70 bg-card/70 object-cover shadow-sm"
          />
        ) : (
          <div className="h-44 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 -mt-8 md:-mt-10">
            <Avatar>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={ownerName} /> : <AvatarFallback>{initials}</AvatarFallback>}
            </Avatar>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Emprendimiento</p>
              <h1 className="text-3xl font-semibold text-foreground leading-tight">{venture.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{stageLabel[venture.stage] || venture.stage}</Badge>
            <span>
              Publicado: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(venture.createdAt))}
            </span>
            <span>Responsable: {ownerName}</span>
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
        <Button asChild variant="outline" size="sm">
          <Link href="/emprendimientos">← Volver</Link>
        </Button>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="text-xl">Descripción</CardTitle>
          <CardDescription>
            Última actualización: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(venture.updatedAt))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{venture.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-lg">Actualizaciones</CardTitle>
            <CardDescription>Últimos avances compartidos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {venture.updates.length === 0 ? (
              <p className="text-muted-foreground">Aún no hay actualizaciones.</p>
            ) : (
              venture.updates.map((update) => (
                <div key={update.id} className="rounded-lg border border-border/60 bg-background/80 p-3 shadow-sm">
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(update.createdAt))}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed">{update.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-lg">Adjuntos</CardTitle>
            <CardDescription>Archivos compartidos por el equipo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {venture.attachments.length === 0 ? (
              <p className="text-muted-foreground">Sin archivos por ahora.</p>
            ) : (
              <ul className="space-y-3">
                {venture.attachments.map((att) => (
                  <li key={att.id} className="rounded-lg border border-border/60 bg-background/80 p-3 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">{att.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(att.createdAt))}
                        </p>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Ver archivo
                      </a>
                    </div>
                    {att.size ? (
                      <p className="text-xs text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
