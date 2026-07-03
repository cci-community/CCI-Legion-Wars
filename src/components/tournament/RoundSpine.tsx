import { cn } from "@/lib/utils";

export interface SpineStep {
  key: string;
  label: string;
  sub?: string;
  status: "done" | "current" | "future";
}

/**
 * Vertical stage rail — sticks to the left edge of the viewport
 * on wide screens so the viewer never loses tournament context
 * while scrolling deep into a bracket.
 */
export function RoundSpine({ steps, accentVar }: { steps: SpineStep[]; accentVar: string }) {
  return (
    <aside
      aria-label="Stage progress"
      className="pointer-events-none fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 2xl:block"
    >
      <div className="pointer-events-auto relative flex flex-col items-stretch gap-0 border border-border/70 bg-surface-0/80 py-2 backdrop-blur-md slab-shadow">
        {/* connecting rail */}
        <span className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-white/[0.06]" aria-hidden />
        {steps.map((s) => {
          const isCurrent = s.status === "current";
          const isDone = s.status === "done";
          const color = isCurrent || isDone ? `var(${accentVar})` : "var(--border-strong)";
          return (
            <div key={s.key} className="relative flex items-center gap-2 px-2 py-2">
              <span
                className={cn(
                  "relative z-10 grid h-[14px] w-[14px] place-items-center border-2 transition-all",
                  isCurrent && "scale-110",
                )}
                style={{
                  borderColor: color,
                  background: isDone || isCurrent ? color : "var(--surface-0)",
                }}
              >
                {isCurrent && (
                  <span
                    className="absolute inset-[-6px] rounded-full opacity-30 blur-md"
                    style={{ background: color }}
                  />
                )}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "font-mono text-[9px] font-bold uppercase leading-none tracking-widest",
                    s.status === "future" && "text-muted-foreground/50",
                  )}
                  style={{
                    color: isCurrent || isDone ? undefined : undefined,
                  }}
                >
                  {s.label}
                </div>
                {s.sub && (
                  <div className="mt-0.5 font-mono text-[8px] uppercase leading-none tracking-wider text-muted-foreground/50">
                    {s.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
