"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

function useSyncedValue(initial: string, key: string) {
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const current = searchParams.get(key) || "";
    setValue(current);
  }, [searchParams, key]);

  return [value, setValue] as const;
}

export function VentureFilters({ venture, stage }: { venture: string; stage: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [ventureValue, setVentureValue] = useSyncedValue(venture, "venture");
  const [stageValue, setStageValue] = useSyncedValue(stage, "stage");

  const handleSubmit = () => {
    const next = new URLSearchParams(searchParams.toString());

    const ventureTrim = ventureValue.trim();
    const stageTrim = stageValue.trim();

    if (ventureTrim) next.set("venture", ventureTrim);
    else next.delete("venture");

    if (stageTrim) next.set("stage", stageTrim);
    else next.delete("stage");

    startTransition(() => {
      router.replace(next.toString() ? `/admin?${next.toString()}` : "/admin", { scroll: false });
    });
  };

  return (
    <form
      className="flex flex-col gap-2 md:flex-row md:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <input
        name="venture"
        placeholder="Buscar título"
        value={ventureValue}
        onChange={(e) => setVentureValue(e.target.value)}
        className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
      />
      <select
        name="stage"
        value={stageValue}
        onChange={(e) => setStageValue(e.target.value)}
        className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
      >
        <option value="">Todas las etapas</option>
        <option value="IDEA">Idea</option>
        <option value="PROTOTYPE">Prototipo</option>
        <option value="MVP">MVP</option>
        <option value="GROWTH">Crecimiento</option>
      </select>
      <Button size="sm" type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Filtrando..." : "Filtrar"}
      </Button>
    </form>
  );
}

export function UserFilters({ user }: { user: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [userValue, setUserValue] = useSyncedValue(user, "user");

  const handleSubmit = () => {
    const next = new URLSearchParams(searchParams.toString());
    const userTrim = userValue.trim();

    if (userTrim) next.set("user", userTrim);
    else next.delete("user");

    startTransition(() => {
      router.replace(next.toString() ? `/admin?${next.toString()}` : "/admin", { scroll: false });
    });
  };

  return (
    <form
      className="flex flex-col gap-2 md:flex-row md:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <input
        name="user"
        placeholder="Buscar email o nombre"
        value={userValue}
        onChange={(e) => setUserValue(e.target.value)}
        className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
      />
      <Button size="sm" type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Filtrando..." : "Filtrar"}
      </Button>
    </form>
  );
}

export function ModuleFilters({
  query,
  category,
  categories,
}: {
  query: string;
  category: string;
  categories: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [moduleValue, setModuleValue] = useSyncedValue(query, "module");
  const [categoryValue, setCategoryValue] = useSyncedValue(category, "moduleCategory");
  const formRef = useRef<HTMLFormElement | null>(null);

  // Evita scroll al top al hacer replace; se usa transición sin navegación dura.
  useEffect(() => {
    if (!isPending && formRef.current) {
      formRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isPending]);

  const handleSubmit = () => {
    const next = new URLSearchParams(searchParams.toString());
    const q = moduleValue.trim();
    const cat = categoryValue.trim();

    if (q) next.set("module", q);
    else next.delete("module");

    if (cat) next.set("moduleCategory", cat);
    else next.delete("moduleCategory");

    startTransition(() => {
      router.replace(next.toString() ? `/admin?${next.toString()}` : "/admin", { scroll: false });
    });
  };

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-2 md:flex-row md:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <input
        name="module"
        placeholder="Buscar módulo"
        value={moduleValue}
        onChange={(e) => setModuleValue(e.target.value)}
        className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
      />
      <select
        name="moduleCategory"
        value={categoryValue}
        onChange={(e) => setCategoryValue(e.target.value)}
        className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm"
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <Button size="sm" type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Filtrando..." : "Filtrar"}
      </Button>
    </form>
  );
}
