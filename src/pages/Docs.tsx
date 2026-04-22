import { useState } from "react";
import { motion } from "framer-motion";
import { MatrixRain } from "@/components/FuturisticEffects";
import { Header } from "@/components/Header";
import {
  BookOpen, Server, Database, Workflow, RefreshCw, Layout,
  ChevronDown, ExternalLink, Zap
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const SectionBlock = ({ section, isOpen, onToggle }: { section: DocSection; isOpen: boolean; onToggle: () => void }) => (
  <div id={section.id} className="glass rounded-lg overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
    >
      <span className="text-cyan-400">{section.icon}</span>
      <span className="font-mono text-sm tracking-wider text-foreground flex-1">{section.title}</span>
      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.2 }}
        className="px-5 pb-5 border-t border-border/30"
      >
        <div className="pt-4 text-sm text-muted-foreground leading-relaxed space-y-4">
          {section.content}
        </div>
      </motion.div>
    )}
  </div>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1.5 py-0.5 rounded bg-secondary/60 text-cyan-400 text-xs font-mono">{children}</code>
);

const TableRow = ({ name, desc }: { name: string; desc: string }) => (
  <tr className="border-b border-border/20">
    <td className="py-2 pr-4 font-mono text-cyan-400 text-xs whitespace-nowrap">{name}</td>
    <td className="py-2 text-xs text-muted-foreground">{desc}</td>
  </tr>
);

