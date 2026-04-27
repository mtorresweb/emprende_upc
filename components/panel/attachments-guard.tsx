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

    const clearInputError = (input: HTMLInputElement) => {
      const previous = input.parentElement?.querySelector<HTMLElement>("[data-file-error='true']");
      if (previous) previous.remove();
      input.setAttribute("aria-invalid", "false");
    };

    const setInputError = (input: HTMLInputElement, message: string) => {
      clearInputError(input);
      input.setAttribute("aria-invalid", "true");

      const msg = document.createElement("p");
      msg.dataset.fileError = "true";
      msg.className = "mt-1 text-xs text-destructive";
      msg.textContent = message;
      input.insertAdjacentElement("afterend", msg);
    };

    const getFormFiles = (form: HTMLFormElement) => {
      const inputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'));
      return inputs.flatMap((inp) => Array.from(inp.files || []));
    };

    const resolveMaxTotal = (form: HTMLFormElement) => {
      const raw = form.dataset.maxTotalBytes;
      const parsed = raw ? Number(raw) : Number.NaN;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : MAX_TOTAL;
    };

    const validateFile = (file: File) => {
      if (file.size > MAX_FILE) {
        return {
          title: "Archivo excede 8MB",
          description: `${file.name} pesa ${(file.size / (1024 * 1024)).toFixed(1)}MB (límite 8MB).`,
          inline: `El archivo ${file.name} supera el límite de 8MB.`,
        };
      }

      if (file.type && !ALLOWED.has(file.type)) {
        return {
          title: "Tipo de archivo no permitido",
          description: `${file.name} (${file.type || "desconocido"}) no es aceptado.`,
          inline: `El archivo ${file.name} no tiene un formato permitido.`,
        };
      }

      return null;
    };

    const notifyTotalLimit = (maxTotal: number) => {
      toast.error("Archivos demasiado grandes", {
        description: `Sube menos archivos o más livianos (máx ~${Math.floor(maxTotal / (1024 * 1024))}MB en total).`,
      });
    };

    const uploadHandler = (ev: Event) => {
      const form = ev.target as HTMLFormElement;
      const files = getFormFiles(form);
      const fileInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'));
      fileInputs.forEach((input) => clearInputError(input));
      const maxTotal = resolveMaxTotal(form);
      const total = files.reduce((sum, f) => sum + (f?.size || 0), 0);

      if (total > maxTotal) {
        ev.preventDefault();
        notifyTotalLimit(maxTotal);
        const firstWithFile = fileInputs.find((input) => (input.files?.length || 0) > 0);
        if (firstWithFile) {
          setInputError(
            firstWithFile,
            `La suma de archivos supera ~${Math.floor(maxTotal / (1024 * 1024))}MB. Reduce el peso total.`
          );
        }
        return;
      }

      const inputsByFile = fileInputs.flatMap((input) =>
        Array.from(input.files || []).map((file) => ({ input, file }))
      );

      for (const { input, file } of inputsByFile) {
        const error = validateFile(file);
        if (!error) continue;
        ev.preventDefault();
        toast.error(error.title, { description: error.description });
        setInputError(input, error.inline);
        return;
      }
    };

    const fileChangeHandler = (ev: Event) => {
      const input = ev.target as HTMLInputElement;
      if (!input || input.type !== "file") return;

      const form = input.form;
      if (!form) return;

      clearInputError(input);

      const selectedFiles = Array.from(input.files || []);
      for (const file of selectedFiles) {
        const error = validateFile(file);
        if (!error) continue;
        input.value = "";
        toast.error(error.title, { description: error.description });
        setInputError(input, error.inline);
        return;
      }

      const files = getFormFiles(form);
      const maxTotal = resolveMaxTotal(form);
      const total = files.reduce((sum, f) => sum + (f?.size || 0), 0);
      if (total > maxTotal) {
        input.value = "";
        notifyTotalLimit(maxTotal);
        setInputError(
          input,
          `La suma de archivos supera ~${Math.floor(maxTotal / (1024 * 1024))}MB. Reduce el peso total.`
        );
      }
    };

    const forms = Array.from(
      document.querySelectorAll<HTMLFormElement>("form[data-attachment-form='true']")
    );
    forms.forEach((f) => f.addEventListener("submit", uploadHandler));
    const fileInputs = forms.flatMap((f) => Array.from(f.querySelectorAll<HTMLInputElement>('input[type="file"]')));
    fileInputs.forEach((input) => input.addEventListener("change", fileChangeHandler));

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
      fileInputs.forEach((input) => input.removeEventListener("change", fileChangeHandler));
      confirmForms.forEach((f) => f.removeEventListener("submit", confirmHandler));
      preserveHandlers.forEach(({ form, handler }) => form.removeEventListener("submit", handler));
    };
  }, []);

  return null;
}
