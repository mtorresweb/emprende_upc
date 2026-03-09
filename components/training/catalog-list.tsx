"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrainingCategory } from "@/lib/training";

type Props = {
  catalog: TrainingCategory[];
  initialSeen: string[];
};

export function TrainingCatalogList({ catalog, initialSeen }: Props) {
  const [seen, setSeen] = useState<Set<string>>(new Set(initialSeen));

  const totals = useMemo(() => {
    const total = catalog.reduce((sum, c) => sum + c.resources.length, 0);
    const viewed = seen.size;
    return { total, viewed };
  }, [catalog, seen]);

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
        <div className="grid gap-6 md:grid-cols-2">
          {catalog.map((cat) => (
            <Card key={cat.category} className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  {cat.category}
                  <Badge variant="outline">{cat.resources.length} recursos</Badge>
                </CardTitle>
                <CardDescription>Abre cualquier módulo en una pestaña nueva.</CardDescription>
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
                  <Link
                    key={res.path}
                    href={`/formacion/open?path=${encodeURIComponent(res.path)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markSeen(res.path)}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      {seen.has(res.path) && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span>{res.label}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">Abrir</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
