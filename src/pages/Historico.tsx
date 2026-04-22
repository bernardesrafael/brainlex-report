import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MatrixRain } from "@/components/FuturisticEffects";
import { Header } from "@/components/Header";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  Loader2,
  LayoutDashboard,
  Download,
  Shield,
  Scale,
  Building,
  User,
  Calendar,
  DollarSign,
  Hash,
  Gavel,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  isSentenceReleasable,
  isPolicyActive as isPolicyActiveLib,
  canonicalPolicies,
  groupPoliciesByNumber,
  classifyGuaranteeType,
  GUARANTEE_CATEGORY_LABEL,
  type GuaranteeCategory,
} from "@/lib/releasable";

interface SearchRow {
  id: string;
  cnpj: string;
  status: string;
  total_lawsuits: number | null;
  total_policies_found: number | null;
  total_sentences_found: number | null;
  created_at: string;
  date_from: string | null;
  date_to: string | null;
}

interface CompanyData {
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  uf: string;
  municipio: string;
  atividade_principal: string;
}

interface LawsuitRow {
  id: string;
  lawsuit_cnj: string | null;
  court: string | null;
  subject: string | null;
}

interface PolicyRow {
  id: string;
  lawsuit_id: string;
  policy_number: string | null;
  insurer: string | null;
  insured: string | null;
  insured_cnpj: string | null;
  beneficiary: string | null;
  coverage_amount: number | null;
  premium_amount: number | null;
  policy_type: string | null;
  coverage_type: string | null;
  start_date: string | null;
  end_date: string | null;
  guarantee_type: string | null;
  guarantee_object: string | null;
  contract_reference: string | null;
  court_order_reference: string | null;
}

interface SentenceRow {
  id: string;
  lawsuit_id: string;
  document_name: string;
  document_type: string | null;
  document_url: string | null;
  outcome: string | null;
  summary: string;
  sentence_date: string | null;
  judge_name: string | null;
  is_termination: boolean;
  termination_type: string | null;
  release_confidence: string | null;
  release_reason: string | null;
  key_points: any;
}

