import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { findMatchById } from "@/lib/tournament-helpers";
import type { TournamentData } from "@/lib/tournament-data";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { Copy, Check, Trophy, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MatchDrawer({
  matchId,
  open,
  onOpenChange,
  data,
}: {
  matchId: string | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: TournamentData;
}) {
  const [copied, setCopied] = useState(false);
  const details = matchId ? findMatchById(matchId, data) : null;

  const copyLink = () => {
    if (!matchId) return;
    const url = `${window.location.origin}${window.location.pathname}?view=finals&match=${matchId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied", { description: matchId });
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
                  <Trophy className="h-3 w-3 text-finals" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Nationals · {details.roundTitle}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                    Bo{details.match.bestOf}
                  </span>
                  <StatusBadge
                    tone={
                      details.match.status === "live"
                        ? "live"
                        : details.match.status === "final"
                          ? "final"
                          : details.match.status === "ready"
                            ? "ready"
                            : "pending"
                    }
                  >
                    {details.match.status}
                  </StatusBadge>
                </div>
              </div>
              <SheetTitle className="flex items-center justify-between text-xl font-semibold tracking-tight">
                <code className="font-mono">{details.match.id}</code>
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
              {/* Score card */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-lg border border-border bg-surface-1 p-4">
                {details.match.entrants.map((e, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center",
                      i === 0 ? "" : "order-3",
                      e.pending && "opacity-50",
                    )}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      Seed {e.seed}
                    </div>
                    <div
                      className={cn(
                        "mt-1 truncate text-sm font-semibold tracking-tight",
                        e.winner && "text-finals",
                        e.pending && "italic text-muted-foreground",
                      )}
                    >
                      {e.name}
                    </div>
                    {e.city && (
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        {e.city}
                      </div>
                    )}
                    <div
                      className={cn(
                        "mt-2 font-mono text-4xl font-bold tabular-nums leading-none",
                        e.score == null && "text-muted-foreground/30",
                        e.winner && "text-finals",
                      )}
                    >
                      {e.score ?? "–"}
                    </div>
                  </div>
                ))}
                <div className="order-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  vs
                </div>
              </div>

              {/* Game strip */}
              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Games · Best of {details.match.bestOf}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: details.match.bestOf }, (_, gi) => {
                    const played =
                      details.match.status !== "pending" &&
                      details.match.status !== "ready" &&
                      gi <
                        (details.match.entrants[0].score ?? 0) +
                          (details.match.entrants[1].score ?? 0);
                    return (
                      <div
                        key={gi}
                        className={cn(
                          "rounded-md border px-2 py-2 text-center",
                          played
                            ? "border-border-strong bg-surface-1"
                            : "border-dashed border-border bg-surface-1/50",
                        )}
                      >
                        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                          Game {gi + 1}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-xs font-medium",
                            played ? "text-foreground" : "text-muted-foreground/60 italic",
                          )}
                        >
                          {played ? "Played" : "Upcoming"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Path */}
              <section>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Path
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground">Source</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-muted-foreground">
                      {details.roundTitle === "Round of 16"
                        ? "Group qualifier + Wildcard slot"
                        : `Winner of previous ${details.roundTitle === "Grand Final" ? "SF" : "match"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-xs">
                    <span className="font-mono text-[10px] text-muted-foreground">Next</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    <span
                      className={cn(
                        details.roundTitle === "Grand Final"
                          ? "font-medium text-finals"
                          : "text-muted-foreground",
                      )}
                    >
                      {details.roundTitle === "Grand Final"
                        ? "Winner is Champion"
                        : "Winner advances"}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
