import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { put } from "@vercel/blob";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfileToastTrigger } from "@/components/profile-toast-trigger";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  bio: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .transform((v) => v.trim()),
  roleTitle: z
    .string()
    .max(80, "Máximo 80 caracteres")
    .optional()
    .transform((v) => (v ? v.trim() : "")),
  availability: z.enum(["NONE", "LOOKING_PARTNERS", "MENTORING", "FREELANCE"]),
  website: z.string().url().or(z.literal("")).optional(),
  linkedin: z.string().url().or(z.literal("")).optional(),
  github: z.string().url().or(z.literal("")).optional(),
  instagram: z.string().url().or(z.literal("")).optional(),
  interests: z.string().optional(),
});

async function saveProfile(userId: string, formData: FormData) {
  "use server";

  const parsed = profileSchema.safeParse({
    bio: (formData.get("bio") ?? "").toString(),
    roleTitle: (formData.get("roleTitle") ?? "").toString(),
    availability: (formData.get("availability") ?? "NONE").toString(),
    website: (formData.get("website") ?? "").toString(),
    linkedin: (formData.get("linkedin") ?? "").toString(),
    github: (formData.get("github") ?? "").toString(),
    instagram: (formData.get("instagram") ?? "").toString(),
    interests: (formData.get("interests") ?? "").toString(),
  });

  if (!parsed.success) {
    redirect("/perfil?error=Revisa%20los%20datos%20ingresados.");
  }

  const interests = parsed.data.interests
    ? parsed.data.interests
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const currentProfile = await prisma.profile.findUnique({ where: { userId } });
  const removeAvatar = formData.get("removeAvatar") === "on";
  const file = formData.get("avatar") as File | null;

  let avatarKey = currentProfile?.avatarKey || null;

  if (removeAvatar) {
    avatarKey = null;
  } else if (file && file.size > 0) {
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      redirect("/perfil?error=La%20imagen%20supera%20los%202MB.");
    }
    if (!file.type.startsWith("image/")) {
      redirect("/perfil?error=Solo%20se%20permiten%20im%C3%A1genes.");
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      redirect("/perfil?error=Falta%20BLOB_READ_WRITE_TOKEN");
    }

    const ext = file.name.split(".").pop() || "png";
    const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    avatarKey = blob.url;
  }

  await prisma.profile.upsert({
    where: { userId },
    update: {
      bio: parsed.data.bio || null,
      roleTitle: parsed.data.roleTitle || null,
      availability: parsed.data.availability,
      website: parsed.data.website?.trim() || null,
      linkedin: parsed.data.linkedin?.trim() || null,
      github: parsed.data.github?.trim() || null,
      instagram: parsed.data.instagram?.trim() || null,
      interests,
      avatarKey,
    },
    create: {
      userId,
      bio: parsed.data.bio || null,
      roleTitle: parsed.data.roleTitle || null,
      availability: parsed.data.availability,
      website: parsed.data.website?.trim() || null,
      linkedin: parsed.data.linkedin?.trim() || null,
      github: parsed.data.github?.trim() || null,
      instagram: parsed.data.instagram?.trim() || null,
      interests,
      avatarKey,
    },
  });

  revalidatePath("/perfil");
  redirect("/perfil?updated=1");
}

export default async function PerfilPage({
  searchParams,
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      userId: true,
      avatarKey: true,
      roleTitle: true,
      availability: true,
      website: true,
      linkedin: true,
      github: true,
      instagram: true,
      bio: true,
      interests: true,
      documentNumber: true,
      program: true,
    },
  });

  const saveProfileAction = saveProfile.bind(null, session.user.id);
  const updated = searchParams?.updated === "1";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-6">
      <div>
        <p className="text-sm text-muted-foreground">Ajusta cómo te ven en la plataforma.</p>
        <h1 className="text-2xl font-semibold">Perfil</h1>
      </div>

      <Card className="border-border/80 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
          <CardDescription>Información visible a otros.</CardDescription>
          {updated && (
            <p className="text-sm font-medium text-green-600">Perfil actualizado.</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{session.user.name}</span>
            <span className="text-muted-foreground">•</span>
            <span>{session.user.email}</span>
            <Badge variant="secondary" className="uppercase">
              {session.user.role}
            </Badge>
            {profile?.program && (
              <Badge variant="outline" className="font-medium">{profile.program}</Badge>
            )}
          </div>

          <form action={saveProfileAction} className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
                <Avatar className=" ">
                <AvatarImage  src={profile?.avatarKey || undefined} alt="Avatar" />
                <AvatarFallback>
                  {session.user.name?.[0] || session.user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Label htmlFor="avatar" className="text-foreground">
                  Foto / avatar
                </Label>
                <Input id="avatar" name="avatar" type="file" accept="image/*" />
                <div className="flex items-center gap-2">
                  <input id="removeAvatar" name="removeAvatar" type="checkbox" />
                  <Label htmlFor="removeAvatar" className="text-xs">
                    Eliminar avatar
                  </Label>
                </div>
                <p className="text-xs">Máximo 2MB. Se almacena en Vercel Blob (público).</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roleTitle">Rol principal</Label>
                <Input
                  id="roleTitle"
                  name="roleTitle"
                  placeholder="Founder, PM, Growth, Dev..."
                  defaultValue={profile?.roleTitle || ""}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">Disponibilidad</Label>
                <select
                  id="availability"
                  name="availability"
                  defaultValue={profile?.availability || "NONE"}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="NONE">Solo networking</option>
                  <option value="LOOKING_PARTNERS">Busco socios</option>
                  <option value="MENTORING">Mentorías</option>
                  <option value="FREELANCE">Disponible freelance</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Intereses (coma separados)</Label>
              <Input
                id="interests"
                name="interests"
                placeholder="fintech, sostenibilidad, e-commerce"
                defaultValue={profile?.interests?.join(", ") || ""}
              />
              {profile?.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {profile.interests.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Sitio / Portafolio</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://..."
                  defaultValue={profile?.website || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  placeholder="https://www.linkedin.com/in/"
                  defaultValue={profile?.linkedin || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  name="github"
                  type="url"
                  placeholder="https://github.com/"
                  defaultValue={profile?.github || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram / TikTok</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  type="url"
                  placeholder="https://instagram.com/"
                  defaultValue={profile?.instagram || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio corta</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Cuenta en pocas líneas qué haces y qué te interesa."
                maxLength={500}
                defaultValue={profile?.bio || ""}
              />
              <p className="text-xs text-muted-foreground">Máximo 500 caracteres.</p>
            </div>
            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>

      <ProfileToastTrigger />
    </div>
  );
}
