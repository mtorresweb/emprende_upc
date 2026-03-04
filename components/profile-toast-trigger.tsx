"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ProfileToastTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showFromQuery = searchParams.get("updated") === "1";
  const error = searchParams.get("error");
  const hasShown = useRef(false);

  const targetHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("updated");
    params.delete("error");
    const query = params.toString();
    return `/perfil${query ? `?${query}` : ""}`;
  }, [searchParams]);

  useEffect(() => {
    if (hasShown.current) return;
    if (error) {
      hasShown.current = true;
      toast.error("No se pudo guardar", {
        description: error,
      });
      router.replace(targetHref, { scroll: false });
    } else if (showFromQuery) {
      hasShown.current = true;
      toast.success("Perfil actualizado", {
        description: "Tus cambios se guardaron correctamente.",
      });
      router.replace(targetHref, { scroll: false });
    }
  }, [showFromQuery, error, router, targetHref]);

  return null;
}
