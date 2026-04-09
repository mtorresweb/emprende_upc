import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Briefcase,
  Calendar,
  ExternalLink,
  Github,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Sparkles,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "./back-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

const availabilityLabel: Record<string, { text: string; color: string }> = {
  LOOKING_PARTNERS: { text: "Busca socios", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  MENTORING: { text: "Disponible para mentoría", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  FREELANCE: { text: "Freelance", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
};

const socialConfig = [
  { key: "website", label: "Sitio web", icon: Globe },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "github", label: "GitHub", icon: Github },
  { key: "instagram", label: "Instagram", icon: Instagram },
] as const;

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;

  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      profile: {
        select: {
          fullName: true,
          bio: true,
          avatarKey: true,
          roleTitle: true,
          availability: true,
          website: true,
          linkedin: true,
          github: true,
          instagram: true,
          interests: true,
          program: true,
        },
      },
      ventures: {
        where: { published: true },
        select: { id: true, title: true, summary: true, stage: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const displayName = user.profile?.fullName || user.name || "Usuario";
  const avatarUrl = user.profile?.avatarKey || null;
  const initials = displayName.slice(0, 2).toUpperCase();
  const profile = user.profile;

  const stageLabel: Record<string, string> = {
    IDEA: "Idea",
    PROTOTYPE: "Prototipo",
    MVP: "MVP",
    GROWTH: "Crecimiento",
  };

  const activeSocials = socialConfig.filter(
    (s) => profile?.[s.key as keyof typeof profile]
  );

  const availInfo =
    profile?.availability && profile.availability !== "NONE"
      ? availabilityLabel[profile.availability]
      : null;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-16">
      <BackButton />

      {/* Hero card */}
      <Card className="border-border/70 shadow-sm">
        <div className="px-6 pt-10 pb-10 md:px-8">
          <Avatar className="ring-4 ring-card shadow-lg">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="mt-4 space-y-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              {profile?.roleTitle && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  {profile.roleTitle}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {profile?.program && (
                <Badge variant="outline" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {profile.program}
                </Badge>
              )}
              {availInfo && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${availInfo.color}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {availInfo.text}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Miembro desde {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(user.createdAt))}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Info grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main column – bio + interests */}
        <div className="space-y-6 md:col-span-2">
          {profile?.bio && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  Sobre mí
                </h2>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {profile?.interests && profile.interests.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Intereses
                </h2>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column – social links */}
        {activeSocials.length > 0 && (
          <Card className="h-fit border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Globe className="h-4 w-4 text-primary" />
                Enlaces
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSocials.map((social, i) => {
                const url = profile?.[social.key as keyof typeof profile] as string;
                const Icon = social.icon;
                return (
                  <div key={social.key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-primary/10">
                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{social.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {url.replace(/^https?:\/\/(www\.)?/, "")}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                    {i < activeSocials.length - 1 && <Separator />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ventures */}
      {user.ventures.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Emprendimientos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {user.ventures.map((venture) => (
              <Link
                key={venture.id}
                href={`/emprendimientos/${venture.id}`}
                className="group"
              >
                <Card className="h-full border-border/70 shadow-sm transition-all group-hover:border-primary/40 group-hover:shadow-md">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold group-hover:text-primary transition-colors">
                        {venture.title}
                      </span>
                      <Badge variant="secondary">
                        {stageLabel[venture.stage] || venture.stage}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {venture.summary}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
