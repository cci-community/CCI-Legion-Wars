import { cn } from "@/lib/utils";

type Tone =
  | "pending"
  | "ready"
  | "live"
  | "final"
  | "advance"
  | "finals"
  | "wildcard"
  | "eliminated"
  | "qualified";

const TONE: Record<Tone, string> = {
  pending: "bg-muted/40 text-muted-foreground",
  ready: "bg-titan-soft text-titan",
  live: "bg-[color-mix(in_oklab,var(--live)_15%,transparent)] text-live",
  final: "bg-muted/50 text-foreground/70",
  advance: "bg-[color-mix(in_oklab,var(--advance)_15%,transparent)] text-advance",
  qualified: "bg-[color-mix(in_oklab,var(--advance)_15%,transparent)] text-advance",
  finals: "bg-finals-soft text-finals",
  wildcard: "bg-wildcard-soft text-wildcard",
  eliminated: "bg-muted/30 text-muted-foreground",
};

export function StatusBadge({
  tone,
  children,
  className,
  dot = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  const showDot = dot || tone === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider tabular-nums",
        TONE[tone],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "inline-block h-1 w-1 rounded-full",
            tone === "live" && "bg-live live-dot",
            tone === "advance" && "bg-advance",
            tone === "finals" && "bg-finals",
            tone === "wildcard" && "bg-wildcard",
            tone === "ready" && "bg-titan",
          )}
        />
      )}
      {children}
    </span>
  );
}