const formatCnpj = (cnpj: string) => {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatCurrency = (value: number | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
};

const isPolicyActive = isPolicyActiveLib;

const Historico = () => {
  const { data: searches, isLoading } = useQuery({
    queryKey: ["search-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("searches")
        .select("id, cnpj, status, total_lawsuits, total_policies_found, total_sentences_found, created_at, date_from, date_to")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SearchRow[];
    },
  });

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <MatrixRain active={false} />
      <Header />

      <main className="relative z-10 container mx-auto px-6 pt-20 pb-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-10">
          <h1 className="brain-logo text-2xl tracking-wider text-cyan-400 mb-2">
            Relatórios
          </h1>
          <p className="text-sm text-cyan-500/40 font-mono">
            Pesquisas anteriores — processos, apólices e sentenças agrupados por CNJ
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : !searches?.length ? (
          <div className="glass-strong rounded-lg p-8 text-center max-w-md mx-auto">
            <Clock className="w-8 h-8 text-cyan-500/40 mx-auto mb-3" />
            <p className="text-cyan-500/40 font-mono">Nenhuma pesquisa realizada ainda.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {searches.map((search, i) => (
              <SearchCard key={search.id} search={search} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const SearchCard = ({ search, index }: { search: SearchRow; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const hasPolicies = (search.total_policies_found ?? 0) > 0;
  const statusDone = search.status === "completed" || search.status === "done";

  // Fetch company info from BrasilAPI when expanded
  const { data: companyData } = useQuery({
    queryKey: ["company-info", search.cnpj],
    queryFn: async () => {
      const digits = search.cnpj.replace(/\D/g, "");
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) return null;
      const d = await res.json();
      return {
        razao_social: d.razao_social || "",
        nome_fantasia: d.nome_fantasia || "",
        situacao: d.descricao_situacao_cadastral || "",
        uf: d.uf || "",
        municipio: d.municipio || "",
        atividade_principal: d.cnae_fiscal_descricao || (d.cnaes_secundarios?.[0]?.descricao) || "",
      } as CompanyData;
    },
    enabled: expanded,
    staleTime: 1000 * 60 * 30, // cache 30min
  });

  const dateRange = (() => {
    if (search.date_from && search.date_to) {
      return `Atividade: ${formatDate(search.date_from)} a ${formatDate(search.date_to)}`;
    }
    if (search.date_from) return `Atividade a partir de ${formatDate(search.date_from)}`;
    if (search.date_to) return `Atividade até ${formatDate(search.date_to)}`;
    return "Sem filtro de período";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className={`glass rounded-lg border transition-colors ${
        hasPolicies ? "border-status-success/20" : "border-border/30"
      }`}
    >
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors rounded-l-lg"
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            hasPolicies ? "bg-status-success shadow-[0_0_6px_hsl(var(--status-success)/0.6)]" :
            statusDone ? "bg-primary/40" : "bg-primary animate-pulse"
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-6">
              <span className="font-mono text-sm text-foreground">{formatCnpj(search.cnpj)}</span>
              {companyData?.razao_social && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">{companyData.razao_social}</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {format(new Date(search.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-xs font-mono text-muted-foreground">{search.total_lawsuits ?? 0} proc.</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              hasPolicies ? "bg-status-success/10 text-status-success" : "bg-secondary text-muted-foreground"
            }`}>
              {search.total_policies_found ?? 0} apólice{(search.total_policies_found ?? 0) !== 1 ? "s" : ""}
            </span>
            {(search.total_sentences_found ?? 0) > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-status-warning/10 text-status-warning">
                {search.total_sentences_found} sentença{(search.total_sentences_found ?? 0) !== 1 ? "s" : ""}
              </span>
            )}
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
        {statusDone && (
          <button
            onClick={() => navigate(`/dashboard/${search.id}`)}
            className="p-4 hover:bg-secondary/30 transition-colors rounded-r-lg border-l border-border/20"
            title="Abrir Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/20">
          {/* Company & Analysis Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="rounded-lg bg-secondary/20 border border-border/20 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-mono text-sm font-bold text-foreground truncate">
                      {companyData?.razao_social || formatCnpj(search.cnpj)}
                    </h3>
                  </div>
                  {companyData?.nome_fantasia && companyData.nome_fantasia !== companyData.razao_social && (
                    <p className="text-xs text-muted-foreground ml-6 truncate">{companyData.nome_fantasia}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 ml-6">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      CNPJ: {formatCnpj(search.cnpj)}
                    </span>
                    {companyData?.municipio && companyData?.uf && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {companyData.municipio}/{companyData.uf}
                      </span>
                    )}
                    {companyData?.situacao && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        companyData.situacao.toLowerCase().includes("ativa")
                          ? "bg-status-success/10 text-status-success"
                          : "bg-status-warning/10 text-status-warning"
                      }`}>
                        {companyData.situacao}
                      </span>
                    )}
                  </div>
                  {companyData?.atividade_principal && (
                    <p className="text-[11px] text-muted-foreground ml-6 mt-1 truncate">
                      {companyData.atividade_principal}
                    </p>
                  )}
                </div>

                {/* Analysis Metadata */}
                <div className="flex-shrink-0 sm:text-right space-y-1">
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Análise: {format(new Date(search.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Período: {dateRange}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {search.total_lawsuits ?? 0} processos • {search.total_policies_found ?? 0} apólices • {search.total_sentences_found ?? 0} sentenças
                    </span>
                  </div>
                  <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded mt-1 ${
                    statusDone
                      ? "bg-status-success/10 text-status-success"
                      : "bg-status-warning/10 text-status-warning"
                  }`}>
                    {statusDone ? "Concluída" : search.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed results */}
          <ExpandedDetails searchId={search.id} />
        </div>
      )}
    </motion.div>
  );
};

const ExpandedDetails = ({ searchId }: { searchId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["search-details-grouped", searchId],
    queryFn: async () => {
      const [lawsuitsRes, policiesRes, sentencesRes] = await Promise.all([
        supabase.from("lawsuits").select("id, lawsuit_cnj, court, subject").eq("search_id", searchId).order("created_at", { ascending: true }),
        supabase.from("insurance_policies").select("id, lawsuit_id, policy_number, insurer, insured, insured_cnpj, beneficiary, coverage_amount, premium_amount, policy_type, coverage_type, start_date, end_date, guarantee_type, guarantee_object, contract_reference, court_order_reference").eq("search_id", searchId),
        supabase.from("lawsuit_sentences").select("id, lawsuit_id, document_name, document_type, document_url, outcome, summary, sentence_date, judge_name, is_termination, termination_type, release_confidence, release_reason, key_points").eq("search_id", searchId),
      ]);
      return {
        lawsuits: (lawsuitsRes.data ?? []) as LawsuitRow[],
        policies: (policiesRes.data ?? []) as PolicyRow[],
        sentences: (sentencesRes.data ?? []) as SentenceRow[],
      };
    },
  });

  if (isLoading) return <div className="px-4 pb-4 flex justify-center"><Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /></div>;

  const lawsuits = data?.lawsuits ?? [];
  const policies = data?.policies ?? [];
  const sentencesList = data?.sentences ?? [];

  // Build maps by lawsuit_id
  const policiesByLawsuit = new Map<string, PolicyRow[]>();
  policies.forEach((p) => {
    const list = policiesByLawsuit.get(p.lawsuit_id) || [];
    list.push(p);
    policiesByLawsuit.set(p.lawsuit_id, list);
  });

  const sentencesByLawsuit = new Map<string, SentenceRow[]>();
  sentencesList.forEach((s) => {
    const list = sentencesByLawsuit.get(s.lawsuit_id) || [];
    list.push(s);
    sentencesByLawsuit.set(s.lawsuit_id, list);
  });

  // Only show lawsuits that have policies or sentences
  const relevantLawsuits = lawsuits.filter(
    (l) => policiesByLawsuit.has(l.id) || sentencesByLawsuit.has(l.id)
  );

  // Summary metrics — sum canonicals only; multiple rows with the same
  // policy_number are endossos of one apólice and would double-count.
  const canonicalAll = canonicalPolicies(policies);
  const totalCoverage = canonicalAll.reduce((s, p) => s + (p.coverage_amount || 0), 0);
  const uniqueCount = canonicalAll.length;
  const releasableIds = new Set(sentencesList.filter(isSentenceReleasable).map((s) => s.lawsuit_id));
  const releasablePolicies = policies.filter((p) => releasableIds.has(p.lawsuit_id));
  const releasableCanonicalActive = canonicalPolicies(releasablePolicies)
    .filter((p) => isPolicyActive(p.end_date));
  const releasableCredit = releasableCanonicalActive.reduce(
    (s, p) => s + (p.coverage_amount || 0),
    0,
  );

  // Breakdown by guarantee modality — surfaces the split since recursal,
  // judicial and cautelar follow different release rules.
  const creditByCategory = new Map<GuaranteeCategory, number>();
  for (const p of releasableCanonicalActive) {
    const cat = classifyGuaranteeType(p.guarantee_type);
    creditByCategory.set(cat, (creditByCategory.get(cat) || 0) + (p.coverage_amount || 0));
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-cyan-500/10 px-4 pb-4 pt-3">
      {/* Summary cards */}
      {(policies.length > 0 || sentencesList.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="rounded-lg bg-secondary/30 p-2.5 text-center">
            <p className="text-lg font-mono font-bold text-foreground">{uniqueCount}</p>
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              Apólices
              {uniqueCount !== policies.length && (
                <span className="block opacity-60 normal-case tracking-normal">
                  ({policies.length} linhas c/ endossos)
                </span>
              )}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-2.5 text-center">
            <p className="text-lg font-mono font-bold text-foreground">{sentencesList.length}</p>
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Sentenças</p>
          </div>
          <div className="rounded-lg bg-secondary/30 p-2.5 text-center">
            <p className="text-sm font-mono font-bold text-status-warning">{formatCurrency(totalCoverage)}</p>
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Total Cobertura</p>
          </div>
          <div className="rounded-lg bg-status-success/5 border border-status-success/20 p-2.5 text-center">
            <p className="text-sm font-mono font-bold text-status-success">{formatCurrency(releasableCredit)}</p>
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Capital Liberável</p>
          </div>
        </div>
      )}

      {creditByCategory.size > 1 && (
        <div className="flex flex-wrap gap-2 text-[11px] font-mono mb-3">
          <span className="text-muted-foreground">Liberável por modalidade:</span>
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

      {/* Grouped by CNJ */}
      {relevantLawsuits.length > 0 ? (
        <div className="space-y-2">
          {relevantLawsuits.map((lawsuit) => (
            <LawsuitGroupCard
              key={lawsuit.id}
              lawsuit={lawsuit}
              policies={policiesByLawsuit.get(lawsuit.id) || []}
              sentences={sentencesByLawsuit.get(lawsuit.id) || []}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-cyan-500/40 font-mono">Nenhuma apólice ou sentença encontrada.</p>
      )}
    </motion.div>
  );
};

const LawsuitGroupCard = ({
  lawsuit,
  policies,
  sentences,
}: {
  lawsuit: LawsuitRow;
  policies: PolicyRow[];
  sentences: SentenceRow[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasTermination = sentences.some((s) => s.is_termination);
  const isReleasable = policies.length > 0 && hasTermination;
  const policyGroups = groupPoliciesByNumber(policies);
  const uniquePolicyCount = policyGroups.length;
  // Sum canonicals only — endossos share the apólice.
  const totalCoverage = policyGroups.reduce(
    (s, g) => s + (g.canonical.coverage_amount || 0),
    0,
  );

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isReleasable ? "border-status-success/30 bg-status-success/5" : "border-border/20 bg-black/20"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
      >
        <Gavel className={`w-4 h-4 flex-shrink-0 ${isReleasable ? "text-status-success" : "text-muted-foreground"}`} />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-foreground truncate">{lawsuit.lawsuit_cnj || "CNJ não identificado"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{lawsuit.subject || lawsuit.court || ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {policies.length > 0 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning">
              {uniquePolicyCount} apólice{uniquePolicyCount !== 1 ? "s" : ""}
              {uniquePolicyCount !== policies.length && (
                <span className="opacity-70 ml-1">(+{policies.length - uniquePolicyCount} end.)</span>
              )}
            </span>
          )}
          {sentences.length > 0 && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {sentences.length} sentença{sentences.length !== 1 ? "s" : ""}
            </span>
          )}
          {isReleasable && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-status-success/10 text-status-success flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              Liberável
            </span>
          )}
          {totalCoverage > 0 && (
            <span className="text-xs font-mono text-foreground">{formatCurrency(totalCoverage)}</span>
          )}
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/20 px-3 pb-3 pt-2 space-y-3">
          {/* Policies */}
          {policies.length > 0 && (
            <div>
              <p className="text-[10px] font-mono tracking-widest text-status-warning mb-1.5 uppercase flex items-center gap-1">
                <Shield className="w-3 h-3" /> Apólices
              </p>
              <div className="space-y-2">
                {policyGroups.map((group) => (
                  <PolicyDetailCard
                    key={group.key}
                    policy={group.canonical}
                    endorsements={group.versions.slice(1)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sentences */}
          {sentences.length > 0 && (
            <div>
              <p className="text-[10px] font-mono tracking-widest text-primary mb-1.5 uppercase flex items-center gap-1">
                <Scale className="w-3 h-3" /> Sentenças / Decisões
              </p>
              <div className="space-y-2">
                {sentences.map((sentence) => (
                  <SentenceDetailCard key={sentence.id} sentence={sentence} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const PolicyDetailCard = ({
  policy,
  endorsements = [],
}: {
  policy: PolicyRow;
  endorsements?: PolicyRow[];
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const active = isPolicyActive(policy.end_date);
  const endorsementCount = endorsements.length;

  return (
    <div className="rounded-lg border border-status-warning/20 bg-status-warning/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-status-warning/10 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 text-status-warning flex-shrink-0" />
          <span className="font-mono text-sm text-status-warning truncate">{policy.policy_number || "Nº não identificado"}</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            active
              ? "bg-status-success/10 text-status-success border border-status-success/20"
              : "bg-muted text-muted-foreground border border-border/30"
          }`}>
            {active ? "Vigente" : "Vencida"}
          </span>
          {(() => {
            const cat = classifyGuaranteeType(policy.guarantee_type);
            if (cat === "outros") return null;
            const catStyles: Record<Exclude<GuaranteeCategory, "outros">, string> = {
              recursal: "bg-primary/10 text-primary border-primary/20",
              judicial: "bg-status-warning/10 text-status-warning border-status-warning/20",
              cautelar: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            };
            return (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${catStyles[cat]}`}
                title={policy.guarantee_type || ""}
              >
                {GUARANTEE_CATEGORY_LABEL[cat]}
              </span>
            );
          })()}
          {endorsementCount > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowHistory((v) => !v);
                }
              }}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer"
              title="Endossos/versões anteriores detectados"
            >
              +{endorsementCount} endosso{endorsementCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-status-warning">{formatCurrency(policy.coverage_amount)}</span>
          {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 border-t border-status-warning/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <DetailField icon={<Building className="w-3.5 h-3.5 text-primary" />} label="Seguradora" value={policy.insurer} />
            <DetailField icon={<User className="w-3.5 h-3.5 text-primary" />} label="Segurado" value={policy.insured} />
            <DetailField icon={<Hash className="w-3.5 h-3.5 text-muted-foreground" />} label="CNPJ Segurado" value={policy.insured_cnpj} />
            <DetailField icon={<User className="w-3.5 h-3.5 text-muted-foreground" />} label="Beneficiário" value={policy.beneficiary} />
            <DetailField icon={<Shield className="w-3.5 h-3.5 text-status-success" />} label="Tipo Garantia" value={policy.guarantee_type} />
            <DetailField icon={<Scale className="w-3.5 h-3.5 text-primary" />} label="Tipo Cobertura" value={policy.coverage_type} />
            <DetailField icon={<DollarSign className="w-3.5 h-3.5 text-status-success" />} label="Importância Segurada" value={formatCurrency(policy.coverage_amount)} />
            <DetailField icon={<DollarSign className="w-3.5 h-3.5 text-status-warning" />} label="Prêmio" value={formatCurrency(policy.premium_amount)} />
            <DetailField icon={<Calendar className="w-3.5 h-3.5 text-primary" />} label="Vigência Início" value={formatDate(policy.start_date)} />
            <DetailField icon={<Calendar className="w-3.5 h-3.5 text-primary" />} label="Vigência Fim" value={formatDate(policy.end_date)} />
            {policy.guarantee_object && (
              <div className="sm:col-span-2">
                <DetailField icon={<FileText className="w-3.5 h-3.5 text-primary" />} label="Objeto da Garantia" value={policy.guarantee_object} />
              </div>
            )}
            {policy.contract_reference && (
              <DetailField icon={<Hash className="w-3.5 h-3.5 text-muted-foreground" />} label="Ref. Contrato" value={policy.contract_reference} />
            )}
            {policy.court_order_reference && (
              <DetailField icon={<Scale className="w-3.5 h-3.5 text-muted-foreground" />} label="Ref. Processo" value={policy.court_order_reference} />
            )}
          </div>
        </motion.div>
      )}

      {showHistory && endorsementCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 pt-2 border-t border-status-warning/10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1.5">
            Versões anteriores
          </p>
          <div className="space-y-1">
            {endorsements.map((v, idx) => (
              <div key={v.id} className="flex items-center justify-between gap-2 pl-2 border-l-2 border-primary/20 py-1">
                <div className="flex items-center gap-2 min-w-0 text-[11px] text-muted-foreground font-mono flex-wrap">
                  <span className="opacity-60">#{idx + 2}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isPolicyActive(v.end_date)
                      ? "bg-status-success/10 text-status-success border border-status-success/20"
                      : "bg-muted text-muted-foreground border border-border/30"
                  }`}>
                    {isPolicyActive(v.end_date) ? "Vigente" : "Vencida"}
                  </span>
                  {v.start_date && <span>início {formatDate(v.start_date)}</span>}
                  {v.end_date && <span>fim {formatDate(v.end_date)}</span>}
                </div>
                <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
                  {formatCurrency(v.coverage_amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const SentenceDetailCard = ({ sentence }: { sentence: SentenceRow }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border overflow-hidden ${
      sentence.is_termination
        ? "border-status-success/20 bg-status-success/5"
        : "border-primary/20 bg-primary/5"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {sentence.is_termination ? (
            <ShieldCheck className="w-4 h-4 text-status-success flex-shrink-0" />
          ) : (
            <Scale className="w-4 h-4 text-primary flex-shrink-0" />
          )}
          <span className={`font-mono text-sm truncate ${sentence.is_termination ? "text-status-success" : "text-primary"}`}>
            {sentence.document_type || "Sentença"}
          </span>
          {sentence.is_termination && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20">
              {sentence.termination_type || "Finalização"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {sentence.outcome && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-foreground">{sentence.outcome}</span>
          )}
          {sentence.document_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              title="Baixar documento"
              onClick={(e) => { e.stopPropagation(); window.open(sentence.document_url!, "_blank"); }}
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
          {expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 border-t border-border/10">
          <p className="text-xs text-foreground mt-2 mb-2">{sentence.summary || "Sem resumo disponível"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sentence.judge_name && <DetailField icon={<User className="w-3.5 h-3.5 text-muted-foreground" />} label="Juiz" value={sentence.judge_name} />}
            {sentence.sentence_date && <DetailField icon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />} label="Data" value={sentence.sentence_date} />}
            <DetailField icon={<FileText className="w-3.5 h-3.5 text-muted-foreground" />} label="Documento" value={sentence.document_name} />
          </div>
          {sentence.key_points && Array.isArray(sentence.key_points) && sentence.key_points.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Pontos-chave</p>
              <ul className="space-y-0.5">
                {sentence.key_points.map((point: string, i: number) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const DetailField = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
  <div className="flex items-start gap-1.5">
    <div className="mt-0.5 flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs text-foreground truncate">{value || "—"}</p>
    </div>
  </div>
);

export default Historico;
