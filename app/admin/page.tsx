import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrainingCatalog } from "@/lib/training";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLoadMoreButton, ActivityRecentControls, ModuleFilters, UserFilters, VentureFilters } from "./filters";

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

const adminTabs = ["stats", "users", "ventures", "modules"] as const;
const activityTypes = ["all", "users", "ventures", "attachments", "chat", "training"] as const;

type AdminTab = (typeof adminTabs)[number];
type ActivityType = (typeof activityTypes)[number];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit" }).format(date);
}

function buildDailySeries(days: number, now: Date, dates: Date[]) {
  const start = startOfDay(new Date(now));
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const date of dates) {
    const key = startOfDay(date).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([key, value]) => {
    const date = new Date(`${key}T00:00:00`);
    return { key, label: dayLabel(date), value };
  });
}

function getDelta(current: number, previous: number) {
  const diff = current - previous;
  const pct = previous > 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;
  const sign = diff > 0 ? "+" : diff < 0 ? "" : "";
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const symbol = direction === "up" ? "^" : direction === "down" ? "v" : "=";

  return {
    diff,
    pct,
    label: `${sign}${diff} (${sign}${Math.round(pct)}%) vs periodo anterior`,
    symbol,
    tone:
      diff > 0
        ? "text-emerald-600"
        : diff < 0
          ? "text-rose-600"
          : "text-muted-foreground",
  };
}

