"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrainingCategory } from "@/lib/training";

type Props = {
  catalog: TrainingCategory[];
  initialSeen: string[];
};

export function TrainingCatalogList({ catalog, initialSeen }: Props) {
  const router = useRouter();
  const validPaths = useMemo(
    () => new Set(catalog.flatMap((cat) => cat.resources.map((r) => r.path))),
    [catalog]
  );
  const embeddedPath = "modulo de formacion final/Recursos Colombia/Fuentes-y-eventos-Colombia.html";
  const totalResources = validPaths.size;

  // Seed seen with server progress, filtered to valid resources only.
  const [seen, setSeen] = useState<Set<string>>(() => {
    const filtered = initialSeen.filter((p) => validPaths.has(p));
    return new Set(filtered);
  });

  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(window.navigator.userAgent);

  const totals = useMemo(() => {
    const viewed = seen.size;
    return { total: totalResources, viewed };
  }, [seen, totalResources]);

  const markSeen = (path: string) => {
    setSeen((prev) => {
      if (prev.has(path)) return prev;
      const next = new Set(prev);
      next.add(path);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Card className="border-border/80 bg-card/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recursos vistos</p>
              <p className="text-lg font-semibold">
                {totals.viewed} / {totals.total || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

        {catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No se encontraron recursos.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {catalog.map((cat) => (
              <Card key={cat.category} className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg uppercase">
                  {cat.category}
                  <Badge variant="outline">{cat.resources.length} recursos</Badge>
                </CardTitle>
                {cat.description && <CardDescription>{cat.description}</CardDescription>}
                {(() => {
                  const completed = cat.resources.filter((r) => seen.has(r.path)).length;
                  const percent = Math.round((completed / (cat.resources.length || 1)) * 100);
                  return (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progreso</span>
                        <span className="font-medium text-foreground">{percent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="space-y-3">
                {cat.resources.map((res) => (
                  <button
                    key={res.path}
                    type="button"
                    onClick={async () => {
                      const postUrl = `/formacion/open?path=${encodeURIComponent(res.path)}`;
                      const isEmbedded = res.path === embeddedPath;
                      const navigateUrl = isEmbedded
                        ? `/formacion/recurso?path=${encodeURIComponent(res.path)}`
                        : postUrl;

                      const resp = await fetch(postUrl, { method: "POST" });
                      if (!resp.ok) {
                        toast.error("No se pudo registrar el avance", { description: res.label });
                        return;
                      }

                      markSeen(res.path);

                      if (isEmbedded) {
                        router.push(navigateUrl);
                        return;
                      }

                      if (isMobile) {
                        toast("Descargando módulo", {
                          description: res.label,
                          position: "top-center",
                        });
                        window.location.href = postUrl;
                      } else {
                        window.open(postUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      {seen.has(res.path) && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className={
                          /^\s*(unidad|actividades?)\b/i.test(res.label)
                            ? "font-semibold uppercase"
                            : "uppercase"
                        }
                      >
                        {res.label.replace(/\.[^/.]+$/, "")}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{isMobile ? "Descargar" : "Abrir"}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
