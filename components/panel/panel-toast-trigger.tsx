"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function PanelToastTrigger({
  initialError,
  initialOk,
}: {
  initialError?: string;
  initialOk?: string;
}) {
  const searchParams = useSearchParams();
  const shown = useRef(false);

  const error = initialError || searchParams.get("error") || undefined;
  const ok = initialOk || searchParams.get("ok") || undefined;

  const targetHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    params.delete("ok");
    const query = params.toString();
    return `/panel${query ? `?${query}` : ""}`;
  }, [searchParams]);

  useEffect(() => {
    if (shown.current) return;
    if (error) {
      shown.current = true;
      toast.error("No se pudo completar la acción", { description: error });
      window.history.replaceState(null, "", targetHref);
    } else if (ok) {
      shown.current = true;
      toast.success("Listo", { description: "Acción completada" });
      window.history.replaceState(null, "", targetHref);
    }
  }, [error, ok, targetHref]);

  return null;
}
