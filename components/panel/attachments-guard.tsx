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
    const PRESERVE_KEY = "preserve-form:";

    const restoreForm = (formId: string) => {
      try {
        const raw = localStorage.getItem(`${PRESERVE_KEY}${formId}`);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, string> | null;
        if (!parsed) return;
        const formEl = document.getElementById(formId) as HTMLFormElement | null;
        if (!formEl) return;
        Object.entries(parsed).forEach(([name, value]) => {
          const field = formEl.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${CSS.escape(name)}"]`);
          if (!field) return;
          if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
            field.checked = field.value === value;
          } else {
            field.value = value;
          }
        });
        localStorage.removeItem(`${PRESERVE_KEY}${formId}`);
      } catch (err) {
        console.error("restore form failed", err);
      }
    };

    const stashForm = (formId: string) => {
      try {
        const formEl = document.getElementById(formId) as HTMLFormElement | null;
        if (!formEl) return;
        const data = new FormData(formEl);
        const payload: Record<string, string> = {};
        data.forEach((val, key) => {
          if (val instanceof File) return;
          payload[key] = val.toString();
        });
        localStorage.setItem(`${PRESERVE_KEY}${formId}`, JSON.stringify(payload));
      } catch (err) {
        console.error("stash form failed", err);
      }
    };

    // Restore any preserved form state on mount
    const formsWithId = Array.from(document.querySelectorAll<HTMLFormElement>("form[id]"));
    formsWithId.forEach((form) => restoreForm(form.id));

    const uploadHandler = (ev: Event) => {
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
    forms.forEach((f) => f.addEventListener("submit", uploadHandler));

    const confirmHandler = (ev: Event) => {
      const form = ev.target as HTMLFormElement;
      const message = form.dataset.confirm;
      if (!message) return;
      const ok = window.confirm(message);
      if (!ok) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    };

    const confirmForms = Array.from(
      document.querySelectorAll<HTMLFormElement>("form[data-confirm]")
    );
    confirmForms.forEach((f) => f.addEventListener("submit", confirmHandler));

    const preserveForms = Array.from(
      document.querySelectorAll<HTMLFormElement>("form[data-preserve-form]")
    );
    const preserveHandlers: Array<{ form: HTMLFormElement; handler: (ev: Event) => void }> = [];
    preserveForms.forEach((f) => {
      const targetId = f.dataset.preserveForm;
      if (!targetId) return;
      const handler = () => stashForm(targetId);
      preserveHandlers.push({ form: f, handler });
      f.addEventListener("submit", handler);
    });

    return () => {
      forms.forEach((f) => f.removeEventListener("submit", uploadHandler));
      confirmForms.forEach((f) => f.removeEventListener("submit", confirmHandler));
      preserveHandlers.forEach(({ form, handler }) => form.removeEventListener("submit", handler));
    };
  }, []);

  return null;
}
