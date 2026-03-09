"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  attachmentId: string;
  redirectTo?: string;
  name?: string;
  "data-preserve-form"?: string;
};

export function DeleteAttachmentButton({ action, attachmentId, redirectTo, name, ...rest }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild {...rest}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Eliminar adjunto">
          ×
        </Button>
      </DialogTrigger>
      <DialogContent className="flex w-auto max-w-fit flex-col gap-5 px-5 py-6">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl">Eliminar adjunto</DialogTitle>
          <DialogDescription className="text-lg">
            ¿Eliminar {name ? `"${name}"` : "este archivo"}? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="ml-auto flex gap-3 pt-2 text-sm">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <form action={action} onSubmit={() => setOpen(false)} className="flex">
            <input type="hidden" name="attachmentId" value={attachmentId} />
            {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
            <Button type="submit" variant="destructive" size="sm">
              Eliminar
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
