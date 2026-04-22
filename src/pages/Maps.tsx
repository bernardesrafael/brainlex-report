import { useState } from "react";
import { motion } from "framer-motion";
import { MatrixRain } from "@/components/FuturisticEffects";
import { Header } from "@/components/Header";
import { GitBranch, ChevronDown } from "lucide-react";

/* ── Flowchart primitives ───────────────────────────── */

const Node = ({ label, variant = "default", sub }: { label: string; variant?: "start" | "end" | "decision" | "process" | "default"; sub?: string }) => {
  const base = "relative font-mono text-xs tracking-wide px-4 py-3 text-center max-w-[260px] w-full";
  const styles: Record<string, string> = {
    start: `${base} glass-strong rounded-full text-cyan-400 border-cyan-400/30`,
    end: `${base} glass-strong rounded-full text-emerald-400 border-emerald-400/30`,
    decision: `${base} glass rounded-lg text-amber-400 border-amber-400/20 rotate-0`,
    process: `${base} glass rounded-lg text-foreground`,
    default: `${base} glass rounded-lg text-foreground`,
  };

  return (
    <div className="flex flex-col items-center">
      <div className={styles[variant]}>
        <span>{label}</span>
        {sub && <span className="block text-[10px] text-muted-foreground mt-1">{sub}</span>}
      </div>
    </div>
  );
};

const Arrow = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center py-1">
    <div className="w-px h-6 bg-cyan-400/30" />
    {label && (
      <span className="text-[10px] font-mono text-muted-foreground my-0.5">{label}</span>
    )}
    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-cyan-400/40" />
  </div>
);

const BranchSplit = ({ left, right }: { left: { label: string; path: string }; right: { label: string; path: string } }) => (
  <div className="flex items-start justify-center gap-4 w-full my-1">
    <div className="flex flex-col items-center flex-1 max-w-[200px]">
      <span className="text-[10px] font-mono text-emerald-400 mb-1">{left.label}</span>
      <div className="w-px h-4 bg-emerald-400/30" />
      <div className="glass-subtle rounded-lg px-3 py-2 text-xs font-mono text-foreground text-center w-full">
        {left.path}
      </div>
    </div>
    <div className="flex flex-col items-center flex-1 max-w-[200px]">
      <span className="text-[10px] font-mono text-amber-400 mb-1">{right.label}</span>
      <div className="w-px h-4 bg-amber-400/30" />
      <div className="glass-subtle rounded-lg px-3 py-2 text-xs font-mono text-foreground text-center w-full">
        {right.path}
      </div>
    </div>
  </div>
);

/* ── Flowchart data ─────────────────────────────────── */

