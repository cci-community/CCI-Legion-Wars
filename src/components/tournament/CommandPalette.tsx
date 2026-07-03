import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { flattenPlayers, type ViewKey } from "@/lib/tournament-helpers";
import type { TournamentData } from "@/lib/tournament-data";
import { Trophy, Users, Zap, Layers, Search } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (opts: { view?: ViewKey; lobby?: string; match?: string }) => void;
  data: TournamentData;
}

const VIEWS: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "finals", label: "National Finals", icon: Trophy },
  { key: "titan", label: "Group Titan", icon: Users },
  { key: "nexus", label: "Group Nexus", icon: Users },
  { key: "dominion", label: "Group Dominion", icon: Users },
  { key: "wildcard", label: "Wildcard", icon: Zap },
];

export function CommandPalette({ open, onOpenChange, onNavigate, data }: Props) {
  const [query, setQuery] = useState("");
  const players = useMemo(() => flattenPlayers(data), [data]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Detect direct ID input (Titan_R2_L1, Finals_R16_M1)
  const idMatch = /^([A-Za-z]+_R\w+_[ML]\d+|Wildcard_\w+|Finals_\w+_M\d+)/i.test(query.trim());

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search players, cities, or jump to Titan_R2_L1…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1 py-4 text-xs">
            <Search className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-muted-foreground">No results for "{query}"</span>
          </div>
        </CommandEmpty>

        {idMatch && (
          <>
            <CommandGroup heading="Jump to">
              <CommandItem
                onSelect={() => {
                  const id = query.trim();
                  if (id.startsWith("Finals_")) {
                    onNavigate({ view: "finals", match: id });
                  } else if (id.startsWith("Wildcard_")) {
                    onNavigate({ view: "wildcard" });
                  } else {
                    const prefix = id.split("_")[0].toLowerCase() as ViewKey;
                    onNavigate({ view: prefix, lobby: id });
                  }
                  onOpenChange(false);
                }}
              >
                <Layers className="mr-2 h-4 w-4" />
                <span className="font-mono text-xs">{query.trim()}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Views">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <CommandItem
                key={v.key}
                value={`view ${v.label}`}
                onSelect={() => {
                  onNavigate({ view: v.key });
                  onOpenChange(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{v.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Players">
          {players.slice(0, 100).map((p) => (
            <CommandItem
              key={p.key}
              value={`${p.name} ${p.city} ${p.region ?? ""} ${p.location}`}
              onSelect={() => {
                onNavigate({
                  view: p.view,
                  lobby: p.lobbyId,
                  match: p.matchId,
                });
                onOpenChange(false);
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {p.city}
                      {p.region && ` · ${p.region}`}
                    </span>
                  </div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground/70">
                    {p.location}
                  </div>
                </div>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                  {p.state}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            <kbd>↑↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
        <span className="font-mono">{players.length} indexed</span>
      </div>
    </CommandDialog>
  );
}