function toLinePoints(values: number[], width: number, height: number, max: number) {
  if (values.length === 0) return "";
  const xStep = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * xStep;
      const y = height - (max > 0 ? (value / max) * height : 0);
      return `${x},${y}`;
    })
    .join(" ");
}

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
    | Promise<{ tab?: string; statsRange?: string; activityType?: string; activityLimit?: string; venture?: string; stage?: string; user?: string; module?: string; moduleCategory?: string }>
    | { tab?: string; statsRange?: string; activityType?: string; activityLimit?: string; venture?: string; stage?: string; user?: string; module?: string; moduleCategory?: string };
}) {
  await ensureAdmin();

  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const tabParam = params?.tab?.trim();
  const activeTab: AdminTab = tabParam && (adminTabs as readonly string[]).includes(tabParam) ? (tabParam as AdminTab) : "stats";

  const ventureQuery = params?.venture?.trim() || "";
  const stageParam = params?.stage?.trim();
  const allowedStages = ["IDEA", "PROTOTYPE", "MVP", "GROWTH"] as const;
  const stageFilter = stageParam && allowedStages.includes(stageParam as any) ? stageParam : "";
  const userQuery = params?.user?.trim() || "";
  const moduleQuery = params?.module?.trim() || "";
  const moduleCategory = params?.moduleCategory?.trim() || "";
  const statsRangeParam = Number(params?.statsRange || "30");
  const statsRangeDays = [7, 30, 90].includes(statsRangeParam) ? statsRangeParam : 30;
  const statsRangeLabel = `${statsRangeDays} días`;
  const trendDays = Math.min(statsRangeDays, 30);
  const trendLabel = `${trendDays} días`;
  const activityTypeParam = params?.activityType?.trim() || "all";
  const activityType: ActivityType = (activityTypes as readonly string[]).includes(activityTypeParam)
    ? (activityTypeParam as ActivityType)
    : "all";
  const activityLimitParam = Number(params?.activityLimit || "12");
  const activityLimit = [12, 24, 36, 48, 60].includes(activityLimitParam) ? activityLimitParam : 12;
  const activityStep = 12;

  const now = new Date();
  const sinceRange = new Date(now);
  sinceRange.setDate(now.getDate() - statsRangeDays);
  const previousRangeStart = new Date(now);
  previousRangeStart.setDate(now.getDate() - statsRangeDays * 2);
  const sinceTrend = new Date(now);
  sinceTrend.setDate(now.getDate() - trendDays);

  const [ventures, users, trainingCatalog, counts, totalPublishedVentures, totalFeaturedVentures, totalAttachments, totalMessages, progressOpensRange, progressOpensPreviousRange, usersRange, usersPreviousRange, venturesRange, venturesPreviousRange, usersTrend, venturesTrend, messagesTrend, trainingTrend, attachmentsTrend, messageActiveUsersRange, messageActiveUsersPreviousRange, trainingActiveUsersRange, trainingActiveUsersPreviousRange, ventureActiveUsersRange, ventureActiveUsersPreviousRange, latestUsers, latestVentures, latestAttachments, latestMessages, latestTrainingOpens, activityCounts] = await Promise.all([
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
    getTrainingCatalog(),
    Promise.all([
      prisma.venture.count(),
      prisma.venture.count({ where: { published: false } }),
      prisma.user.count(),
    ]),
    prisma.venture.count({ where: { published: true } }),
    prisma.venture.count({ where: { featured: true } }),
    prisma.attachment.count(),
    prisma.message.count({ where: { role: { in: ["USER", "ASSISTANT"] } } }),
    prisma.trainingProgress.count({ where: { openedAt: { gte: sinceRange } } }),
    prisma.trainingProgress.count({ where: { openedAt: { gte: previousRangeStart, lt: sinceRange } } }),
    prisma.user.count({ where: { createdAt: { gte: sinceRange } } }),
    prisma.user.count({ where: { createdAt: { gte: previousRangeStart, lt: sinceRange } } }),
    prisma.venture.count({ where: { createdAt: { gte: sinceRange } } }),
    prisma.venture.count({ where: { createdAt: { gte: previousRangeStart, lt: sinceRange } } }),
    prisma.user.findMany({ where: { createdAt: { gte: sinceTrend } }, select: { createdAt: true } }),
    prisma.venture.findMany({ where: { createdAt: { gte: sinceTrend } }, select: { createdAt: true } }),
    prisma.message.findMany({ where: { createdAt: { gte: sinceTrend }, role: { in: ["USER", "ASSISTANT"] } }, select: { createdAt: true } }),
    prisma.trainingProgress.findMany({ where: { openedAt: { gte: sinceTrend } }, select: { openedAt: true } }),
    prisma.attachment.findMany({ where: { createdAt: { gte: sinceTrend } }, select: { createdAt: true } }),
    prisma.message.findMany({ where: { createdAt: { gte: sinceRange }, userId: { not: null } }, select: { userId: true } }),
    prisma.message.findMany({ where: { createdAt: { gte: previousRangeStart, lt: sinceRange }, userId: { not: null } }, select: { userId: true } }),
    prisma.trainingProgress.findMany({ where: { openedAt: { gte: sinceRange } }, select: { userId: true } }),
    prisma.trainingProgress.findMany({ where: { openedAt: { gte: previousRangeStart, lt: sinceRange } }, select: { userId: true } }),
    prisma.venture.findMany({ where: { createdAt: { gte: sinceRange } }, select: { ownerId: true } }),
    prisma.venture.findMany({ where: { createdAt: { gte: previousRangeStart, lt: sinceRange } }, select: { ownerId: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: activityLimit, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.venture.findMany({ orderBy: { createdAt: "desc" }, take: activityLimit, select: { id: true, title: true, createdAt: true, owner: { select: { name: true } } } }),
    prisma.attachment.findMany({ orderBy: { createdAt: "desc" }, take: activityLimit, select: { id: true, name: true, createdAt: true, venture: { select: { title: true } } } }),
    prisma.message.findMany({ where: { role: { in: ["USER", "ASSISTANT"] } }, orderBy: { createdAt: "desc" }, take: activityLimit, select: { id: true, role: true, createdAt: true } }),
    prisma.trainingProgress.findMany({ orderBy: { openedAt: "desc" }, take: activityLimit, select: { id: true, resourcePath: true, openedAt: true, user: { select: { name: true, email: true } } } }),
    Promise.all([
      prisma.user.count(),
      prisma.venture.count(),
      prisma.attachment.count(),
      prisma.message.count({ where: { role: { in: ["USER", "ASSISTANT"] } } }),
      prisma.trainingProgress.count(),
    ]),
  ]);

  const [ventureCount, pendingCount, userCount] = counts;
  const moduleRows = trainingCatalog.flatMap((category) =>
    category.resources.map((resource) => ({
      title: resource.label,
      category: category.category,
      path: resource.path,
    })),
  );

  const categoryOptions = trainingCatalog.map((category) => category.category);
  const normalizedModuleQuery = moduleQuery.toLowerCase();
  const normalizedModuleCategory = moduleCategory.toLowerCase();
  const modules = moduleRows.filter((mod) => {
    const matchesTitle = normalizedModuleQuery
      ? mod.title.toLowerCase().includes(normalizedModuleQuery)
      : true;
    const matchesCategory = normalizedModuleCategory
      ? mod.category.toLowerCase().includes(normalizedModuleCategory)
      : true;
    return matchesTitle && matchesCategory;
  });

  const publishedRate = ventureCount > 0 ? totalPublishedVentures / ventureCount : 0;
  const featuredRate = ventureCount > 0 ? totalFeaturedVentures / ventureCount : 0;
  const avgAttachmentsPerVenture = ventureCount > 0 ? totalAttachments / ventureCount : 0;

  const activityUsersRange = new Set([
    ...messageActiveUsersRange.map((x) => x.userId).filter(Boolean),
    ...trainingActiveUsersRange.map((x) => x.userId),
    ...ventureActiveUsersRange.map((x) => x.ownerId),
  ]).size;

  const activityUsersPreviousRange = new Set([
    ...messageActiveUsersPreviousRange.map((x) => x.userId).filter(Boolean),
    ...trainingActiveUsersPreviousRange.map((x) => x.userId),
    ...ventureActiveUsersPreviousRange.map((x) => x.ownerId),
  ]).size;

  const usersRangeDelta = getDelta(usersRange, usersPreviousRange);
  const venturesRangeDelta = getDelta(venturesRange, venturesPreviousRange);
  const trainingOpensDelta = getDelta(progressOpensRange, progressOpensPreviousRange);
  const activityUsersDelta = getDelta(activityUsersRange, activityUsersPreviousRange);

  const usersSeries = buildDailySeries(trendDays, now, usersTrend.map((x) => x.createdAt));
  const venturesSeries = buildDailySeries(trendDays, now, venturesTrend.map((x) => x.createdAt));
  const messagesSeries = buildDailySeries(trendDays, now, messagesTrend.map((x) => x.createdAt));
  const trainingSeries = buildDailySeries(trendDays, now, trainingTrend.map((x) => x.openedAt));
  const attachmentsSeries = buildDailySeries(trendDays, now, attachmentsTrend.map((x) => x.createdAt));

  const trendSeries = [
    { key: "users", title: "Usuarios nuevos", color: "#0ea5e9", data: usersSeries },
    { key: "ventures", title: "Emprendimientos creados", color: "#10b981", data: venturesSeries },
    { key: "chat", title: "Mensajes de chat", color: "#f59e0b", data: messagesSeries },
    { key: "training", title: "Aperturas de formación", color: "#d946ef", data: trainingSeries },
    { key: "attachments", title: "Adjuntos cargados", color: "#6366f1", data: attachmentsSeries },
  ] as const;

  const chartWidth = 760;
  const chartHeight = 230;
  const chartPaddingX = 16;
  const chartPaddingY = 16;
  const innerChartWidth = chartWidth - chartPaddingX * 2;
  const innerChartHeight = chartHeight - chartPaddingY * 2;

  const maxSeriesValue = Math.max(
    1,
    ...usersSeries.map((d) => d.value),
    ...venturesSeries.map((d) => d.value),
    ...messagesSeries.map((d) => d.value),
    ...trainingSeries.map((d) => d.value),
    ...attachmentsSeries.map((d) => d.value),
  );

  const allRecentActivity = [
    ...latestUsers.map((u) => ({
      id: `user-${u.id}`,
      type: "users" as ActivityType,
      when: u.createdAt,
      title: "Nuevo usuario registrado",
      description: `${u.name || "Sin nombre"} (${u.email})`,
    })),
    ...latestVentures.map((v) => ({
      id: `venture-${v.id}`,
      type: "ventures" as ActivityType,
      when: v.createdAt,
      title: "Nuevo emprendimiento creado",
      description: `${v.title} · ${v.owner?.name || "Sin nombre"}`,
    })),
    ...latestAttachments.map((a) => ({
      id: `attachment-${a.id}`,
      type: "attachments" as ActivityType,
      when: a.createdAt,
      title: "Adjunto cargado",
      description: `${a.name} · ${a.venture.title}`,
    })),
    ...latestMessages.map((m) => ({
      id: `message-${m.id}`,
      type: "chat" as ActivityType,
      when: m.createdAt,
      title: "Interacción en chat",
      description: m.role === "ASSISTANT" ? "Respuesta del asistente" : "Mensaje de usuario",
    })),
    ...latestTrainingOpens.map((p) => ({
      id: `training-${p.id}`,
      type: "training" as ActivityType,
      when: p.openedAt,
      title: "Recurso de formación abierto",
      description: `${p.user.name || p.user.email} · ${p.resourcePath}`,
    })),
  ];

  const recentActivity = allRecentActivity
    .filter((item) => (activityType === "all" ? true : item.type === activityType))
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, activityLimit);

  const [activityUserCount, activityVentureCount, activityAttachmentCount, activityChatCount, activityTrainingCount] = activityCounts;

  const activityTotalByType: Record<ActivityType, number> = {
    all: activityUserCount + activityVentureCount + activityAttachmentCount + activityChatCount + activityTrainingCount,
    users: activityUserCount,
    ventures: activityVentureCount,
    attachments: activityAttachmentCount,
    chat: activityChatCount,
    training: activityTrainingCount,
  };

  const canLoadMoreActivity = activityLimit < activityTotalByType[activityType];

  const tabHref = (tab: AdminTab) => {
    const next = new URLSearchParams();
    next.set("tab", tab);
    next.set("statsRange", String(statsRangeDays));
    next.set("activityType", activityType);
    next.set("activityLimit", String(activityLimit));
    if (ventureQuery) next.set("venture", ventureQuery);
    if (stageFilter) next.set("stage", stageFilter);
    if (userQuery) next.set("user", userQuery);
    if (moduleQuery) next.set("module", moduleQuery);
    if (moduleCategory) next.set("moduleCategory", moduleCategory);
    return `/admin?${next.toString()}`;
  };

  const statsRangeHref = (days: number) => {
    const next = new URLSearchParams();
    next.set("tab", "stats");
    next.set("statsRange", String(days));
    next.set("activityType", activityType);
    next.set("activityLimit", String(activityLimit));
    if (ventureQuery) next.set("venture", ventureQuery);
    if (stageFilter) next.set("stage", stageFilter);
    if (userQuery) next.set("user", userQuery);
    if (moduleQuery) next.set("module", moduleQuery);
    if (moduleCategory) next.set("moduleCategory", moduleCategory);
    return `/admin?${next.toString()}`;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">ADMINISTRACIÓN</h1>
        <p className="text-muted-foreground">Acceso exclusivo para administradores.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={tabHref("stats")} className={`rounded-md border px-3 py-2 text-sm ${activeTab === "stats" ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-foreground hover:bg-muted/50"}`}>
          Estadísticas
        </Link>
        <Link href={tabHref("users")} className={`rounded-md border px-3 py-2 text-sm ${activeTab === "users" ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-foreground hover:bg-muted/50"}`}>
          Usuarios
        </Link>
        <Link href={tabHref("ventures")} className={`rounded-md border px-3 py-2 text-sm ${activeTab === "ventures" ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-foreground hover:bg-muted/50"}`}>
          Emprendimientos
        </Link>
        <Link href={tabHref("modules")} className={`rounded-md border px-3 py-2 text-sm ${activeTab === "modules" ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-foreground hover:bg-muted/50"}`}>
          Módulos de formación
        </Link>
      </div>

      {activeTab === "stats" && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-card/60 p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Rango de análisis</p>
              <p className="text-xs text-muted-foreground">Las métricas de actividad y uso se calculan sobre {statsRangeLabel}.</p>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <Link
                  key={days}
                  href={statsRangeHref(days)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${statsRangeDays === days ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-foreground hover:bg-muted/50"}`}
                >
                  {days}d
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Emprendimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{ventureCount}</p>
                <p className="text-xs text-muted-foreground">Total histórico de proyectos creados.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Proyectos sin publicar en este momento.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{userCount}</p>
                <p className="text-xs text-muted-foreground">Usuarios acumulados en la plataforma.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Actividad ({statsRangeLabel})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{activityUsersRange}</p>
                <p className="text-xs text-muted-foreground">Usuarios activos por chat, formación o creación de proyectos.</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${activityUsersDelta.tone}`}>
                  <span>{activityUsersDelta.symbol}</span>
                  <span>{activityUsersDelta.label}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Uso de formación ({statsRangeLabel})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{progressOpensRange}</p>
                <p className="text-xs text-muted-foreground">Aperturas de recursos de formación registradas.</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${trainingOpensDelta.tone}`}>
                  <span>{trainingOpensDelta.symbol}</span>
                  <span>{trainingOpensDelta.label}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Nuevos registros ({statsRangeLabel})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{usersRange}</p>
                <p className="text-xs text-muted-foreground">Usuarios nuevos en los últimos {statsRangeLabel}.</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${usersRangeDelta.tone}`}>
                  <span>{usersRangeDelta.symbol}</span>
                  <span>{usersRangeDelta.label}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Nuevos emprendimientos ({statsRangeLabel})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{venturesRange}</p>
                <p className="text-xs text-muted-foreground">Proyectos creados durante el período seleccionado.</p>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${venturesRangeDelta.tone}`}>
                  <span>{venturesRangeDelta.symbol}</span>
                  <span>{venturesRangeDelta.label}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Mensajes de chat (histórico)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{totalMessages}</p>
                <p className="text-xs text-muted-foreground">Mensajes usuario/asistente acumulados en la plataforma.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Recursos formativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{moduleRows.length}</p>
                <p className="text-xs text-muted-foreground">Recursos disponibles en el catálogo actual.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Actividad reciente de la plataforma</CardTitle>
              <p className="text-sm text-muted-foreground">Filtra por tipo de evento y carga más resultados para revisar el historial.</p>
              <ActivityRecentControls
                activityType={activityType}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay actividad para este filtro.</p>
              )}
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-md border border-border/70 bg-card/60 p-3">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(item.when)}
                  </p>
                </div>
              ))}

              <div className="pt-1">
                <ActivityLoadMoreButton
                  activityType={activityType}
                  activityLimit={activityLimit}
                  canLoadMore={canLoadMoreActivity}
                />
              </div>

            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "ventures" && (
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
      )}

      {activeTab === "users" && (
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
      )}

      {activeTab === "modules" && (
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
              {modules.map((mod) => {
                const ext = mod.path.split(".").pop()?.toUpperCase() || "ARCHIVO";
                return (
                  <div key={`${mod.category}-${mod.path}`} className="rounded-lg border border-border/70 bg-card/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{mod.title}</p>
                        <p className="text-xs text-muted-foreground">{mod.category}</p>
                      </div>
                      <Badge variant="secondary">{ext}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground break-all">{mod.path}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
