import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TriggerBadge } from "./TriggerBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LawsuitMovementRow, MovementTopSignal } from "@/types/movements";

type FilterMode = "all" | "with_trigger" | "high_only";

interface Props {
  movements: LawsuitMovementRow[];
  topSignals?: MovementTopSignal[] | null;
}

const WEIGHT_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function sortByRelevance(a: LawsuitMovementRow, b: LawsuitMovementRow) {
  const ra = WEIGHT_ORDER[a.highest_weight ?? ""] ?? 0;
  const rb = WEIGHT_ORDER[b.highest_weight ?? ""] ?? 0;
  if (ra !== rb) return rb - ra;
  const da = a.movement_date ? Date.parse(a.movement_date) : 0;
  const db = b.movement_date ? Date.parse(b.movement_date) : 0;
  return db - da;
}

function sortByDate(a: LawsuitMovementRow, b: LawsuitMovementRow) {
  const da = a.movement_date ? Date.parse(a.movement_date) : 0;
  const db = b.movement_date ? Date.parse(b.movement_date) : 0;
  return db - da;
}

export function MovementTimeline({ movements, topSignals }: Props) {
  const [filter, setFilter] = useState<FilterMode>("with_trigger");
  const [sortBy, setSortBy] = useState<"date" | "relevance">("date");

  const topSignalIds = useMemo(
    () => new Set((topSignals ?? []).map((s) => s.movement_id).filter(Boolean) as string[]),
    [topSignals],
  );

  const filtered = useMemo(() => {
    const arr = movements.filter((m) => {
      if (filter === "all") return true;
      if (filter === "with_trigger") return m.highest_weight !== null;
      if (filter === "high_only") return m.highest_weight === "high" || m.highest_weight === "critical";
      return true;
    });
    return arr.slice().sort(sortBy === "relevance" ? sortByRelevance : sortByDate);
  }, [movements, filter, sortBy]);

  if (!movements.length) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">Nenhuma movimentação registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 text-xs font-mono">
          {(["all", "with_trigger", "high_only"] as FilterMode[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              onClick={() => setFilter(f)}
              className="h-7"
            >
              {f === "all"
                ? `Todas (${movements.length})`
                : f === "with_trigger"
                  ? "Com trigger"
                  : "Alto/Crítico"}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-1 text-xs font-mono">
          <Button
            size="sm"
            variant={sortBy === "date" ? "default" : "ghost"}
            onClick={() => setSortBy("date")}
            className="h-7"
          >
            Data
          </Button>
          <Button
            size="sm"
            variant={sortBy === "relevance" ? "default" : "ghost"}
            onClick={() => setSortBy("relevance")}
            className="h-7"
          >
            Relevância
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((m) => {
          const isTop = topSignalIds.has(m.id);
          const date = m.movement_date ? format(new Date(m.movement_date), "dd/MM/yyyy", { locale: ptBR }) : "s/ data";
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl p-3 glass-strong border transition-colors",
                isTop
                  ? "border-primary/50 ring-1 ring-primary/30"
                  : "border-border/50",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>{date}</span>
                  <span className="opacity-50">·</span>
                  <span className="opacity-70">{m.source === "judit" ? "Brainlex Avançado" : "Brainlex"}</span>
                  {isTop ? (
                    <>
                      <span className="opacity-50">·</span>
                      <span className="text-primary">sinal decisivo</span>
                    </>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {m.triggers_matched.map((t, i) => (
                    <TriggerBadge key={`${t.category}-${t.weight}-${i}`} category={t.category} weight={t.weight} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                {m.content}
              </p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-strong rounded-2xl p-6 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            Nenhuma movimentação no filtro atual.
          </p>
        </div>
      ) : null}
    </div>
  );
}
