
import Link from "next/link";
import { QuizEtapaDialog } from "@/components/panel/quiz-etapa-dialog";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CoverPicker } from "@/components/panel/cover-picker";
import { createVenture } from "../actions";
import { authOptions } from "@/lib/auth";

export default async function NuevoEmprendimientoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const createVentureAction = createVenture.bind(null, session.user.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12 pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nuevo emprendimiento</p>
          <h1 className="text-2xl font-semibold text-foreground">Publicar nuevo emprendimiento</h1>
        </div>
        <Link
          href="/panel"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← Volver
        </Link>
      </div>

      {/* Sugerencia y botón para quiz de etapa */}
      <div className="mb-6 flex flex-row items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground shadow-sm">
        <span className="font-medium text-primary flex-1 min-w-0 truncate sm:whitespace-normal">¿No sabes en qué etapa está tu proyecto?</span>
        <div className="flex-shrink-0"><QuizEtapaDialog /></div>
      </div>

      <form action={createVentureAction} className="space-y-8" data-attachment-form="true">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="space-y-2 pb-2">
              <CardTitle className="text-xl">Ficha</CardTitle>
              <CardDescription>Completa la información principal del proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" required minLength={3} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="summary">Descripción</Label>
                  <Textarea
                    id="summary"
                    name="summary"
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
                  <Input id="tags" name="tags" placeholder="fintech, impacto, salud" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="space-y-2 pb-2">
              <CardTitle className="text-xl">Adjuntos</CardTitle>
              <CardDescription>Sube archivos iniciales para el proyecto (opcional).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input name="files" type="file" className="text-sm" multiple />
              <p className="text-xs text-muted-foreground">Máx 8MB por archivo. Total sugerido ~30MB.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-xl">Portada</CardTitle>
            <CardDescription>Sube una imagen horizontal para la portada pública (opcional).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CoverPicker name="cover" />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end sm:gap-4">
          <Button type="submit" size="sm" className="sm:w-40">
            Publicar
          </Button>
        </div>
      </form>
    </div>
  );
}