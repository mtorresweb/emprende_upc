import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

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
      <Card className="border-border/80 bg-card/80 p-6 shadow-sm">{children}</Card>
    </div>
  );
}
