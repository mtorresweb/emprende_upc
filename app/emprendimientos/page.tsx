import Link from "next/link";
import { getServerSession } from "next-auth";
import Fuse from "fuse.js";
import { Facebook, Instagram, MessageCircle, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

const MAX_RESULTS = 30;

const stageLabel: Record<string, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototipo",
  MVP: "MVP",
  GROWTH: "Crecimiento",
};

export default async function EmprendimientosPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; stage?: string; view?: string } | { q?: string; stage?: string; view?: string }>;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const q = params?.q?.trim();
  const stageParam = params?.stage;
  const view = params?.view === "list" ? "list" : "grid";
  type Stage = "IDEA" | "PROTOTYPE" | "MVP" | "GROWTH";
  const allowedStages: Stage[] = ["IDEA", "PROTOTYPE", "MVP", "GROWTH"];
  const stageFilter: Stage | undefined =
    stageParam && allowedStages.includes(stageParam as Stage) ? (stageParam as Stage) : undefined;
  const stageValue = stageFilter ?? "ALL";

  const session = await getServerSession(authOptions);

  const venturesBase = await prisma.venture.findMany({
    where: {
      published: true,
      ...(stageFilter ? { stage: stageFilter } : {}),
    },
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
    },
    take: q ? 200 : MAX_RESULTS,
  });

  const ventures = q
    ? new Fuse(venturesBase, {
        keys: ["title", "summary", "tags"],
        threshold: 0.38,
        distance: 120,
        ignoreLocation: true,
      })
        .search(q)
        .map((r) => r.item)
        .slice(0, MAX_RESULTS)
    : venturesBase;

  const renderCard = (v: typeof ventures[number]) => (
    <Card key={v.id} className="h-full overflow-hidden">
      <div className="relative h-24 w-full overflow-hidden border-b border-border/60 bg-muted/50 md:h-28">
        {v.coverKey ? (
          <img
            src={v.coverKey}
            alt={`Portada de ${v.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-primary/15 via-primary/5 to-secondary/15" />
        )}
        <div className="absolute bottom-2 left-3">
          {v.logoKey ? (
            <img
              src={v.logoKey}
              alt={`Logo de ${v.title}`}
              className="h-12 w-12 rounded-lg border border-border/70 bg-background object-contain shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border/70 bg-background text-xs font-semibold text-muted-foreground shadow-sm">
              {v.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <CardHeader className="space-y-2 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
              <Link href={`/emprendimientos/${v.id}`} className="hover:underline">
              {v.title}
            </Link>
          </CardTitle>
          <Badge variant="secondary">{stageLabel[v.stage] || v.stage}</Badge>
        </div>
        <CardDescription>{v.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {v.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            #{tag}
          </Badge>
        ))}
        {v.contactNumber && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
            <Phone className="h-3.5 w-3.5" /> Contacto
          </span>
        )}
        {v.instagram && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
            <Instagram className="h-3.5 w-3.5" /> Instagram
          </span>
        )}
        {v.facebook && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
            <Facebook className="h-3.5 w-3.5" /> Facebook
          </span>
        )}
        {v.contactNumber && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </span>
        )}
        <span className="ml-auto text-[11px]">
          {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(v.createdAt))}
        </span>
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Explorar</p>
          <h1 className="text-3xl font-semibold text-foreground uppercase">EMPRENDIMIENTOS</h1>
          <p className="text-sm text-muted-foreground">Emprendimientos publicados por toda la comunidad. Filtra por etapa, busca por texto y cambia la vista.</p>
        </div>
        {session?.user?.id ? (
          <Button asChild variant="secondary">
            <Link href="/panel/nuevo">Publicar nuevo</Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/login">Ingresar para publicar</Link>
          </Button>
        )}
      </div>

      <form
        className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm md:flex-row md:flex-nowrap md:items-end"
        method="get"
      >
        <div className="flex w-full flex-col gap-2 md:flex-1">
          <Label htmlFor="q" className="text-sm">Buscar</Label>
          <Input id="q" name="q" placeholder="Título, descripción o tag" defaultValue={q} className="h-11" />
        </div>
        <div className="flex min-w-45 flex-col gap-2 md:w-auto">
          <Label htmlFor="stage" className="text-sm">Etapa</Label>
          <Select name="stage" defaultValue={stageValue}>
            <SelectTrigger id="stage" className="h-11">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="IDEA">Idea</SelectItem>
              <SelectItem value="PROTOTYPE">Prototipo</SelectItem>
              <SelectItem value="MVP">MVP (Producto Minimo Viable)</SelectItem>
              <SelectItem value="GROWTH">Crecimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-35 flex-col justify-end gap-2 md:w-auto md:items-end">
          <input type="hidden" name="view" value={view} />
          <Button type="submit" className="h-11 w-full md:w-auto">Aplicar</Button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{ventures.length} resultados</span>
        <div className="flex items-center gap-2">
          <Link
            href={{ pathname: "/emprendimientos", query: { ...(q ? { q } : {}), ...(stageFilter ? { stage: stageFilter } : {}), view: "grid" } }}
            className={view === "grid" ? "font-semibold text-primary" : "hover:text-foreground"}
          >
            Vista grid
          </Link>
          <span>·</span>
          <Link
            href={{ pathname: "/emprendimientos", query: { ...(q ? { q } : {}), ...(stageFilter ? { stage: stageFilter } : {}), view: "list" } }}
            className={view === "list" ? "font-semibold text-primary" : "hover:text-foreground"}
          >
            Vista lista
          </Link>
        </div>
      </div>

      {ventures.length === 0 ? (
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">No hay resultados para estos filtros.</CardContent>
        </Card>
      ) : view === "list" ? (
        <div className="space-y-3">
          {ventures.map((v) => (
            <div key={v.id} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/50 md:h-28">
                    {v.coverKey ? (
                      <img src={v.coverKey} alt={`Portada de ${v.title}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-linear-to-r from-primary/15 via-primary/5 to-secondary/15" />
                    )}
                    <div className="absolute bottom-2 left-3">
                      {v.logoKey ? (
                        <img
                          src={v.logoKey}
                          alt={`Logo de ${v.title}`}
                          className="h-10 w-10 rounded-md border border-border/70 bg-background object-contain shadow-sm"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-background text-[10px] font-semibold text-muted-foreground shadow-sm">
                          {v.title.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{stageLabel[v.stage] || v.stage}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(v.createdAt))}
                    </p>
                  </div>
                  <Link href={`/emprendimientos/${v.id}`} className="text-base font-semibold hover:underline">
                    {v.title}
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2">{v.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {v.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                    {v.contactNumber && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
                        <Phone className="h-3.5 w-3.5" /> Contacto
                      </span>
                    )}
                    {v.instagram && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
                        <Instagram className="h-3.5 w-3.5" /> Instagram
                      </span>
                    )}
                    {v.facebook && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
                        <Facebook className="h-3.5 w-3.5" /> Facebook
                      </span>
                    )}
                    {v.contactNumber && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/emprendimientos/${v.id}`}
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Ver detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {ventures.map(renderCard)}
        </div>
      )}
    </main>
  );
}
