"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-3xl bg-card/95 p-0">
        <DialogTitle className="sr-only">Bienvenido a Emprende UPC</DialogTitle>
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8">
          <div className="flex-1 space-y-3">
            <p className="text-2xl font-semibold leading-tight">Bienvenido a Emprende UPC</p>
            <p className="text-sm text-muted-foreground">
              Publica tu proyecto, descarga módulos en PDF/PPTX y conecta con la comunidad emprendedora. Usa el panel
              para subir tu ficha y adjuntos, o explora ideas existentes para inspirarte.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <img
              src="/bulb.jpg"
              alt="Ilustración de trabajo en equipo y nuevas ideas"
              className="h-44 w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