const sections: DocSection[] = [
  {
    id: "visao-geral",
    title: "VISÃO GERAL",
    icon: <BookOpen className="w-4 h-4" />,
    content: (
      <>
        <p>
          O <strong className="text-foreground">BrainLex Sentinel</strong> é uma aplicação de inteligência jurídica que automatiza
          a descoberta e extração de apólices de seguro a partir de processos judiciais vinculados a um CNPJ.
        </p>
        <p>O fluxo principal consiste em:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Buscar e validar um CNPJ via BrasilAPI</li>
          <li>Consultar processos judiciais vinculados via Brainlex Avançado</li>
          <li>Listar e selecionar processos para análise</li>
          <li>Baixar documentos de cada processo via Brainlex</li>
          <li>Classificar documentos com IA (Google Gemini) para identificar apólices</li>
          <li>Extrair dados estruturados das apólices encontradas</li>
        </ol>
        <p>
          O sistema opera de forma <strong className="text-foreground">incremental</strong>: buscas anteriores são reutilizadas
          e apenas documentos novos são processados, economizando tempo e recursos.
        </p>
      </>
    ),
  },
  {
    id: "arquitetura",
    title: "ARQUITETURA",
    icon: <Server className="w-4 h-4" />,
    content: (
      <>
        <div className="space-y-3">
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ FRONTEND</h4>
            <p>React 18 + TypeScript, Vite como bundler, Tailwind CSS para estilização, Framer Motion para animações.
              Componentes UI via shadcn/ui (Radix primitives). Estado gerenciado com React Query + hooks customizados.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ BACKEND</h4>
            <p>Supabase como BaaS: PostgreSQL para persistência, Edge Functions (Deno) para lógica de negócio,
              Realtime para atualizações. Sem servidor dedicado — tudo serverless.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ APIs EXTERNAS</h4>
            <ul className="space-y-1 ml-2">
              <li>• <strong className="text-foreground">BrasilAPI</strong> — Validação e dados cadastrais do CNPJ</li>
              <li>• <strong className="text-foreground">Brainlex Avançado</strong> — Busca de processos judiciais por CNPJ e download de documentos</li>
              <li>• <strong className="text-foreground">Brainlex</strong> — Fetch de documentos processuais</li>
              <li>• <strong className="text-foreground">Google Gemini</strong> — Classificação e extração de dados de apólices (Gemini Flash Lite para triagem, Gemini Flash para extração)</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "banco-de-dados",
    title: "BANCO DE DADOS",
    icon: <Database className="w-4 h-4" />,
    content: (
      <>
        <p className="mb-3">PostgreSQL via Supabase com as seguintes tabelas:</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan-400/20">
                <th className="text-left py-2 pr-4 font-mono text-xs text-cyan-400">Tabela</th>
                <th className="text-left py-2 font-mono text-xs text-cyan-400">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <TableRow name="searches" desc="Registro de cada busca por CNPJ, status, total de processos, apólices e sentenças encontradas" />
              <TableRow name="lawsuits" desc="Processos judiciais vinculados a uma busca — CNJ, tribunal, valor, partes, assunto" />
              <TableRow name="lawsuit_documents" desc="Documentos de cada processo — nome, URL, tipo, análise da IA, se é candidato a apólice" />
              <TableRow name="analysis_jobs" desc="Jobs de análise por processo — status, fase atual, documentos, apólices e sentenças encontradas" />
              <TableRow name="insurance_policies" desc="Apólices extraídas — seguradora, segurado, valores, datas, tipo de cobertura, dados completos" />
              <TableRow name="lawsuit_sentences" desc="Sentenças e decisões judiciais — tipo, data, juiz, desfecho, resumo IA, pontos-chave" />
              <TableRow name="judit_callbacks" desc="Callbacks recebidos do Brainlex Avançado webhook com payload de resposta" />
              <TableRow name="system_logs" desc="Logs do sistema — ação, nível, fonte, mensagem, metadados, duração" />
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          Relacionamentos: <Code>searches</Code> → <Code>lawsuits</Code> → <Code>lawsuit_documents</Code>.
          <Code>analysis_jobs</Code>, <Code>insurance_policies</Code> e <Code>lawsuit_sentences</Code> referenciam <Code>searches</Code> e <Code>lawsuits</Code>.
        </p>
      </>
    ),
  },
  {
    id: "edge-functions",
    title: "EDGE FUNCTIONS",
    icon: <Zap className="w-4 h-4" />,
    content: (
      <>
        <div className="space-y-4">
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ judit-search</h4>
            <p>Recebe um CNPJ e inicia uma busca no Brainlex Avançado. Cria o registro em <Code>searches</Code>, envia
              a requisição à API Brainlex Avançado e retorna o <Code>request_id</Code> para polling via webhook.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ judit-webhook</h4>
            <p>Endpoint que recebe callbacks do Brainlex Avançado quando a busca é concluída. Salva o payload em
              <Code>judit_callbacks</Code> e atualiza o status da busca. Parseia os processos e insere em <Code>lawsuits</Code>.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ analyze-lawsuits</h4>
            <p>Orquestra a análise de múltiplos processos. Para cada CNJ selecionado: cria um <Code>analysis_job</Code>,
              solicita documentos ao Brainlex Avançado, faz polling até receber resposta, baixa documentos via Brainlex,
              classifica com Gemini Flash Lite (identificando apólices E sentenças), extrai apólices com Gemini Flash,
              e analisa sentenças extraindo resumo, desfecho e pontos-chave. Opera de forma incremental.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ analyze-documents</h4>
            <p>Função auxiliar focada na classificação e extração. Recebe conteúdo de documentos
              e usa Google Gemini para: classificar apólices, classificar sentenças, extrair dados de apólices
              e extrair dados de sentenças (resumo, desfecho, juiz, pontos-chave).</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ download-document</h4>
            <p>Proxy para download de documentos. Faz o download de anexos do Brainlex Avançado ou Brainlex
              utilizando as chaves de API do servidor, permitindo que o frontend acesse documentos de forma segura.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ jusbrasil-fetch</h4>
            <p>Busca alternativa de informações de processos via Brainlex como fonte complementar de dados.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "fluxo-de-busca",
    title: "FLUXO DE BUSCA",
    icon: <Workflow className="w-4 h-4" />,
    content: (
      <>
        <ol className="space-y-3 ml-2">
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">01.</span>
            <span>Usuário insere um CNPJ na tela inicial. O frontend valida o formato e consulta a BrasilAPI para obter razão social.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">02.</span>
            <span>O hook <Code>usePolicySearch</Code> verifica se já existe uma busca salva para esse CNPJ na tabela <Code>searches</Code>.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">03.</span>
            <span>Se existir, carrega processos e apólices salvos. Caso contrário, invoca a edge function <Code>judit-search</Code>.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">04.</span>
            <span>O frontend faz polling no <Code>judit_callbacks</Code> aguardando a resposta do Brainlex Avançado (via webhook).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">05.</span>
            <span>Quando os processos chegam, são listados na tela. O usuário seleciona quais deseja analisar.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">06.</span>
            <span>A edge function <Code>analyze-lawsuits</Code> é chamada com os CNJs selecionados e o <Code>search_id</Code>.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">07.</span>
            <span>Para cada processo: baixa documentos → classifica com IA (apólices e sentenças) → extrai dados → salva no banco.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">08.</span>
            <span>O frontend faz polling nos <Code>analysis_jobs</Code> e exibe o progresso em tempo real.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400 font-mono text-xs mt-0.5">09.</span>
            <span>Apólices e sentenças encontradas são exibidas como cards com todos os dados estruturados extraídos.</span>
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "busca-incremental",
    title: "BUSCA INCREMENTAL",
    icon: <RefreshCw className="w-4 h-4" />,
    content: (
      <>
        <p>O sistema implementa busca incremental em dois níveis:</p>
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ NÍVEL 1 — BUSCA POR CNPJ</h4>
            <p>Ao buscar um CNPJ, o frontend consulta a tabela <Code>searches</Code>. Se encontrar um registro
              com status <Code>completed</Code> ou busca ativa, reutiliza o <Code>search_id</Code> existente
              e carrega processos e apólices já salvos, sem refazer a consulta ao Brainlex Avançado.</p>
          </div>
          <div>
            <h4 className="text-foreground font-mono text-xs tracking-wider mb-1">▸ NÍVEL 2 — ANÁLISE DE DOCUMENTOS</h4>
            <p>Ao analisar um processo, a edge function <Code>analyze-lawsuits</Code> verifica:</p>
            <ul className="space-y-1 ml-2 mt-1">
              <li>• Se o CNJ já tem um <Code>analysis_job</Code> com status <Code>completed</Code> → pula a análise</li>
              <li>• Se há documentos novos: consulta <Code>lawsuit_documents</Code> para obter nomes já processados,
                filtra apenas documentos novos e analisa somente esses</li>
              <li>• Documentos de tribunais são imutáveis — uma vez analisados, não precisam ser reprocessados</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "paginas",
    title: "PÁGINAS",
    icon: <Layout className="w-4 h-4" />,
    content: (
      <>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Code>/</Code>
            <span>Tela principal — busca por CNPJ, listagem de processos, análise e exibição de apólices</span>
          </div>
          <div className="flex gap-3">
            <Code>/historico</Code>
            <span>Histórico de buscas realizadas com status e resultados</span>
          </div>
          <div className="flex gap-3">
            <Code>/logs</Code>
            <span>Visualização de logs do sistema para debugging e monitoramento</span>
          </div>
          <div className="flex gap-3">
            <Code>/docs</Code>
            <span>Documentação completa do sistema (esta página)</span>
          </div>
          <div className="flex gap-3">
            <Code>/maps</Code>
            <span>Mapas de processos — fluxogramas visuais de todas as operações</span>
          </div>
        </div>
      </>
    ),
  },
];

const Docs = () => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["visao-geral"]));

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(sections.map((s) => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden flex flex-col">
      <MatrixRain active={false} />
      <Header />

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar pt-20 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h1 className="font-mono text-lg tracking-widest text-foreground uppercase">
                Documentação
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Referência técnica completa do BrainLex Sentinel
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={expandAll} className="text-xs font-mono text-cyan-400/60 hover:text-cyan-400 transition-colors">
                [expandir tudo]
              </button>
              <button onClick={collapseAll} className="text-xs font-mono text-cyan-400/60 hover:text-cyan-400 transition-colors">
                [recolher tudo]
              </button>
            </div>
          </motion.div>

          {/* Quick nav */}
          <div className="glass-subtle rounded-lg p-4 mb-6">
            <p className="font-mono text-xs text-muted-foreground mb-2 tracking-wider">NAVEGAÇÃO RÁPIDA</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!openSections.has(s.id)) toggle(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-mono px-2 py-1 rounded bg-secondary/40 text-cyan-400/70 hover:text-cyan-400 hover:bg-secondary/60 transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <SectionBlock
                  section={section}
                  isOpen={openSections.has(section.id)}
                  onToggle={() => toggle(section.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Docs;
