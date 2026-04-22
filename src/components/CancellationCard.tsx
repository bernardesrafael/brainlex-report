import {
  Gavel,
  Unlock,
  ShieldX,
  CircleAlert,
  FileText,
} from "lucide-react";
import type { CancellationVerdict, CancellationConfidence } from "@/components/CancellationBadge";

interface Evidence {
  source: string;
  quote: string;
}
interface Blocker {
  type: string;
  description: string;
}

interface Props {
  verdict: CancellationVerdict | null;
  confidence: CancellationConfidence | null;
  reasoning: string | null;
  blockers: Blocker[] | null;
  evidence: Evidence[] | null;
  analyzedAt: string | null;
  model: string | null;
}

const VERDICT_DISPLAY: Record<
  CancellationVerdict,
  { label: string; cls: string; Icon: typeof Unlock; wrap: string }
> = {
  cancelavel: {
    label: "APTO A CANCELAR",
    cls: "text-status-success",
    wrap: "border-status-success/40 bg-status-success/5",
    Icon: Unlock,
  },
  nao_cancelavel: {
    label: "NÃO CANCELÁVEL",
    cls: "text-destructive",
    wrap: "border-destructive/40 bg-destructive/5",
    Icon: ShieldX,
  },
  revisar: {
    label: "REVISAR MANUALMENTE",
    cls: "text-amber-600",
    wrap: "border-amber-500/40 bg-amber-500/5",
    Icon: CircleAlert,
  },
};

const CONF_CLS: Record<CancellationConfidence, string> = {
  alta: "text-status-success",
  media: "text-amber-600",
  baixa: "text-destructive",
};

export const CancellationCard = ({
  verdict,
  confidence,
  reasoning,
  blockers,
  evidence,
  analyzedAt,
  model,
}: Props) => {
  const hasResult = !!verdict;
  const cfg = hasResult && verdict ? VERDICT_DISPLAY[verdict] : null;

  return (
    <div
      className={`rounded-2xl p-5 border transition-colors ${
        cfg ? cfg.wrap : "glass-strong border-border/50"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-mono font-semibold">
            Parecer de cancelabilidade
          </h3>
          {analyzedAt ? (
            <span className="text-[10px] font-mono text-muted-foreground">
              · analisado {new Date(analyzedAt).toLocaleString("pt-BR")}
              {model ? ` · ${model.replace("google/", "")}` : ""}
            </span>
          ) : null}
        </div>
      </div>

      {!hasResult && (
        <p className="text-sm text-muted-foreground font-mono">
          Este processo ainda não tem parecer profundo. O agente operacional dispara a análise sob demanda.
        </p>
      )}

      {cfg && verdict && (
        <>
          <div className={`flex items-center gap-2 mb-3 ${cfg.cls}`}>
            <cfg.Icon className="w-6 h-6" />
            <span className="text-lg font-mono font-bold tracking-wide">
              {cfg.label}
            </span>
            {confidence ? (
              <span className={`text-xs font-mono ml-2 ${CONF_CLS[confidence]}`}>
                confiança: {confidence}
              </span>
            ) : null}
          </div>

          {reasoning ? (
            <p className="text-sm text-foreground/90 leading-relaxed mb-3">
              {reasoning}
            </p>
          ) : null}

          {blockers && blockers.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-destructive mb-1.5">
                Bloqueios
              </p>
              <ul className="space-y-1.5">
                {blockers.map((b, i) => (
                  <li
                    key={`${b.type}-${i}`}
                    className="text-xs font-mono text-foreground/90 pl-3 border-l-2 border-destructive/40"
                  >
                    <span className="text-destructive">[{b.type}]</span>{" "}
                    {b.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evidence && evidence.length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-1.5">
                Evidências
              </p>
              <ul className="space-y-1.5">
                {evidence.map((e, i) => (
                  <li
                    key={`${e.source}-${i}`}
                    className="text-xs font-mono text-foreground/80 pl-3 border-l-2 border-primary/30 flex gap-1.5"
                  >
                    <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" />
                    <span>
                      <span className="text-primary">{e.source}:</span>{" "}
                      <span className="italic">"{e.quote}"</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
