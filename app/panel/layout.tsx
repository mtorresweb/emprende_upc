import type { ReactNode } from "react";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold uppercase">PANEL</h1>
          <p className="text-sm text-muted-foreground">
            Crea y gestiona tus emprendimientos desde un solo lugar.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-transparent p-0">{children}</div>
    </div>
  );
}