interface FlowchartDef {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

const flowcharts: FlowchartDef[] = [
  {
    id: "fluxo-principal",
    title: "FLUXO PRINCIPAL",
    description: "Do CNPJ à extração de apólices — visão completa do pipeline",
    content: (
      <div className="flex flex-col items-center">
        <Node label="Usuário insere CNPJ" variant="start" />
        <Arrow />
        <Node label="Validação de formato" variant="process" sub="regex + máscara" />
        <Arrow />
        <Node label="Consulta BrasilAPI" variant="process" sub="razão social + validação" />
        <Arrow />
        <Node label="CNPJ já buscado?" variant="decision" />
        <BranchSplit
          left={{ label: "SIM", path: "Carrega dados salvos (searches, lawsuits, policies)" }}
          right={{ label: "NÃO", path: "Invoca judit-search edge function" }}
        />
        <Arrow />
        <Node label="Polling judit_callbacks" variant="process" sub="aguarda webhook do Brainlex Avançado" />
        <Arrow />
        <Node label="Lista processos na tela" variant="process" sub="exibe CNJ, tribunal, valor, partes" />
        <Arrow />
        <Node label="Usuário seleciona processos" variant="default" />
        <Arrow />
        <Node label="Invoca analyze-lawsuits" variant="process" sub="edge function com CNJs selecionados" />
        <Arrow />
        <Node label="Polling analysis_jobs" variant="process" sub="atualiza progresso em tempo real" />
        <Arrow />
        <Node label="Exibe apólices extraídas" variant="end" sub="cards com dados estruturados" />
      </div>
    ),
  },
  {
    id: "fluxo-analise",
    title: "FLUXO DE ANÁLISE POR PROCESSO",
    description: "Pipeline detalhado de análise para cada CNJ selecionado",
    content: (
      <div className="flex flex-col items-center">
        <Node label="Recebe CNJ para análise" variant="start" />
        <Arrow />
        <Node label="Verifica analysis_job existente" variant="decision" />
        <BranchSplit
          left={{ label: "COMPLETED", path: "Pula — retorna dados existentes" }}
          right={{ label: "NOVO", path: "Cria analysis_job (status: processing)" }}
        />
        <Arrow />
        <Node label="Solicita documentos ao Brainlex Avançado" variant="process" sub="request_type: lawsuit_documents" />
        <Arrow />
        <Node label="Polling callback documentos" variant="process" sub="aguarda lista de arquivos" />
        <Arrow />
        <Node label="Filtra documentos já analisados" variant="decision" sub="consulta lawsuit_documents" />
        <Arrow label="somente novos" />
        <Node label="Download via Brainlex" variant="process" sub="fetch conteúdo dos documentos" />
        <Arrow />
        <Node label="Classificação Gemini Flash" variant="process" sub="é apólice? é sentença? confidence score" />
        <Arrow />
        <Node label="Candidato a apólice?" variant="decision" />
        <BranchSplit
          left={{ label: "SIM", path: "Extração completa de dados estruturados via Gemini Flash" }}
          right={{ label: "NÃO", path: "Registra em lawsuit_documents e prossegue" }}
        />
        <Arrow />
        <Node label="Salva insurance_policies" variant="process" sub="dados extraídos no banco" />
        <Arrow />
        <Node label="É sentença/decisão?" variant="decision" />
        <BranchSplit
          left={{ label: "SIM", path: "Extrai resumo, desfecho, juiz, pontos-chave via Gemini Flash" }}
          right={{ label: "NÃO", path: "Prossegue" }}
        />
        <Arrow />
        <Node label="Salva lawsuit_sentences" variant="process" sub="sentença com interpretação IA" />
        <Arrow />
        <Node label="Atualiza analysis_job → completed" variant="end" />
      </div>
    ),
  },
  {
    id: "busca-incremental",
    title: "BUSCA INCREMENTAL",
    description: "Como o sistema evita reprocessamento e economiza recursos",
    content: (
      <div className="flex flex-col items-center">
        <Node label="Nova busca por CNPJ" variant="start" />
        <Arrow />
        <Node label="SELECT * FROM searches WHERE cnpj = ?" variant="process" sub="verifica banco local" />
        <Arrow />
        <Node label="Busca existente?" variant="decision" />
        <BranchSplit
          left={{ label: "SIM", path: "Reutiliza search_id, carrega lawsuits e policies do banco" }}
          right={{ label: "NÃO", path: "Cria nova search, chama Brainlex Avançado" }}
        />
        <Arrow />
        <Node label="Usuário seleciona processos" variant="default" />
        <Arrow />
        <Node label="Para cada CNJ: verifica analysis_jobs" variant="process" />
        <Arrow />
        <Node label="Job completed?" variant="decision" />
        <BranchSplit
          left={{ label: "SIM", path: "Retorna resultado salvo, não reprocessa" }}
          right={{ label: "NÃO", path: "Inicia análise do processo" }}
        />
        <Arrow />
        <Node label="Lista documentos do processo" variant="process" />
        <Arrow />
        <Node label="Filtra por lawsuit_documents" variant="process" sub="remove docs já processados" />
        <Arrow label="docs novos" />
        <Node label="Analisa apenas documentos novos" variant="process" sub="classificação + extração IA" />
        <Arrow />
        <Node label="Persiste resultados incrementais" variant="end" sub="novos docs e apólices salvos" />
      </div>
    ),
  },
];

/* ── Page component ─────────────────────────────────── */

const FlowchartBlock = ({ chart, isOpen, onToggle }: { chart: FlowchartDef; isOpen: boolean; onToggle: () => void }) => (
  <div className="glass rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
    >
      <GitBranch className="w-4 h-4 text-cyan-400" />
      <div className="flex-1">
        <span className="font-mono text-sm tracking-wider text-foreground">{chart.title}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{chart.description}</span>
      </div>
      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="px-5 pb-6 pt-2 border-t border-border/30 overflow-x-auto"
      >
        <div className="min-w-[280px] py-4">
          {chart.content}
        </div>
      </motion.div>
    )}
  </div>
);

const Maps = () => {
  const [openCharts, setOpenCharts] = useState<Set<string>>(new Set(["fluxo-principal"]));

  const toggle = (id: string) => {
    setOpenCharts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden flex flex-col">
      <MatrixRain active={false} />
      <Header />

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-20 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <GitBranch className="w-5 h-5 text-cyan-400" />
              <h1 className="font-mono text-lg tracking-widest text-foreground uppercase">
                Mapas de Processos
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Fluxogramas visuais de todas as operações do sistema
            </p>
          </motion.div>

          <div className="space-y-3">
            {flowcharts.map((chart, i) => (
              <motion.div
                key={chart.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <FlowchartBlock
                  chart={chart}
                  isOpen={openCharts.has(chart.id)}
                  onToggle={() => toggle(chart.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Maps;
