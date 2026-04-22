import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { CriticalityBadge } from "./CriticalityBadge";
import type { LawsuitScoreFields, MovementTopSignal } from "@/types/movements";

interface Props {
  lawsuitId: string;
  score: LawsuitScoreFields;
  scoring?: boolean;
}

export function ScoreCard({ score }: Props) {
  const {
    movement_score,
    movement_criticality,
    movement_reasoning,
    movement_top_signals,
    movement_scored_at,
  } = score;

  const isScored = movement_score !== null;
  const signals = (movement_top_signals ?? []) as MovementTopSignal[];
  const scoredAt = movement_scored_at
    ? format(new Date(movement_scored_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="glass-strong rounded-2xl p-5 border border-border/50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-mono font-semibold">Pontuação por IA</h3>
        </div>
      </div>

      {isScored ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <CriticalityBadge
              criticality={movement_criticality}
              score={movement_score ?? undefined}
            />
            {scoredAt ? (
              <span className="text-xs text-muted-foreground font-mono">em {scoredAt}</span>
            ) : null}
          </div>

          {movement_reasoning ? (
            <p className="text-sm text-foreground/90 leading-relaxed mb-4">
              {movement_reasoning}
            </p>
          ) : null}

          {signals.length > 0 ? (
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-mono text-muted-foreground mb-2">
                Sinais decisivos ({signals.length})
              </p>
              <ul className="space-y-2">
                {signals.map((s, i) => (
                  <li key={i} className="text-sm">
                    {s.category ? (
                      <span className="text-xs text-primary font-mono mr-2">
                        [{s.category}]
                      </span>
                    ) : null}
                    <span className="text-foreground/80">"{s.quote}"</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Processo ainda não foi pontuado pela IA. A pontuação é disparada pelo agente operacional.
        </p>
      )}
    </div>
  );
}
