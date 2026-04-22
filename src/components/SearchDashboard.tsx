import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  ShieldCheck,
  ShieldX,
  Unlock,
  FileDown,
  Loader2,
  ChevronDown,
  ChevronRight,
  Gavel,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CriticalityBadge } from "@/components/CriticalityBadge";
import type { MovementCriticality } from "@/types/movements";
import {
  CancellationBadge,
  type CancellationVerdict,
  type CancellationConfidence,
} from "@/components/CancellationBadge";
import {
  isSentenceReleasable,
  isPolicyActive,
  canonicalPolicies,
  groupPoliciesByNumber,
  lawsuitPriority,
  classifyGuaranteeType,
  GUARANTEE_CATEGORY_LABEL,
  type PriorityResult,
  type GuaranteeCategory,
} from "@/lib/releasable";

interface SearchDashboardProps {
  searchId: string;
  cnpj: string;
  isLive?: boolean;
}

interface AnalysisJobRow {
  id: string;
  lawsuit_cnj: string;
  status: string;
  policies_found: number | null;
  sentences_found: number | null;
  analysis_source: string | null;
}

interface LawsuitRow {
  id: string;
  lawsuit_cnj: string | null;
  court: string | null;
  subject: string | null;
  status: string | null;
  amount: number | null;
  parties: any;
  movement_score?: number | null;
  movement_criticality?: MovementCriticality | null;
  cancellation_verdict?: CancellationVerdict | null;
  cancellation_confidence?: CancellationConfidence | null;
}

interface PolicyRow {
  id: string;
  lawsuit_id: string;
  policy_number: string | null;
  insurer: string | null;
  insured: string | null;
  insured_cnpj: string | null;
  coverage_amount: number | null;
  premium_amount: number | null;
  guarantee_type: string | null;
  guarantee_object: string | null;
  start_date: string | null;
  end_date: string | null;
  policy_type: string | null;
}

interface SentenceRow {
  id: string;
  lawsuit_id: string;
  document_name: string;
  document_type: string | null;
  summary: string;
  outcome: string | null;
  is_termination: boolean;
  termination_type: string | null;
  sentence_date: string | null;
  release_confidence: string | null;
  release_reason: string | null;
}

const formatCnpj = (cnpj: string) => {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const formatCurrency = (v: number | null) => {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
};

const ReleaseConfidenceBadge = ({ confidence }: { confidence: string | null }) => {
  if (!confidence) return null;
  const styles: Record<string, string> = {
    alta: "bg-status-success/10 text-status-success border-status-success/20",
    media: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    baixa: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const labels: Record<string, string> = {
    alta: "Liberação: alta",
    media: "Liberação: média",
    baixa: "Liberação: baixa",
  };
  const cls = styles[confidence] || "bg-muted text-muted-foreground border-border/30";
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${cls}`}>
      {labels[confidence] || confidence}
    </span>
  );
};

const GuaranteeCategoryBadge = ({ raw }: { raw: string | null }) => {
  if (!raw) return null;
  const cat = classifyGuaranteeType(raw);
  if (cat === "outros") return null;
  const styles: Record<Exclude<GuaranteeCategory, "outros">, string> = {
    recursal: "bg-primary/10 text-primary border-primary/20",
    judicial: "bg-status-warning/10 text-status-warning border-status-warning/20",
    cautelar: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${styles[cat]}`}
      title={raw}
    >
      {GUARANTEE_CATEGORY_LABEL[cat]}
    </span>
  );
};

const PolicyBadge = ({ endDate }: { endDate: string | null }) => {
  const active = isPolicyActive(endDate);
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
      active
        ? "bg-status-success/10 text-status-success border border-status-success/20"
        : "bg-muted text-muted-foreground border border-border/30"
    }`}>
      {active ? "Vigente" : "Vencida"}
    </span>
  );
};

const SourceBadge = ({ label, status, detail }: { label: string; status: "done" | "waiting" | "error"; detail?: string }) => {
  const styles = {
    done: "bg-status-success/10 text-status-success border-status-success/20",
    waiting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const icons = {
    done: <CheckCircle2 className="w-3 h-3" />,
    waiting: <Clock className="w-3 h-3 animate-pulse" />,
    error: <AlertCircle className="w-3 h-3" />,
  };
  const statusLabel = { done: "OK", waiting: "Aguardando", error: "Erro" };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border ${styles[status]}`}>
      {icons[status]}
      {label} — {statusLabel[status]}
      {detail && <span className="opacity-70">({detail})</span>}
    </span>
  );
};

