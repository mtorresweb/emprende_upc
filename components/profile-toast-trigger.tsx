"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ProfileToastTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showFromQuery = searchParams.get("updated") === "1";
  const hasShown = useRef(false);

  const targetHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("updated");
    const query = params.toString();
    return `/perfil${query ? `?${query}` : ""}`;
  }, [searchParams]);

  useEffect(() => {
    if (!showFromQuery || hasShown.current) return;
    hasShown.current = true;
    toast.success("Perfil actualizado", {
      description: "Tus cambios se guardaron correctamente.",
    });
    router.replace(targetHref, { scroll: false });
  }, [showFromQuery, router, targetHref]);

  return null;
}
