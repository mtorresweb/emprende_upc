"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const MAX_TOTAL = 30 * 1024 * 1024; // 30MB sum of selected files
const MAX_FILE = 8 * 1024 * 1024; // 8MB per file
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export function AttachmentsGuard() {
  useEffect(() => {
    const handler = (ev: Event) => {
      const form = ev.target as HTMLFormElement;
      const inputs = Array.from(
        form.querySelectorAll<HTMLInputElement>('input[type="file"][name="files"]')
      );
      const files = inputs.flatMap((inp) => Array.from(inp.files || []));
      const total = files.reduce((sum, f) => sum + (f?.size || 0), 0);

      if (total > MAX_TOTAL) {
        ev.preventDefault();
        toast.error("Archivos demasiado grandes", {
          description: "Sube menos archivos o más livianos (máx ~30MB en total).",
        });
        return;
      }

      for (const f of files) {
        if (!f) continue;
        if (f.size > MAX_FILE) {
          ev.preventDefault();
          toast.error("Archivo excede 8MB", {
            description: `${f.name} pesa ${(f.size / (1024 * 1024)).toFixed(1)}MB (límite 8MB).`,
          });
          return;
        }
        if (f.type && !ALLOWED.has(f.type)) {
          ev.preventDefault();
          toast.error("Tipo de archivo no permitido", {
            description: `${f.name} (${f.type || "desconocido"}) no es aceptado.`,
          });
          return;
        }
      }
    };

    const forms = Array.from(
      document.querySelectorAll<HTMLFormElement>("form[data-attachment-form='true']")
    );
    forms.forEach((f) => f.addEventListener("submit", handler));

    return () => {
      forms.forEach((f) => f.removeEventListener("submit", handler));
    };
  }, []);

  return null;
}
