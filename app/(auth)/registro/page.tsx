"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROGRAM_OPTIONS = [
  "contaduria publica",
  "economia",
  "administracion de empresas",
  "ingenieria agroindustrial",
  "ingenieria ambiental y sanitaria",
  "ingenieria de sistemas",
  "tecnologia agropecuaria",
] as const;

const EMAIL_DOMAIN = "unicesar.edu.co";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Ingresa tu nombre" }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Correo inválido" })
    .refine((value) => value.endsWith(`@${EMAIL_DOMAIN}`), {
      message: `El correo debe ser @${EMAIL_DOMAIN}`,
    }),
  password: z
    .string()
    .min(8, { message: "Mínimo 8 caracteres" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
      message: "Incluye mayúscula, minúscula y número",
    }),
  documentNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, { message: "El documento solo debe tener números" })
    .min(6, { message: "Ingresa tu número de documento" })
    .max(30),
  program: z.enum(PROGRAM_OPTIONS, { message: "Selecciona tu programa" }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setSubmitting(true);
    setServerError(null);
    setSuccess(false);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 800);
    } else {
      const payload = await res.json().catch(() => ({}));
      setServerError(payload.error || "No se pudo registrar");
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Regístrate para publicar y seguir tus emprendimientos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" autoComplete="name" {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número de documento</Label>
              <Input
                id="documentNumber"
                autoComplete="off"
                {...register("documentNumber")}
              />
              {errors.documentNumber && (
                <p className="text-sm text-destructive">{errors.documentNumber.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Programa académico</Label>
              <Controller
                name="program"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="program" className="h-11">
                      <SelectValue placeholder="Selecciona tu programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.program && (
                <p className="text-sm text-destructive">{errors.program.message}</p>
              )}
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            {success && <p className="text-sm text-green-600">Registro exitoso. Redirigiendo...</p>}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link className="text-primary" href="/login">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
