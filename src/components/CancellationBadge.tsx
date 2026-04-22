import { Unlock, ShieldX, CircleAlert } from "lucide-react";

export type CancellationVerdict = "cancelavel" | "nao_cancelavel" | "revisar";
export type CancellationConfidence = "alta" | "media" | "baixa";

interface Props {
  verdict: CancellationVerdict | null | undefined;
  confidence?: CancellationConfidence | null;
  className?: string;
}

/**
 * Compact pill used in list views (SearchDashboard, Historico) to surface
 * the deep-analysis verdict at a glance. Renders nothing if the lawsuit
 * has not been analyzed yet.
 */
export const CancellationBadge = ({ verdict, confidence, className = "" }: Props) => {
  if (!verdict) return null;

  const config: Record<
    CancellationVerdict,
    { label: string; cls: string; Icon: typeof Unlock }
  > = {
    cancelavel: {
      label: "Cancelável",
      cls: "bg-status-success/15 text-status-success border-status-success/30",
      Icon: Unlock,
    },
    nao_cancelavel: {
      label: "Não cancelável",
      cls: "bg-destructive/10 text-destructive border-destructive/30",
      Icon: ShieldX,
    },
    revisar: {
      label: "Revisar",
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      Icon: CircleAlert,
    },
  };
  const { label, cls, Icon } = config[verdict];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${cls} ${className}`}
      title={confidence ? `Parecer: ${label} · Confiança: ${confidence}` : `Parecer: ${label}`}
    >
      <Icon className="w-3 h-3" />
      {label}
      {confidence ? (
        <span className="opacity-70">· {confidence}</span>
      ) : null}
    </span>
  );
};
