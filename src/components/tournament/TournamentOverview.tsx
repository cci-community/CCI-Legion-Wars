import { ChevronRight, Users, Zap, Trophy, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  { key: "groups", label: "Groups", sub: "192 players", icon: Users, color: "titan" },
  { key: "wildcard", label: "Wildcard", sub: "12 → 4", icon: Zap, color: "wildcard" },
  { key: "finals", label: "Finals", sub: "16 players", icon: Trophy, color: "finals" },
  { key: "champion", label: "Champion", sub: "1 winner", icon: Crown, color: "finals" },
] as const;

export function TournamentOverview({ activeTab }: { activeTab: string }) {
  const activeKey =
    activeTab === "finals"
      ? "finals"
      : activeTab === "wildcard"
        ? "wildcard"
        : activeTab === "titan" || activeTab === "nexus" || activeTab === "dominion"
          ? "groups"
          : "";

  return (
    <div className="rounded-lg border border-border bg-panel/40">
      <div className="flex items-center gap-0 overflow-x-auto">
        {NODES.map((n, i) => {
          const isActive = n.key === activeKey;
          const Icon = n.icon;
          return (
            <div key={n.key} className="flex shrink-0 items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 transition-colors sm:px-4 sm:py-2.5",
                  isActive && `bg-${n.color}-soft`,
                )}
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={{
                    color: isActive ? `var(--${n.color})` : "var(--color-muted-foreground)",
                  }}
                />
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-[12px] font-semibold leading-tight tracking-tight",
                      isActive ? `text-${n.color}` : "text-foreground",
                    )}
                  >
                    {n.label}
                  </div>
                  <div className="font-mono text-[10px] leading-tight text-muted-foreground">
                    {n.sub}
                  </div>
                </div>
              </div>
              {i < NODES.length - 1 && (
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
