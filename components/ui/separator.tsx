import { cn } from "@/lib/utils";

type Orientation = "horizontal" | "vertical";

export function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: Orientation }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "w-px h-full" : "h-px w-full",
        className
      )}
    />
  );
}
