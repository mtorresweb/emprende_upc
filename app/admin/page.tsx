import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleFilters, UserFilters, VentureFilters } from "./filters";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/panel");
  }
  return session;
}

const stageLabel: Record<string, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototipo",
  MVP: "MVP",
  GROWTH: "Crecimiento",
};

async function toggleVenturePublished(formData: FormData) {
  "use server";
  await ensureAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const venture = await prisma.venture.findUnique({ where: { id }, select: { published: true } });
  if (!venture) return;
  await prisma.venture.update({ where: { id }, data: { published: !venture.published } });
  revalidatePath("/admin");
}

async function toggleVentureFeatured(formData: FormData) {
  "use server";
  await ensureAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const venture = await prisma.venture.findUnique({ where: { id }, select: { featured: true } });
  if (!venture) return;
  await prisma.venture.update({ where: { id }, data: { featured: !venture.featured } });
  revalidatePath("/admin");
}

async function setUserRole(formData: FormData) {
  "use server";
  await ensureAdmin();
  const id = formData.get("id") as string;
  const role = formData.get("role") as "ADMIN" | "STUDENT" | null;
  if (!id || !role) return;
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ venture?: string; stage?: string; user?: string; module?: string; moduleCategory?: string }>
    | { venture?: string; stage?: string; user?: string; module?: string; moduleCategory?: string };
}) {
  await ensureAdmin();

  const params = searchParams instanceof Promise ? await searchParams : searchParams;

  const ventureQuery = params?.venture?.trim() || "";
  const stageParam = params?.stage?.trim();
  const allowedStages = ["IDEA", "PROTOTYPE", "MVP", "GROWTH"] as const;
  const stageFilter = stageParam && allowedStages.includes(stageParam as any) ? stageParam : "";
  const userQuery = params?.user?.trim() || "";
  const moduleQuery = params?.module?.trim() || "";
  const moduleCategory = params?.moduleCategory?.trim() || "";

  const [ventures, users, modules, moduleCategories, counts] = await Promise.all([
    prisma.venture.findMany({
      where: {
        ...(stageFilter ? { stage: stageFilter as any } : {}),
        ...(ventureQuery
          ? {
              OR: [
                { title: { contains: ventureQuery, mode: "insensitive" } },
                { summary: { contains: ventureQuery, mode: "insensitive" } },
                { owner: { email: { contains: ventureQuery, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        summary: true,
        stage: true,
        published: true,
        featured: true,
        createdAt: true,
        owner: { select: { email: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: userQuery
          ? [
              { email: { contains: userQuery, mode: "insensitive" } },
              { name: { contains: userQuery, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    }),
    prisma.trainingModule.findMany({
      where: {
        title: moduleQuery ? { contains: moduleQuery, mode: "insensitive" } : undefined,
        category: moduleCategory ? { contains: moduleCategory, mode: "insensitive" } : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.trainingModule.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
    Promise.all([
      prisma.venture.count(),
      prisma.venture.count({ where: { published: false } }),
      prisma.user.count(),
    ]),
  ]);

  const [ventureCount, pendingCount, userCount] = counts;
  const categoryOptions = moduleCategories
    .map((c) => c.category)
    .filter((c): c is string => !!c);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Administración</h1>
        <p className="text-muted-foreground">Acceso exclusivo para administradores.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Emprendimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{ventureCount}</p>
            <p className="text-xs text-muted-foreground">Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Sin publicar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{userCount}</p>
            <p className="text-xs text-muted-foreground">Registrados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Moderación de emprendimientos</CardTitle>
            <VentureFilters venture={ventureQuery} stage={stageFilter} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ventures.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay emprendimientos.</p>
          )}
          {ventures.map((venture) => (
            <div
              key={venture.id}
              className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card/60 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{venture.title}</span>
                  <Badge variant="secondary">{stageLabel[venture.stage] || venture.stage}</Badge>
                  <Badge variant={venture.published ? "default" : "outline"}>
                    {venture.published ? "Publicado" : "Oculto"}
                  </Badge>
                  {venture.featured && <Badge variant="default">Destacado</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {venture.owner?.name || "Sin nombre"} · {venture.owner?.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={toggleVenturePublished}>
                  <input type="hidden" name="id" value={venture.id} />
                  <Button size="sm" variant="outline" type="submit">
                    {venture.published ? "Ocultar" : "Publicar"}
                  </Button>
                </form>
                <form action={toggleVentureFeatured}>
                  <input type="hidden" name="id" value={venture.id} />
                  <Button size="sm" variant={venture.featured ? "secondary" : "outline"} type="submit">
                    {venture.featured ? "Quitar destacado" : "Destacar"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Usuarios</CardTitle>
            <UserFilters user={userQuery} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 && <p className="text-sm text-muted-foreground">No hay usuarios.</p>}
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card/60 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{user.name || "Sin nombre"}</span>
                  <Badge variant="outline">{user.email}</Badge>
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Creado el {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Módulos de formación</CardTitle>
            <ModuleFilters query={moduleQuery} category={moduleCategory} categories={categoryOptions} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {modules.length === 0 && <p className="text-sm text-muted-foreground">No hay módulos cargados.</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {modules.map((mod) => (
              <div key={mod.id} className="rounded-lg border border-border/70 bg-card/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{mod.title}</p>
                    <p className="text-xs text-muted-foreground">{mod.category}</p>
                  </div>
                  <Badge variant="secondary">PDF</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground break-all">{mod.path}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
