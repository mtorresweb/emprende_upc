import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Registro y perfiles",
    description: "Altas rápidas, roles y perfiles editables con enlaces y avatar.",
    icon: ShieldCheck,
  },
  {
    title: "Publicación de ideas",
    description: "Crea fichas de emprendimiento con adjuntos y actualizaciones.",
    icon: Sparkles,
  },
  {
    title: "Formación y chatbot",
    description: "Módulos en PDF en nueva pestaña y asistencia inmediata en chat.",
    icon: MessageCircle,
  },
];

const training = [
  "Comercio Electrónico",
  "Finanzas para Emprendedores",
  "Marketing Digital para Emprendimientos",
  "Modelos de Negocio",
];

const stats = [
  { label: "Emprendimientos en piloto", value: "12" },
  { label: "Horas de formación", value: "24+" },
  { label: "Módulos disponibles", value: "4" },
];

const steps = [
  {
    title: "Crea tu cuenta",
    desc: "Regístrate y completa tu perfil con links, bio y avatar.",
    icon: Users,
  },
  {
    title: "Publica tu idea",
    desc: "Sube la ficha del proyecto, etapa y adjunta PDFs o imágenes.",
    icon: Lightbulb,
  },
  {
    title: "Forma y mejora",
    desc: "Consulta los módulos y usa el chatbot para resolver dudas.",
    icon: Rocket,
  },
];

const stageLabel: Record<string, string> = {
  IDEA: "Idea",
  PROTOTYPE: "Prototipo",
  MVP: "MVP",
  GROWTH: "Crecimiento",
};

export default async function Home() {
  const featured = await prisma.venture.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, title: true, summary: true, stage: true, tags: true },
  });

  const hasFeatured = featured.length > 0;

  const ventures = hasFeatured
    ? featured
    : [
        {
          id: "#biopack",
          title: "BioPack",
          stage: "MVP",
          summary: "Packaging compostable para e-commerce locales.",
          tags: ["Sostenible", "D2C"],
        },
        {
          id: "#tutorai",
          title: "TutorAI",
          stage: "PROTOTYPE",
          summary: "Asistente de estudio para cursos intro de ingeniería.",
          tags: ["EdTech", "IA"],
        },
        {
          id: "#mercadito",
          title: "Mercadito UPC",
          stage: "IDEA",
          summary: "Marketplace de productos hechos por estudiantes.",
          tags: ["Marketplace", "Local"],
        },
      ];

  return (
    <div className="bg-linear-to-b from-background via-background/80 to-secondary/20">
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16 md:gap-20 md:px-10 lg:px-16">
        <section className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge className="w-fit" variant="secondary">
              Emprende UPC · MVP
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
                Publica, visibiliza y potencia los emprendimientos estudiantiles.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Regístrate, publica tu emprendimiento, accede a formación en PDF y
                recibe ayuda inmediata con el chatbot institucional.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild>
                <Link href="/registro" className="text-amber-50">Registrarme</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="#caracteristicas">Ver características</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/emprendimientos">Ver emprendimientos</Link>
              </Button>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-secondary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />
                Publicación rápida
              </div>
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-secondary-foreground shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                Datos seguros
              </div>
            </div>
          </div>
          <Card className="border-border/80 bg-card/80 backdrop-blur">
            <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                Vista previa del panel
              </CardTitle>
              <CardDescription>
                Así se verá cuando te registres: prepara tu perfil, publica tu primera idea y revisa los módulos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-xs text-muted-foreground">Tu perfil</p>
                  <p className="text-xl font-semibold text-foreground">Completa en 2 min</p>
                  <p className="mt-1 text-xs text-muted-foreground">Añade foto, links y una breve bio.</p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs text-secondary-foreground">Recursos descargables</p>
                  <p className="text-2xl font-semibold text-secondary-foreground">8</p>
                  <p className="mt-1 text-[11px] text-secondary-foreground/90">Plantillas y guías disponibles tras registrarte.</p>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Comienza aquí</p>
                    <p className="text-sm text-muted-foreground">
                      Marketing Digital para Emprendimientos (abre en nueva pestaña)
                    </p>
                  </div>
                </div>
                <Button variant="link" className="px-0 text-primary" asChild>
                  <Link href="/formacion">Abrir módulo</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-4 py-3">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Chat de asistencia</p>
                    <p className="text-xs text-muted-foreground">Pide ayuda para publicar o resolver dudas al registrarte.</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 rounded-2xl border border-border/70 bg-card/50 p-6 shadow-sm md:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="text-3xl font-semibold text-foreground">
                {item.value}
              </div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </section>

        <section id="caracteristicas" className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Todo en un solo lugar</h2>
              <p className="text-muted-foreground">
                Registra tu perfil, publica tu emprendimiento y accede a recursos de
                formación con asistencia inmediata.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Cómo funciona</h2>
            <p className="text-muted-foreground">
              Tres pasos para salir a producción en el programa institucional.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title} className="h-full">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Emprendimientos destacados</h2>
            <p className="text-muted-foreground">
              Casos reales publicados por la comunidad. Explora más con filtros y vistas.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {ventures.map((venture) => (
              <Card key={venture.id} className="h-full">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    {hasFeatured ? (
                      <Link href={`/emprendimientos/${venture.id}`} className="text-base font-semibold hover:underline">
                        {venture.title}
                      </Link>
                    ) : (
                      <CardTitle className="text-base">{venture.title}</CardTitle>
                    )}
                    <Badge variant="secondary">{stageLabel[venture.stage] || venture.stage}</Badge>
                  </div>
                  <CardDescription>{venture.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {venture.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Button asChild variant="outline">
              <Link href="/emprendimientos" className="flex items-center gap-2">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="formacion" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Módulos de formación</h2>
            <p className="text-muted-foreground">
              Recursos de formación que podrás abrir en una pestaña nueva para
              revisarlos con calma.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {training.map((item) => (
              <Link
                key={item}
                href={{ pathname: "/formacion", query: { modulo: item } }}
                className="rounded-lg border border-border/70 bg-card px-4 py-3 text-sm shadow-sm transition hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-1 text-muted-foreground">
                  Ir a la página de formación.
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-linear-to-r from-primary/10 via-primary/5 to-secondary/20 p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">¿Listo para publicar tu emprendimiento?</h3>
              <p className="text-muted-foreground">
                Crea tu cuenta, completa tu ficha y comparte tus avances con la comunidad.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/registro" className="text-white">Comenzar</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/formacion">Ver módulos</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
