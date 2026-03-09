"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type CoverPreviewDialogProps = {
  url?: string;
};

export function CoverPreviewDialog({ url }: CoverPreviewDialogProps) {
  if (!url) {
    return <p className="text-sm text-muted-foreground">Sin portada cargada.</p>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">Ver portada</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <VisuallyHidden>
          <DialogTitle>Vista previa de portada</DialogTitle>
        </VisuallyHidden>
        <img src={url} alt="Portada" className="w-full rounded-lg object-contain" />
      </DialogContent>
    </Dialog>
  );
}
