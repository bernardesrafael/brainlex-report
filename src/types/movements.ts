// Types das tabelas/colunas adicionadas nas migrations 20260422125548 e 20260422131954.
// Não estão no src/integrations/supabase/types.ts porque é auto-gerado pelo Supabase CLI
// e o schema ainda não foi re-exportado. Ao regenerar, estes podem ser removidos.

export type TriggerWeight = "low" | "medium" | "high" | "critical";
export type MovementSource = "judit" | "jusbrasil";
export type MovementCriticality = "green" | "yellow" | "red";

export interface TriggerMatch {
  category: string;
  weight: TriggerWeight;
}

export interface LawsuitMovementRow {
  id: string;
  lawsuit_id: string;
  step_id: string | null;
  source: MovementSource;
  movement_date: string | null;
  title: string | null;
  content: string;
  triggers_matched: TriggerMatch[];
  highest_weight: TriggerWeight | null;
  raw: unknown;
  created_at: string;
}

export interface MovementTopSignal {
  movement_id?: string;
  category?: string;
  quote: string;
}

// Extensão da tabela `lawsuits` com as colunas novas da Fase 3.
export interface LawsuitScoreFields {
  movement_score: number | null;
  movement_criticality: MovementCriticality | null;
  movement_reasoning: string | null;
  movement_top_signals: MovementTopSignal[] | null;
  movement_scored_at: string | null;
}

// Payload de resposta da Edge Function score-lawsuit-movements
export interface ScoreResult {
  score: number;
  criticality: MovementCriticality;
  reasoning: string;
  top_signals: MovementTopSignal[];
}

export interface ScoreInvokeResponse {
  ok: boolean;
  scored: number;
  total: number;
  results: Array<{
    lawsuit_id: string;
    ok: boolean;
    error?: string;
    score?: number;
    criticality?: MovementCriticality;
  }>;
}

// Rótulos legíveis para categorias de trigger (PT-BR)
export const TRIGGER_CATEGORY_LABEL: Record<string, string> = {
  apolice_seguro: "Apólice/Seguro",
  finalizacao: "Finalização",
  liberacao: "Liberação",
  cancelamento: "Cancelamento",
  penhora: "Penhora",
  execucao: "Execução",
};
