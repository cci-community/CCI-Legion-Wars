import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { findLobbyById } from "@/lib/tournament-helpers";
import type { TournamentData } from "@/lib/tournament-data";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { Copy, Check, ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATE_TO_TONE = {
  pending: "pending",
  advance: "advance",
  finals: "finals",
  wildcard: "wildcard",
  eliminated: "eliminated",
  live: "live",
} as const;

const DEST_LABEL = {
  advance: "Advances to next round",
  finals: "→ National Finals",
  wildcard: "→ Wildcard stage",
  eliminated: "Tournament run ended",
  live: "In progress",
  pending: "Awaiting result",
} as const;

export function LobbyDrawer({
  lobbyId,
  open,
  onOpenChange,
  data,
}: {
  lobbyId: string | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: TournamentData;
}) {
  const [copied, setCopied] = useState(false);
  const details = lobbyId ? findLobbyById(lobbyId, data) : null;

  const copyLink = () => {
    if (!lobbyId) return;
    const url = `${window.location.origin}${window.location.pathname}?view=${details?.group.short.toLowerCase()}&lobby=${lobbyId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied", { description: lobbyId });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md overflow-y-auto border-l border-border bg-surface-2 p-0 sm:max-w-md"
      >
        {details && (
          <div className="flex h-full flex-col">
            <SheetHeader className="space-y-3 border-b border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: `var(--${details.group.accent})` }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {details.group.label} · {details.roundTitle}
                  </span>
                </div>
                <StatusBadge
                  tone={
                    details.lobby.status === "Live"
                      ? "live"
                      : details.lobby.status === "Qualified"
                        ? "qualified"
                        : details.lobby.status === "Final"
                          ? "final"
                          : details.lobby.status === "Ready"
                            ? "ready"
                            : "pending"
                  }
                >
                  {details.lobby.status}
                </StatusBadge>
              </div>
              <SheetTitle className="flex items-center justify-between text-xl font-semibold tracking-tight">
                <code className="font-mono">{details.lobby.id}</code>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-surface-1 px-2 py-1 text-[11px] font-normal text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-advance" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy link"}</span>
                </button>
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 space-y-4 p-5">
              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Players ({details.lobby.players.length})
                </h3>
                <ul className="overflow-hidden rounded-lg border border-border bg-surface-1">
                  {details.lobby.players.map((p, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5",
                        i > 0 && "border-t border-border/60",
                        p.state === "eliminated" && "opacity-60",
                      )}
                    >
                      <div
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border font-mono text-[11px] font-semibold tabular-nums"
                        style={{
                          background: p.rank
                            ? `color-mix(in oklab, var(--${details.group.accent}) 12%, transparent)`
                            : undefined,
                          color: p.rank
                            ? `var(--${details.group.accent})`
                            : "var(--color-muted-foreground)",
                        }}
                      >
                        {p.rank ?? p.seed}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium tracking-tight">{p.name}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          <span className="truncate">
                            {p.city}
                            {p.region && ` · ${p.region}`}
                          </span>
                        </div>
                      </div>
                      {p.score != null && (
                        <div className="text-right">
                          <div className="font-mono text-lg font-semibold tabular-nums leading-none">
                            {p.score}
                          </div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                            score
                          </div>
                        </div>
                      )}
                      <StatusBadge tone={STATE_TO_TONE[p.state]}>{p.stateLabel}</StatusBadge>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Advancement
                </h3>
                <div className="space-y-1.5">
                  {details.lobby.players.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-1.5 text-xs"
                    >
                      <span className="w-4 font-mono text-[10px] text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          p.state === "finals" && "text-finals",
                          p.state === "wildcard" && "text-wildcard",
                          p.state === "advance" && "text-advance",
                          p.state === "eliminated" && "text-muted-foreground line-through",
                          p.state === "pending" && "text-muted-foreground italic",
                        )}
                      >
                        {DEST_LABEL[p.state]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
