import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Briefcase } from "lucide-react";
import { MatrixRain } from "@/components/FuturisticEffects";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ScoreCard } from "@/components/ScoreCard";
import { CancellationCard } from "@/components/CancellationCard";
import type { CancellationVerdict, CancellationConfidence } from "@/components/CancellationBadge";
import { MovementTimeline } from "@/components/MovementTimeline";
import type {
  LawsuitMovementRow,
  LawsuitScoreFields,
  MovementTopSignal,
} from "@/types/movements";

interface LawsuitData {
  id: string;
  lawsuit_cnj: string | null;
  court: string | null;
  subject: string | null;
  status: string | null;
  amount: number | null;
  parties: unknown;
  movement_score: number | null;
  movement_criticality: "green" | "yellow" | "red" | null;
  movement_reasoning: string | null;
  movement_top_signals: MovementTopSignal[] | null;
  movement_scored_at: string | null;
  cancellation_verdict: CancellationVerdict | null;
  cancellation_confidence: CancellationConfidence | null;
  cancellation_reasoning: string | null;
  cancellation_blockers: Array<{ type: string; description: string }> | null;
  cancellation_evidence: Array<{ source: string; quote: string }> | null;
  cancellation_analyzed_at: string | null;
  cancellation_model: string | null;
}

interface PolicyRow {
  id: string;
  policy_number: string | null;
  insurer: string | null;
  coverage_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  guarantee_type: string | null;
}

interface SentenceRow {
  id: string;
  document_name: string;
  document_type: string | null;
  summary: string | null;
  outcome: string | null;
  is_termination: boolean | null;
  termination_type: string | null;
  release_confidence: string | null;
  release_reason: string | null;
  sentence_date: string | null;
}

