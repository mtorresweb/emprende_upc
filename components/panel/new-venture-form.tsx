"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewVentureForm({ createVentureAction }: { createVentureAction: (formData: FormData) => void }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {!showForm ? (
        <Button className="w-full" onClick={() => setShowForm(true)}>
          Publicar nuevo
        </Button>
      ) : (
        <form action={createVentureAction} className="space-y-5 mt-4" data-attachment-form="true">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input name="title" id="title" required minLength={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Descripción</Label>
            <Textarea name="summary" id="summary" required minLength={10} className="min-h-40" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa</Label>
              <select
                name="stage"
                id="stage"
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
              <Input name="tags" id="tags" placeholder="fintech, impacto, salud" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="files">Adjuntos iniciales (opcional)</Label>
            <Input name="files" id="files" type="file" className="text-sm" multiple />
            <p className="text-xs text-muted-foreground">Máx 8MB por archivo, total ~30MB.</p>
          </div>
          <Button type="submit" className="w-full">
            Publicar
          </Button>
        </form>
      )}
    </div>
  );
}