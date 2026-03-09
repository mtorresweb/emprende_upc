"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AttachmentPreviewButton({ url, name, mime }: { url: string; name: string; mime?: string | null }) {
  const isImage = mime?.startsWith("image/");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          Vista previa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl p-0" aria-label="Vista previa de adjunto">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="truncate text-sm font-semibold text-foreground">{name}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{mime || "archivo"}</DialogDescription>
        </DialogHeader>
        <div className="h-[70vh] w-full bg-background">
          {isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto">
              <img src={url} alt={name} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <iframe
              src={url}
              title={name}
              className="h-full w-full"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