const formatCurrency = (v: number | null) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function LawsuitDetailInner({ lawsuitId }: { lawsuitId: string }) {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["lawsuit-detail", lawsuitId],
    queryFn: async () => {
      const [lawsuitRes, movsRes, policiesRes, sentencesRes] = await Promise.all([
        (supabase as any)
          .from("lawsuits")
          .select(
            "id, lawsuit_cnj, court, subject, status, amount, parties, movement_score, movement_criticality, movement_reasoning, movement_top_signals, movement_scored_at, cancellation_verdict, cancellation_confidence, cancellation_reasoning, cancellation_blockers, cancellation_evidence, cancellation_analyzed_at, cancellation_model",
          )
          .eq("id", lawsuitId)
          .maybeSingle(),
        (supabase as any)
          .from("lawsuit_movements")
          .select(
            "id, lawsuit_id, step_id, source, movement_date, title, content, triggers_matched, highest_weight, raw, created_at",
          )
          .eq("lawsuit_id", lawsuitId)
          .order("movement_date", { ascending: false, nullsFirst: false }),
        supabase
          .from("insurance_policies")
          .select("id, policy_number, insurer, coverage_amount, start_date, end_date, guarantee_type")
          .eq("lawsuit_id", lawsuitId),
        supabase
          .from("lawsuit_sentences")
          .select("id, document_name, document_type, summary, outcome, is_termination, termination_type, release_confidence, release_reason, sentence_date")
          .eq("lawsuit_id", lawsuitId),
      ]);

      if (lawsuitRes.error) throw new Error(lawsuitRes.error.message);
      if (!lawsuitRes.data) throw new Error("Processo não encontrado");

      return {
        lawsuit: lawsuitRes.data as LawsuitData,
        movements: (movsRes.data ?? []) as LawsuitMovementRow[],
        policies: (policiesRes.data ?? []) as PolicyRow[],
        sentences: (sentencesRes.data ?? []) as SentenceRow[],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p className="text-sm text-destructive font-mono">
          {error instanceof Error ? error.message : "Processo não encontrado"}
        </p>
      </div>
    );
  }

  const { lawsuit, movements, policies, sentences } = data;
  const scoreFields: LawsuitScoreFields = {
    movement_score: lawsuit.movement_score,
    movement_criticality: lawsuit.movement_criticality,
    movement_reasoning: lawsuit.movement_reasoning,
    movement_top_signals: lawsuit.movement_top_signals,
    movement_scored_at: lawsuit.movement_scored_at,
  };

  return (
    <div className="space-y-6">
      {/* Header do processo */}
      <div className="glass-strong rounded-2xl p-5 border border-border/50">
        <div className="flex items-start gap-3 mb-3">
          <Briefcase className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-mono font-semibold break-all">
              {lawsuit.lawsuit_cnj ?? lawsuit.id}
            </h1>
            {lawsuit.subject ? (
              <p className="text-sm text-muted-foreground mt-1">{lawsuit.subject}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-muted-foreground">
          {lawsuit.court ? <span>Tribunal: {lawsuit.court}</span> : null}
          {lawsuit.status ? <span>Status: {lawsuit.status}</span> : null}
          <span>Valor: {formatCurrency(lawsuit.amount)}</span>
          <span>
            {movements.length} movimentação(ões) · {policies.length} apólice(s) · {sentences.length} sentença(s)
          </span>
        </div>
      </div>

      {/* Pontuação IA */}
      <ScoreCard
        lawsuitId={lawsuit.id}
        score={scoreFields}
        scoring={false}
      />

      {/* Parecer de cancelabilidade */}
      <CancellationCard
        verdict={lawsuit.cancellation_verdict}
        confidence={lawsuit.cancellation_confidence}
        reasoning={lawsuit.cancellation_reasoning}
        blockers={lawsuit.cancellation_blockers}
        evidence={lawsuit.cancellation_evidence}
        analyzedAt={lawsuit.cancellation_analyzed_at}
        model={lawsuit.cancellation_model}
      />

      {/* Apólices extraídas */}
      {policies.length > 0 ? (
        <div className="glass-strong rounded-2xl p-5 border border-border/50">
          <h3 className="text-sm font-mono font-semibold mb-3">
            Apólices extraídas ({policies.length})
          </h3>
          <ul className="space-y-2">
            {policies.map((p) => (
              <li key={p.id} className="text-sm font-mono text-foreground/80 leading-relaxed">
                <span className="text-primary">{p.policy_number ?? "s/ número"}</span>
                {p.insurer ? <span> · {p.insurer}</span> : null}
                {p.coverage_amount ? <span> · {formatCurrency(p.coverage_amount)}</span> : null}
                {p.end_date ? <span className="text-muted-foreground"> · vigência até {p.end_date.slice(0, 10)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Sentenças */}
      {sentences.length > 0 ? (
        <div className="glass-strong rounded-2xl p-5 border border-border/50">
          <h3 className="text-sm font-mono font-semibold mb-3">
            Sentenças e decisões ({sentences.length})
          </h3>
          <ul className="space-y-3">
            {sentences.map((s) => {
              const confColor =
                s.release_confidence === "alta"
                  ? "text-status-success"
                  : s.release_confidence === "media"
                    ? "text-amber-600"
                    : s.release_confidence === "baixa"
                      ? "text-destructive"
                      : "text-muted-foreground";
              return (
                <li key={s.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-0.5 text-xs font-mono text-muted-foreground flex-wrap">
                    {s.sentence_date ? <span>{s.sentence_date.slice(0, 10)}</span> : null}
                    {s.document_type ? <span>· {s.document_type}</span> : null}
                    {s.is_termination ? (
                      <span className="text-status-success">· finaliza processo</span>
                    ) : null}
                    {s.termination_type ? (
                      <span className="text-status-success">· {s.termination_type}</span>
                    ) : null}
                    {s.release_confidence ? (
                      <span className={confColor}>· liberação: {s.release_confidence}</span>
                    ) : null}
                  </div>
                  {s.outcome ? <p className="text-foreground/90 font-semibold">{s.outcome}</p> : null}
                  {s.summary ? <p className="text-foreground/80">{s.summary}</p> : null}
                  {s.release_reason ? (
                    <p className="text-xs text-muted-foreground/80 italic mt-1">
                      Avaliação IA: {s.release_reason}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Timeline de movimentações */}
      <div>
        <h3 className="text-sm font-mono font-semibold mb-3">Timeline de movimentações</h3>
        <MovementTimeline
          movements={movements}
          topSignals={lawsuit.movement_top_signals}
        />
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>
    </div>
  );
}

const LawsuitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <MatrixRain active={false} />
      <Header />
      <main className="relative z-10 container mx-auto px-6 pt-20 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {id ? (
          <LawsuitDetailInner lawsuitId={id} />
        ) : (
          <p className="text-center text-muted-foreground font-mono">ID não informado.</p>
        )}
      </main>
    </div>
  );
};

export default LawsuitDetail;