export const SearchDashboard = ({ searchId, cnpj, isLive = false }: SearchDashboardProps) => {
  const [tabPage, setTabPage] = useState<Record<string, number>>({ without: 1, with: 1, releasable: 1, pending: 1 });
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showOnlyCancelable, setShowOnlyCancelable] = useState(false);
  const TAB_PAGE_SIZE = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", searchId],
    retry: 2,
    queryFn: async () => {
      const { data: jobs, error: jobsError } = await (supabase as any)
        .from("analysis_jobs")
        .select("id, lawsuit_cnj, status, policies_found, sentences_found, analysis_source")
        .eq("search_id", searchId);

      if (jobsError) throw new Error(`Erro ao carregar jobs: ${jobsError.message}`);

      const selectedCnjs = ((jobs ?? []) as AnalysisJobRow[]).map((j) => j.lawsuit_cnj);

      if (selectedCnjs.length === 0) {
        return { jobs: [], lawsuits: [], policies: [], sentences: [], search: null };
      }

      const lawsuitChunks: LawsuitRow[] = [];
      for (let i = 0; i < selectedCnjs.length; i += 500) {
        const chunk = selectedCnjs.slice(i, i + 500);
        const { data: lData } = await (supabase as any)
          .from("lawsuits")
          .select("id, lawsuit_cnj, court, subject, status, amount, parties, movement_score, movement_criticality, cancellation_verdict, cancellation_confidence")
          .eq("search_id", searchId)
          .in("lawsuit_cnj", chunk);
        if (lData) lawsuitChunks.push(...(lData as LawsuitRow[]));
      }

      const seenCnjs = new Set<string>();
      const lawsuits = lawsuitChunks.filter((l) => {
        const cnj = l.lawsuit_cnj || l.id;
        if (seenCnjs.has(cnj)) return false;
        seenCnjs.add(cnj);
        return true;
      });

      const [policiesRes, sentencesRes, searchRes] = await Promise.all([
        supabase.from("insurance_policies").select("id, lawsuit_id, policy_number, insurer, insured, insured_cnpj, coverage_amount, premium_amount, guarantee_type, guarantee_object, start_date, end_date, policy_type").eq("search_id", searchId),
        supabase.from("lawsuit_sentences").select("id, lawsuit_id, document_name, document_type, summary, outcome, is_termination, termination_type, sentence_date, release_confidence, release_reason").eq("search_id", searchId),
        supabase.from("searches").select("total_lawsuits, total_policies_found, total_sentences_found, created_at").eq("id", searchId).single(),
      ]);

      return {
        jobs: (jobs ?? []) as unknown as AnalysisJobRow[],
        lawsuits: lawsuits as LawsuitRow[],
        policies: (policiesRes.data ?? []) as PolicyRow[],
        sentences: (sentencesRes.data ?? []) as SentenceRow[],
        search: searchRes.data,
      };
    },
    refetchInterval: isLive ? 5000 : false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p className="text-sm text-destructive font-mono mb-2">Erro ao carregar dados do dashboard</p>
        <p className="text-xs text-muted-foreground font-mono">{error instanceof Error ? error.message : "Erro desconhecido"}</p>
      </div>
    );
  }

  const jobs = data?.jobs ?? [];
  const lawsuits = data?.lawsuits ?? [];
  const policies = data?.policies ?? [];
  const sentences = data?.sentences ?? [];

  const totalSelected = data?.search?.total_lawsuits || jobs.length;

  // Build maps
  const policiesByLawsuit = new Map<string, PolicyRow[]>();
  policies.forEach((p) => {
    const list = policiesByLawsuit.get(p.lawsuit_id) || [];
    list.push(p);
    policiesByLawsuit.set(p.lawsuit_id, list);
  });

  // Any termination (visual cue that there's a terminative decision, regardless of releasability)
  const terminatedLawsuitIds = new Set(
    sentences.filter((s) => s.is_termination).map((s) => s.lawsuit_id)
  );
  // Releasable = terminated AND the AI didn't rate the release as low-confidence
  // (procedente/interlocutória/condenação ativa with vigente guarantee get "baixa").
  const releasableLawsuitIds = new Set(
    sentences.filter(isSentenceReleasable).map((s) => s.lawsuit_id)
  );

  const sentencesByLawsuit = new Map<string, SentenceRow[]>();
  sentences.forEach((s) => {
    const list = sentencesByLawsuit.get(s.lawsuit_id) || [];
    list.push(s);
    sentencesByLawsuit.set(s.lawsuit_id, list);
  });

  // Review queue: lawsuits where ALL termination sentences were rated "baixa"
  // but the apólice is still active. Hard rule excludes them from Liberáveis,
  // yet there are plausible false-positives (e.g., archiving decisions that
  // don't explicitly mention the policy). Deserves human review.
  const reviewLawsuitIds = new Set<string>();
  for (const lid of terminatedLawsuitIds) {
    if (releasableLawsuitIds.has(lid)) continue; // already in Liberáveis
    const lSents = sentencesByLawsuit.get(lid) || [];
    const termSents = lSents.filter((s) => s.is_termination);
    if (termSents.length === 0) continue;
    const allBaixa = termSents.every((s) => s.release_confidence === "baixa");
    if (!allBaixa) continue;
    const lPols = policiesByLawsuit.get(lid) || [];
    const hasActive = canonicalPolicies(lPols).some((p) => isPolicyActive(p.end_date));
    if (hasActive) reviewLawsuitIds.add(lid);
  }

  // Job status maps for distinguishing analyzed vs pending
  const jobStatusByCnj = new Map<string, string>();
  jobs.forEach((j) => jobStatusByCnj.set(j.lawsuit_cnj, j.status));

  // Data source summary
  const partialCount = jobs.filter((j) => j.status === "partial").length;
  const completedBothCount = jobs.filter((j) => j.status === "completed" && j.analysis_source === "both").length;
  const completedJusbrasilOnly = jobs.filter((j) => j.status === "completed" && j.analysis_source !== "both").length;
  const hasPartials = partialCount > 0;

  // Categorize
  const withPolicy = lawsuits.filter((l) => policiesByLawsuit.has(l.id));
  const withoutPolicyAll = lawsuits.filter((l) => !policiesByLawsuit.has(l.id));

  // Split "without policy" into confirmed (job completed) vs pending (job not completed)
  const withoutPolicyConfirmed = withoutPolicyAll.filter((l) => {
    const status = jobStatusByCnj.get(l.lawsuit_cnj || "");
    return status === "completed";
  });
  const withoutPolicyPending = withoutPolicyAll.filter((l) => {
    const status = jobStatusByCnj.get(l.lawsuit_cnj || "");
    return status !== "completed"; // includes "partial" — still awaiting Judit
  });

  const releasable = withPolicy.filter((l) => releasableLawsuitIds.has(l.id));
  const reviewLawsuits = withPolicy.filter((l) => reviewLawsuitIds.has(l.id));
  const reviewCapital = reviewLawsuits.reduce((sum, l) => {
    const lPols = policiesByLawsuit.get(l.id) || [];
    return (
      sum +
      canonicalPolicies(lPols)
        .filter((p) => isPolicyActive(p.end_date))
        .reduce((s, p) => s + (p.coverage_amount || 0), 0)
    );
  }, 0);

  // Releasable policies — tied to a releasable lawsuit
  const releasablePolicies = policies.filter(
    (p) => releasableLawsuitIds.has(p.lawsuit_id)
  );

  // Only vigente policies count toward liberable capital — expired ones are
  // already past coverage and can't be cancelled.
  const activeReleasablePolicies = releasablePolicies.filter(
    (p) => isPolicyActive(p.end_date)
  );

  // Canonicalize: multiple rows with the same policy_number are endossos of
  // the same apólice — sum only the latest version to avoid double counting.
  const activeReleasableCanonicals = canonicalPolicies(activeReleasablePolicies);
  const releasableCanonicals = canonicalPolicies(releasablePolicies);

  // Priority score per lawsuit: capital_vigente × confidence_weight.
  // Computed once, reused for sorting and badges.
  const priorityByLawsuitId = new Map<string, PriorityResult>();
  for (const l of releasable) {
    const lPolicies = policiesByLawsuit.get(l.id) || [];
    const vigent = canonicalPolicies(lPolicies)
      .filter((p) => isPolicyActive(p.end_date))
      .reduce((s, p) => s + (p.coverage_amount || 0), 0);
    const lSentences = sentencesByLawsuit.get(l.id) || [];
    priorityByLawsuitId.set(l.id, lawsuitPriority(lSentences, vigent));
  }

  // Filter releasable by vigência + cancelável toggles, then sort by
  // cancelavel-first, then priority desc (puts the actionable cases at top).
  const filteredReleasable = releasable
    .filter((l) => {
      if (showOnlyActive) {
        const lPolicies = policiesByLawsuit.get(l.id) || [];
        if (!lPolicies.some((p) => isPolicyActive(p.end_date))) return false;
      }
      if (showOnlyCancelable && l.cancellation_verdict !== "cancelavel") return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      // cancelavel processes always come first
      const ca = a.cancellation_verdict === "cancelavel" ? 1 : 0;
      const cb = b.cancellation_verdict === "cancelavel" ? 1 : 0;
      if (ca !== cb) return cb - ca;
      const sa = priorityByLawsuitId.get(a.id)?.score ?? 0;
      const sb = priorityByLawsuitId.get(b.id)?.score ?? 0;
      return sb - sa;
    });

  const cancelableCount = releasable.filter((l) => l.cancellation_verdict === "cancelavel").length;
  const analyzedCount = releasable.filter((l) => l.cancellation_verdict).length;

  // Credit total: sum coverage_amount of vigente releasable canonicals only
  const releasableCredit = activeReleasableCanonicals.reduce(
    (sum, p) => sum + (p.coverage_amount || 0),
    0
  );

  // Breakdown by guarantee category (recursal / judicial / cautelar / outros).
  // Different modalities follow different release rules — surfacing the split
  // lets the user decide where to act first.
  const creditByCategory = new Map<GuaranteeCategory, number>();
  for (const p of activeReleasableCanonicals) {
    const cat = classifyGuaranteeType(p.guarantee_type);
    creditByCategory.set(cat, (creditByCategory.get(cat) || 0) + (p.coverage_amount || 0));
  }

  const exportCsv = () => {
    const cnjMap = new Map(lawsuits.map((l) => [l.id, l.lawsuit_cnj || ""]));
    const verdictLabels: Record<string, string> = {
      cancelavel: "Cancelável",
      nao_cancelavel: "Não cancelável",
      revisar: "Revisar",
    };
    const verdictByLawsuit = new Map(
      lawsuits.map((l) => [
        l.id,
        {
          verdict: l.cancellation_verdict ? verdictLabels[l.cancellation_verdict] ?? l.cancellation_verdict : "Não analisado",
          confidence: l.cancellation_confidence ?? "",
        },
      ]),
    );
    const termTypeMap = new Map<string, string>();
    const termDateMap = new Map<string, string>();
    sentences.filter((s) => s.is_termination).forEach((s) => {
      termTypeMap.set(s.lawsuit_id, s.termination_type || "Finalizado");
      if (s.sentence_date) termDateMap.set(s.lawsuit_id, s.sentence_date);
    });

    // Map each policy id → "Atual" / "Endosso X de N" so endossos are
    // audit-visible in the CSV without inflating the capital total.
    const versionLabelById = new Map<string, string>();
    for (const group of groupPoliciesByNumber(releasablePolicies)) {
      if (group.versions.length === 1) {
        versionLabelById.set(group.canonical.id, "Atual");
      } else {
        group.versions.forEach((v, idx) => {
          versionLabelById.set(
            v.id,
            idx === 0 ? `Atual (1 de ${group.versions.length})` : `Endosso anterior (${idx + 1} de ${group.versions.length})`,
          );
        });
      }
    }

    const header = "CNJ,Nº Apólice,Versão,Seguradora,Segurado,CNPJ Segurado,Valor Cobertura,Prêmio,Modalidade,Tipo Garantia,Objeto Garantia,Início Vigência,Fim Vigência,Status Vigência,Tipo Finalização,Data Sentença,Veredito,Confiança";
    const rows = releasablePolicies.map((p) => {
      const cnj = cnjMap.get(p.lawsuit_id) || "";
      const termType = termTypeMap.get(p.lawsuit_id) || "";
      const termDate = termDateMap.get(p.lawsuit_id) || "";
      const vigencia = isPolicyActive(p.end_date) ? "Vigente" : "Vencida";
      const v = verdictByLawsuit.get(p.lawsuit_id) || { verdict: "Não analisado", confidence: "" };
      return [
        cnj,
        p.policy_number || "",
        versionLabelById.get(p.id) || "Atual",
        p.insurer || "",
        p.insured || "",
        p.insured_cnpj || "",
        p.coverage_amount || "",
        p.premium_amount || "",
        GUARANTEE_CATEGORY_LABEL[classifyGuaranteeType(p.guarantee_type)],
        p.guarantee_type || "",
        p.guarantee_object || "",
        p.start_date || "",
        p.end_date || "",
        vigencia,
        termType,
        termDate,
        v.verdict,
        v.confidence,
      ].map((v) => `"${v}"`).join(",");
    });

    // Totals: raw-sum (all records including endossos) vs canonical-sum
    // (apólices únicas). Canonical-únicas-vigentes = actual liberable capital.
    const totalCoverage = releasablePolicies.reduce((s, p) => s + (p.coverage_amount || 0), 0);
    const totalPremium = releasablePolicies.reduce((s, p) => s + (p.premium_amount || 0), 0);
    const totalCoverageActive = activeReleasablePolicies.reduce((s, p) => s + (p.coverage_amount || 0), 0);
    const totalPremiumActive = activeReleasablePolicies.reduce((s, p) => s + (p.premium_amount || 0), 0);
    const totalCoverageCanonical = releasableCanonicals.reduce((s, p) => s + (p.coverage_amount || 0), 0);
    const totalPremiumCanonical = releasableCanonicals.reduce((s, p) => s + (p.premium_amount || 0), 0);
    const totalCoverageCanonicalActive = activeReleasableCanonicals.reduce((s, p) => s + (p.coverage_amount || 0), 0);
    const totalPremiumCanonicalActive = activeReleasableCanonicals.reduce((s, p) => s + (p.premium_amount || 0), 0);
    rows.push("");
    rows.push(`"TOTAL (linhas — soma bruta)","","","","","","${totalCoverage}","${totalPremium}","","","","","","","","","",""`);
    rows.push(`"TOTAL (linhas vigentes)","","","","","","${totalCoverageActive}","${totalPremiumActive}","","","","","","","","","",""`);
    rows.push(`"TOTAL (apólices únicas)","","","","","","${totalCoverageCanonical}","${totalPremiumCanonical}","","","","","","","","","",""`);
    rows.push(`"TOTAL (apólices únicas vigentes)","","","","","","${totalCoverageCanonicalActive}","${totalPremiumCanonicalActive}","","","","","","","","","",""`);

    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apolices-liberaveis-${cnpj.replace(/\D/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-6 mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-mono text-lg tracking-wide text-foreground">
                {formatCnpj(cnpj)}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                {data?.search?.created_at && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Pesquisa em {format(new Date(data.search.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {totalSelected} processo(s) selecionado(s)
                </span>
              </div>
              {jobs.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <SourceBadge
                    label="Brainlex Avançado"
                    status={hasPartials ? "waiting" : "done"}
                    detail={hasPartials ? `${partialCount} aguardando` : undefined}
                  />
                  <SourceBadge label="Brainlex" status="done" />
                </div>
              )}
            </div>
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                Ao Vivo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {releasablePolicies.length > 0 && (
              <Button onClick={exportCsv} variant="outline" className="gap-2 border-status-success/30 text-status-success hover:bg-status-success/10">
                <FileDown className="w-4 h-4" />
                Exportar liberáveis ({releasablePolicies.length})
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
      >
        <MetricCard icon={Briefcase} label="Selecionados" value={totalSelected} color="text-primary" />
        <MetricCard icon={ShieldCheck} label="Com Apólice" value={withPolicy.length} color="text-status-warning" />
        <MetricCard icon={ShieldX} label="Sem Apólice" value={withoutPolicyConfirmed.length} color="text-muted-foreground" subtitle={withoutPolicyPending.length > 0 ? `${withoutPolicyPending.length} pendente(s)` : undefined} />
        <MetricCard icon={Unlock} label="Liberáveis" value={releasable.length} color="text-status-success" highlight />
        <CreditCard value={releasableCredit} />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="releasable" className="w-full">
          <TabsList className="w-full justify-start bg-secondary/50 border border-border/30 mb-4 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="releasable" className="font-mono text-xs data-[state=active]:bg-background data-[state=active]:text-status-success">
              Liberáveis ({releasable.length})
            </TabsTrigger>
            {reviewLawsuits.length > 0 && (
              <TabsTrigger value="review" className="font-mono text-xs data-[state=active]:bg-background data-[state=active]:text-amber-600">
                Revisar ({reviewLawsuits.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="with" className="font-mono text-xs data-[state=active]:bg-background">
              Com Apólice ({withPolicy.length})
            </TabsTrigger>
            <TabsTrigger value="without" className="font-mono text-xs data-[state=active]:bg-background">
              Sem Apólice ({withoutPolicyConfirmed.length})
            </TabsTrigger>
            {withoutPolicyPending.length > 0 && (
              <TabsTrigger value="pending" className="font-mono text-xs data-[state=active]:bg-background data-[state=active]:text-status-warning">
                Pendentes ({withoutPolicyPending.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="releasable">
            {releasable.length === 0 ? (
              <EmptyState text="Nenhuma apólice liberável encontrada (processos com apólice + finalização)." />
            ) : (
              <div className="space-y-2">
                {/* Filter toggle */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <p className="text-xs text-muted-foreground font-mono">
                    {filteredReleasable.length} processo(s) • {formatCurrency(releasableCredit)} em capital vigente
                    {analyzedCount > 0 && (
                      <span className="opacity-70"> • {analyzedCount}/{releasable.length} analisados • {cancelableCount} canceláveis</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant={showOnlyCancelable ? "default" : "ghost"}
                      size="sm"
                      className="text-xs font-mono gap-1.5 h-7"
                      onClick={() => setShowOnlyCancelable(!showOnlyCancelable)}
                      disabled={cancelableCount === 0}
                      title={cancelableCount === 0 ? "Nenhum processo foi avaliado como cancelável ainda" : ""}
                    >
                      <Unlock className="w-3 h-3" />
                      Apenas canceláveis
                    </Button>
                    <Button
                      variant={showOnlyActive ? "default" : "ghost"}
                      size="sm"
                      className="text-xs font-mono gap-1.5 h-7"
                      onClick={() => setShowOnlyActive(!showOnlyActive)}
                    >
                      <Filter className="w-3 h-3" />
                      Apenas vigentes
                    </Button>
                  </div>
                </div>

                {creditByCategory.size > 1 && (
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-2">
                    <span className="text-muted-foreground">Por modalidade:</span>
                    {(["recursal", "judicial", "cautelar", "outros"] as GuaranteeCategory[])
                      .filter((c) => (creditByCategory.get(c) || 0) > 0)
                      .map((c) => (
                        <span
                          key={c}
                          className="px-1.5 py-0.5 rounded border bg-secondary/40 border-border/20"
                        >
                          {GUARANTEE_CATEGORY_LABEL[c]}: {formatCurrency(creditByCategory.get(c) || 0)}
                        </span>
                      ))}
                  </div>
                )}
                {filteredReleasable.slice(0, (tabPage.releasable || 1) * TAB_PAGE_SIZE).map((l) => (
                  <LawsuitWithPolicyRow
                    key={l.id}
                    lawsuit={l}
                    policies={policiesByLawsuit.get(l.id) || []}
                    terminated
                    sentences={sentencesByLawsuit.get(l.id) || []}
                    priority={priorityByLawsuitId.get(l.id)}
                  />
                ))}
                {(tabPage.releasable || 1) * TAB_PAGE_SIZE < filteredReleasable.length && (
                  <PaginationButton
                    shown={(tabPage.releasable || 1) * TAB_PAGE_SIZE}
                    total={filteredReleasable.length}
                    onMore={() => setTabPage((p) => ({ ...p, releasable: (p.releasable || 1) + 1 }))}
                  />
                )}
                <div className="pt-4 flex justify-end">
                  <Button onClick={exportCsv} className="gap-2 bg-status-success/15 text-status-success hover:bg-status-success/25 border border-status-success/30">
                    <FileDown className="w-4 h-4" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="review">
            {reviewLawsuits.length === 0 ? (
              <EmptyState text="Nenhum processo precisa de revisão manual." />
            ) : (
              <div className="space-y-2">
                <div className="glass rounded-lg p-3 border border-amber-500/20">
                  <p className="text-xs font-mono text-amber-600 leading-relaxed">
                    <strong>{reviewLawsuits.length} processo(s)</strong> com apólice vigente + sentença terminativa com <code>release_confidence=baixa</code>. O sistema considera não-canceláveis, mas podem ser <strong>falsos negativos</strong> — decisões de arquivamento nem sempre mencionam a apólice explicitamente, por exemplo. {formatCurrency(reviewCapital)} em capital vigente em revisão.
                  </p>
                </div>
                {reviewLawsuits.map((l) => (
                  <LawsuitWithPolicyRow
                    key={l.id}
                    lawsuit={l}
                    policies={policiesByLawsuit.get(l.id) || []}
                    terminated={terminatedLawsuitIds.has(l.id)}
                    sentences={sentencesByLawsuit.get(l.id) || []}
                    priority={priorityByLawsuitId.get(l.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="with">
            {withPolicy.length === 0 ? (
              <EmptyState text="Nenhuma apólice encontrada." />
            ) : (
              <div className="space-y-2">
                {withPolicy.slice(0, (tabPage.with || 1) * TAB_PAGE_SIZE).map((l) => (
                  <LawsuitWithPolicyRow
                    key={l.id}
                    lawsuit={l}
                    policies={policiesByLawsuit.get(l.id) || []}
                    terminated={terminatedLawsuitIds.has(l.id)}
                    sentences={sentencesByLawsuit.get(l.id) || []}
                  />
                ))}
                {(tabPage.with || 1) * TAB_PAGE_SIZE < withPolicy.length && (
                  <PaginationButton
                    shown={(tabPage.with || 1) * TAB_PAGE_SIZE}
                    total={withPolicy.length}
                    onMore={() => setTabPage((p) => ({ ...p, with: (p.with || 1) + 1 }))}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="without">
            {withoutPolicyConfirmed.length === 0 ? (
              <EmptyState text="Todos os processos analisados possuem apólice." />
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Processos analisados — confirmado que não possuem apólice
                </p>
                {withoutPolicyConfirmed.slice(0, (tabPage.without || 1) * TAB_PAGE_SIZE).map((l) => (
                  <LawsuitRow key={l.id} lawsuit={l} />
                ))}
                {(tabPage.without || 1) * TAB_PAGE_SIZE < withoutPolicyConfirmed.length && (
                  <PaginationButton
                    shown={(tabPage.without || 1) * TAB_PAGE_SIZE}
                    total={withoutPolicyConfirmed.length}
                    onMore={() => setTabPage((p) => ({ ...p, without: (p.without || 1) + 1 }))}
                  />
                )}
              </div>
            )}
          </TabsContent>

          {withoutPolicyPending.length > 0 && (
            <TabsContent value="pending">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Processos ainda em análise ou com erro
                </p>
                {withoutPolicyPending.slice(0, (tabPage.pending || 1) * TAB_PAGE_SIZE).map((l) => {
                  const status = jobStatusByCnj.get(l.lawsuit_cnj || "");
                  return (
                    <div key={l.id} className="glass rounded-lg p-3 flex items-center gap-3">
                      {status === "error" ? (
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-status-warning flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-foreground truncate">{l.lawsuit_cnj || "CNJ não identificado"}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.subject || l.court || ""}</p>
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        status === "error" ? "bg-destructive/10 text-destructive" : "bg-status-warning/10 text-status-warning"
                      }`}>
                        {status === "error" ? "Erro" : status === "pending" ? "Pendente" : "Em análise"}
                      </span>
                    </div>
                  );
                })}
                {(tabPage.pending || 1) * TAB_PAGE_SIZE < withoutPolicyPending.length && (
                  <PaginationButton
                    shown={(tabPage.pending || 1) * TAB_PAGE_SIZE}
                    total={withoutPolicyPending.length}
                    onMore={() => setTabPage((p) => ({ ...p, pending: (p.pending || 1) + 1 }))}
                  />
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
};

// ── Sub-components ──

const PaginationButton = ({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) => (
  <div className="pt-2 text-center">
    <Button variant="ghost" size="sm" onClick={onMore} className="text-xs font-mono text-muted-foreground">
      Mostrar mais ({shown}/{total})
    </Button>
  </div>
);

const MetricCard = ({
  icon: Icon,
  label,
  value,
  color,
  highlight,
  subtitle,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
  subtitle?: string;
}) => (
  <div
    className={`glass rounded-xl p-4 text-center border transition-colors ${
      highlight
        ? "border-status-success/30 shadow-[0_0_20px_-6px_hsl(var(--status-success)/0.3)]"
        : "border-border/20"
    }`}
  >
    <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
    <motion.p
      key={value}
      initial={{ scale: 1.3, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`text-2xl font-mono font-bold ${color}`}
    >
      {value}
    </motion.p>
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    {subtitle && <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{subtitle}</p>}
  </div>
);

const CreditCard = ({ value }: { value: number }) => (
  <div className="glass rounded-xl p-4 text-center border border-status-success/30 shadow-[0_0_20px_-6px_hsl(var(--status-success)/0.3)] col-span-2 md:col-span-1">
    <DollarSign className="w-5 h-5 mx-auto mb-2 text-status-success" />
    <motion.p
      key={value}
      initial={{ scale: 1.3, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="text-lg font-mono font-bold text-status-success"
    >
      {value > 0 ? formatCurrency(value) : "—"}
    </motion.p>
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Capital Liberável</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="glass rounded-lg p-8 text-center">
    <p className="text-sm text-muted-foreground font-mono">{text}</p>
  </div>
);

const LawsuitRow = ({ lawsuit }: { lawsuit: LawsuitRow }) => (
  <div className="glass rounded-lg p-3 flex items-center gap-3">
    <Gavel className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="font-mono text-sm text-foreground truncate">{lawsuit.lawsuit_cnj || "CNJ não identificado"}</p>
      <p className="text-xs text-muted-foreground truncate">{lawsuit.subject || lawsuit.court || ""}</p>
    </div>
    {lawsuit.amount && (
      <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
        {formatCurrency(lawsuit.amount)}
      </span>
    )}
  </div>
);

const PriorityBadge = ({ priority }: { priority: PriorityResult }) => {
  const { maxConfidence, score, weight } = priority;
  // Tier by weight. alta (1.0) → red/flame, media (0.5) → amber, null (0.7) → cyan.
  const label =
    maxConfidence === "alta"
      ? "Prioridade: alta"
      : maxConfidence === "media"
        ? "Prioridade: média"
        : "Prioridade: a revisar";
  const cls =
    weight >= 1.0
      ? "bg-status-success/15 text-status-success border-status-success/30"
      : weight >= 0.7
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return (
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${cls}`}
      title={`Score: ${formatCurrency(score)} (peso ${weight.toFixed(2)})`}
    >
      {label}
    </span>
  );
};

const PolicyGroupRow = ({
  group,
}: {
  group: { canonical: PolicyRow; versions: PolicyRow[]; endorsementCount: number };
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const { canonical, versions, endorsementCount } = group;
  return (
    <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/10">
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-mono text-xs text-status-warning truncate">
            {canonical.policy_number || "Nº não identificado"}
          </span>
          <PolicyBadge endDate={canonical.end_date} />
          <GuaranteeCategoryBadge raw={canonical.guarantee_type} />
          {endorsementCount > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              title="Endossos/versões anteriores detectados"
            >
              +{endorsementCount} endosso{endorsementCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
        <span className="font-mono text-xs text-foreground flex-shrink-0">
          {formatCurrency(canonical.coverage_amount)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
        {canonical.insurer && <span>Seguradora: {canonical.insurer}</span>}
        {canonical.insured && <span>Segurado: {canonical.insured}</span>}
        {canonical.insured_cnpj && <span>CNPJ: {canonical.insured_cnpj}</span>}
        {canonical.guarantee_type && <span>Tipo: {canonical.guarantee_type}</span>}
        {canonical.premium_amount && <span>Prêmio: {formatCurrency(canonical.premium_amount)}</span>}
        {canonical.guarantee_object && <span>Objeto: {canonical.guarantee_object}</span>}
      </div>
      {showHistory && endorsementCount > 0 && (
        <div className="mt-2 pt-2 border-t border-border/10 space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Versões anteriores
          </p>
          {versions.slice(1).map((v, idx) => (
            <div key={v.id} className="flex items-center justify-between gap-2 pl-2 border-l border-primary/20">
              <div className="flex items-center gap-2 min-w-0 text-[11px] text-muted-foreground font-mono">
                <span className="opacity-60">#{idx + 2}</span>
                <PolicyBadge endDate={v.end_date} />
                {v.start_date && <span>início {v.start_date}</span>}
                {v.end_date && <span>fim {v.end_date}</span>}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
                {formatCurrency(v.coverage_amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LawsuitWithPolicyRow = ({
  lawsuit,
  policies,
  terminated,
  sentences,
  priority,
}: {
  lawsuit: LawsuitRow;
  policies: PolicyRow[];
  terminated: boolean;
  sentences: SentenceRow[];
  priority?: PriorityResult;
}) => {
  const [expanded, setExpanded] = useState(false);
  const policyGroups = groupPoliciesByNumber(policies);
  // Sum canonicals only — endossos share the apólice and would double-count.
  const totalCoverage = policyGroups.reduce(
    (s, g) => s + (g.canonical.coverage_amount || 0),
    0,
  );
  const uniqueCount = policyGroups.length;

  return (
    <div
      className={`glass rounded-lg border transition-colors ${
        terminated ? "border-status-success/30" : "border-border/20"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors rounded-lg"
      >
        {terminated ? (
          <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-status-warning flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-foreground truncate">{lawsuit.lawsuit_cnj || "CNJ não identificado"}</p>
          <p className="text-xs text-muted-foreground truncate">{lawsuit.subject || lawsuit.court || ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {lawsuit.movement_criticality ? (
            <CriticalityBadge
              criticality={lawsuit.movement_criticality}
              score={lawsuit.movement_score}
            />
          ) : null}
          {priority && priority.score > 0 && (
            <PriorityBadge priority={priority} />
          )}
          <CancellationBadge
            verdict={lawsuit.cancellation_verdict ?? null}
            confidence={lawsuit.cancellation_confidence ?? null}
          />
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-status-warning/10 text-status-warning">
            {uniqueCount} apólice{uniqueCount !== 1 ? "s" : ""}
            {uniqueCount !== policies.length && (
              <span className="opacity-70 ml-1">({policies.length} c/ endossos)</span>
            )}
          </span>
          {totalCoverage > 0 && (
            <span className="text-xs font-mono text-foreground">
              {formatCurrency(totalCoverage)}
            </span>
          )}
          {terminated && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-status-success/10 text-status-success">
              Finalizado
            </span>
          )}
          <Link
            to={`/lawsuits/${lawsuit.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
            title="Abrir detalhes do processo"
          >
            detalhes
            <ExternalLink className="w-3 h-3" />
          </Link>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/20 px-3 pb-3 pt-2 space-y-2">
          {policyGroups.map((group) => (
            <PolicyGroupRow key={group.key} group={group} />
          ))}
          {sentences.filter((s) => s.is_termination).map((s) => {
            const releasable = isSentenceReleasable(s);
            const cardCls = releasable
              ? "bg-status-success/5 border-status-success/20"
              : "bg-destructive/5 border-destructive/20";
            const iconCls = releasable ? "text-status-success" : "text-destructive";
            return (
              <div key={s.id} className={`p-2.5 rounded-lg border ${cardCls}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <ShieldCheck className={`w-3.5 h-3.5 ${iconCls}`} />
                  <span className={`font-mono text-xs ${iconCls}`}>{s.termination_type || "Finalização"}</span>
                  {s.sentence_date && (
                    <span className="text-[10px] text-muted-foreground font-mono">({s.sentence_date})</span>
                  )}
                  <ReleaseConfidenceBadge confidence={s.release_confidence} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{s.summary}</p>
                {s.release_reason && (
                  <p className="text-[10px] text-muted-foreground/80 mt-1 italic line-clamp-2">
                    {s.release_reason}
                  </p>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
