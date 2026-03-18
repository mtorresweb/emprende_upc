"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Cargando...</div>}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo enviar el correo.");
      }
      setMessage("Si el correo existe, enviamos un enlace para restablecer la contraseña.");
    } catch (err: any) {
      setError(err.message || "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token) {
      setError("El enlace no es válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo restablecer la contraseña.");
      }
      setMessage("Contraseña actualizada. Ahora puedes iniciar sesión.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      setError(err.message || "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  };

  const isResetMode = Boolean(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isResetMode ? "Restablecer contraseña" : "Recuperar acceso"}</CardTitle>
          <CardDescription>
            {isResetMode
              ? "Ingresa una nueva contraseña para tu cuenta."
              : "Envía tu correo y te enviaremos un enlace para restablecer tu contraseña."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isResetMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              <Button className="w-full" onClick={handleRequest} disabled={loading || !email}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
              <Button className="w-full" onClick={handleReset} disabled={loading}>
                {loading ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
