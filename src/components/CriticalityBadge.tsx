import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MovementCriticality } from "@/types/movements";

interface Props {
  criticality: MovementCriticality | null;
  score?: number | null;
  className?: string;
}

const CONFIG: Record<
  MovementCriticality,
  { label: string; icon: typeof AlertCircle; classes: string }
> = {
  red: {
    label: "Crítica",
    icon: AlertCircle,
    classes: "bg-status-error/10 text-status-error border-status-error/20",
  },
  yellow: {
    label: "Atenção",
    icon: AlertTriangle,
    classes: "bg-status-warning/10 text-status-warning border-status-warning/20",
  },
  green: {
    label: "Baixa",
    icon: CheckCircle2,
    classes: "bg-status-success/10 text-status-success border-status-success/20",
  },
};

export function CriticalityBadge({ criticality, score, className }: Props) {
  if (!criticality) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono border border-muted text-muted-foreground",
          className,
        )}
      >
        não pontuado
      </span>
    );
  }
  const { label, icon: Icon, classes } = CONFIG[criticality];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono border",
        classes,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
      {typeof score === "number" ? <span className="opacity-70">· {score}</span> : null}
    </span>
  );
}
