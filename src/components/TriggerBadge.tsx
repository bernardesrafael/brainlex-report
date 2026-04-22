import { cn } from "@/lib/utils";
import { TRIGGER_CATEGORY_LABEL, type TriggerWeight } from "@/types/movements";

const WEIGHT_CLASSES: Record<TriggerWeight, string> = {
  critical: "bg-status-error/10 text-status-error border-status-error/20",
  high: "bg-status-warning/10 text-status-warning border-status-warning/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-muted",
};

interface Props {
  category: string;
  weight: TriggerWeight;
  className?: string;
}

export function TriggerBadge({ category, weight, className }: Props) {
  const label = TRIGGER_CATEGORY_LABEL[category] ?? category;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border",
        WEIGHT_CLASSES[weight],
        className,
      )}
      title={`${category} · ${weight}`}
    >
      {label}
    </span>
  );
}
