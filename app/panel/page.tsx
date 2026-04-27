import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Facebook, Instagram, MessageCircle, Phone } from "lucide-react";

import { AttachmentsGuard } from "@/components/panel/attachments-guard";
import { PanelToastTrigger } from "@/components/panel/panel-toast-trigger";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
      coverKey: true,
      logoKey: true,
      instagram: true,
      facebook: true,
      contactNumber: true,
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-10">
      <PanelToastTrigger initialError={params?.error} initialOk={params?.ok} />
      <AttachmentsGuard />

      <Card className="border-border/70 bg-linear-to-br from-card to-muted/60 shadow-sm">
        <CardHeader className="space-y-3 pb-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PANEL</p>
          <CardTitle className="text-2xl uppercase">EMPRENDIMIENTOS Y ADJUNTOS</CardTitle>
          <CardDescription className="text-sm leading-6">
            Gestiona la ficha de cada proyecto, renombra o elimina adjuntos y publica nuevos emprendimientos con un solo flujo.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary">Máx 8MB por archivo</Badge>
          <Badge variant="secondary">Total sugerido ~30MB</Badge>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <div className="flex w-full justify-end">
          <Link
            href="/panel/nuevo"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            Publicar nuevo
          </Link>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-1">
          <Card className="w-full min-w-0 border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="space-y-2 pb-2">
              <CardTitle className="text-xl uppercase">MIS EMPRENDIMIENTOS</CardTitle>
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
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:shadow-md"
                    >
                      <div className="relative h-24 w-full overflow-hidden border-b border-border/60 bg-muted/50 md:h-28">
                        {venture.coverKey ? (
                          <img
                            src={venture.coverKey}
                            alt={`Portada de ${venture.title}`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="h-full w-full bg-linear-to-r from-primary/15 via-primary/5 to-secondary/15" />
                        )}

                        <div className="absolute bottom-2 left-3">
                          {venture.logoKey ? (
                            <img
                              src={venture.logoKey}
                              alt={`Logo de ${venture.title}`}
                              className="h-12 w-12 rounded-lg border border-border/70 bg-background object-contain shadow-sm"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-background text-xs font-semibold text-muted-foreground shadow-sm">
                              {venture.title.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-2 p-5">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="secondary">{stageLabel[venture.stage]}</Badge>
                          <span className="text-muted-foreground">
                            {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(venture.createdAt))}
                          </span>
                          <span className="text-muted-foreground">{venture.attachments.length} adjuntos</span>
                        </div>

                        <p className="truncate text-base font-semibold text-foreground">{venture.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{venture.summary}</p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                          {venture.contactNumber ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1">
                              <Phone className="h-3.5 w-3.5" />
                              Contacto
                            </span>
                          ) : null}
                          {venture.instagram ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1">
                              <Instagram className="h-3.5 w-3.5" />
                              Instagram
                            </span>
                          ) : null}
                          {venture.facebook ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1">
                              <Facebook className="h-3.5 w-3.5" />
                              Facebook
                            </span>
                          ) : null}
                          {venture.contactNumber ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="px-5 pb-5 text-sm font-semibold text-primary">Ver detalles</div>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
