import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { isValidTrainingPath } from "@/lib/training";

export const dynamic = "force-dynamic";

function sanitizeResource(resource: string) {
  return resource.replace(/^\/+/g, "");
}

export default async function TrainingResourceViewer({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const params = await searchParams;
  const path = typeof params?.path === "string" ? params.path : undefined;
  if (!path) {
    redirect("/formacion");
  }

  // searchParams are decoded by Next.js, but if they arrive encoded we decode defensively.
  const decodedPath = (() => {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  })();

  const sanitized = sanitizeResource(decodedPath);
  if (!isValidTrainingPath(sanitized)) {
    redirect("/formacion");
  }

  const encodedPath = sanitized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const resourceUrl = `/${encodedPath}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/formacion"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a formación
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold uppercase">Recursos y oportunidades (Colombia)</h1>
        <p className="text-sm text-muted-foreground">
          El recurso se muestra en esta página para que puedas regresar fácilmente al catálogo.
        </p>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <iframe
          title="Recurso de formación"
          src={resourceUrl}
          className="h-[90vh] w-full"
          allowFullScreen
        />
      </div>
    </div>
  );
}
