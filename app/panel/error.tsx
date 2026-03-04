"use client";

import { Button } from "@/components/ui/button";

export default function PanelError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "Intenta nuevamente o reduce el tamaño/cantidad de archivos."}
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/panel")}>Volver al panel</Button>
      </div>
    </div>
  );
}
