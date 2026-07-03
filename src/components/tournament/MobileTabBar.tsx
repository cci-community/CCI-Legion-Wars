import { cn } from "@/lib/utils";
import { Trophy, Users, Zap, Map } from "lucide-react";
import type { ViewKey } from "@/lib/tournament-helpers";

type TabKey = ViewKey | "overview";

const TABS: {
  key: TabKey;
  label: string;
  accent: string;
  icon: React.ElementType;
}[] = [
  { key: "overview", label: "Map", accent: "finals", icon: Map },
  { key: "titan", label: "Titan", accent: "titan", icon: Users },
  { key: "nexus", label: "Nexus", accent: "nexus", icon: Users },
  { key: "dominion", label: "Dom", accent: "dominion", icon: Users },
  { key: "wildcard", label: "Wild", accent: "wildcard", icon: Zap },
  { key: "finals", label: "Finals", accent: "finals", icon: Trophy },
];

export function MobileTabBar({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-6">
        {TABS.map((t) => {
          const active = value === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium uppercase tracking-wider transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
              style={active ? { color: `var(--${t.accent})` } : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="tracking-tight">{t.label}</span>
              {active && (
                <span
                  className="absolute top-0 h-[2px] w-8"
                  style={{ background: `var(--${t.accent})` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
