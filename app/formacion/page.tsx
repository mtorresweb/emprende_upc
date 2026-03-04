import { getServerSession } from "next-auth";

import { Badge } from "@/components/ui/badge";
import { TrainingCatalogList } from "@/components/training/catalog-list";
import { getTrainingCatalog } from "@/lib/training";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);
  const catalog = await getTrainingCatalog();
  const progressPaths = session?.user?.id
    ? (
        await prisma.trainingProgress.findMany({
          where: { userId: session.user.id },
          select: { resourcePath: true },
        })
      ).map((p) => p.resourcePath)
    : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:px-8">
      <header className="space-y-3">
        <Badge variant="secondary" className="w-fit">
          Formación
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold leading-tight">Módulos de formación</h1>
          <p className="text-muted-foreground">
            Consulta y descarga los recursos en PDF/PPTX. Los enlaces se abrirán en una pestaña nueva para que los
            revises con calma.
          </p>
        </div>
      </header>

      {!session && (
        <p className="text-sm text-muted-foreground">
          Inicia sesión para registrar tu progreso al abrir cada módulo.
        </p>
      )}

      <TrainingCatalogList catalog={catalog} initialSeen={progressPaths} />
    </div>
  );
}
