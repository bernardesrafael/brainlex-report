import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, Loader2, Brain, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SearchResult {
  id: string;
  status: "searching" | "analyzing" | "found" | "not_found" | "error";
  cnpj: string;
  totalLawsuits: number;
  totalDocuments: number;
  policiesFound: number;
  lawsuits: LawsuitResult[];
}

export interface LawsuitResult {
  id: string;
  cnj: string;
  court: string;
  subject: string;
  status: string;
  documents: DocumentResult[];
}

export interface DocumentResult {
  id: string;
  name: string;
  isCandidate: boolean;
  confidence: number;
  reasoning: string;
  policyData?: PolicyData;
  analyzing?: boolean;
}

export interface PolicyData {
  policy_number?: string;
  insurer?: string;
  insured?: string;
  insured_cnpj?: string;
  beneficiary?: string;
  policy_type?: string;
  coverage_type?: string;
  coverage_amount?: number;
  premium_amount?: number;
  deductible_amount?: number;
  start_date?: string;
  end_date?: string;
  guarantee_type?: string;
  guarantee_object?: string;
  contract_reference?: string;
  court_order_reference?: string;
}

const statusConfig = {
  searching: { icon: Loader2, label: "Buscando processos...", color: "text-primary", animate: true },
  analyzing: { icon: Brain, label: "Analisando documentos com IA...", color: "text-primary", animate: true },
  found: { icon: CheckCircle, label: "Apólices encontradas", color: "text-status-success", animate: false },
  not_found: { icon: XCircle, label: "Nenhuma apólice encontrada", color: "text-muted-foreground", animate: false },
  error: { icon: XCircle, label: "Erro na análise", color: "text-destructive", animate: false },
};

export const SearchResults = ({ result, onClear }: { result: SearchResult; onClear?: () => void }) => {
  const config = statusConfig[result.status];
  const StatusIcon = config.icon;
  const canClear = result.status !== "searching" && result.status !== "analyzing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mt-8"
    >
      <div className="glass-strong rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <StatusIcon
              className={`w-6 h-6 ${config.color} ${config.animate ? "animate-spin" : ""}`}
            />
            <div>
              <p className={`font-display text-sm tracking-wide ${config.color}`}>
                {config.label}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                CNPJ: {result.cnpj}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-6 text-center">
              <Stat label="Processos" value={result.totalLawsuits} />
              <Stat label="Documentos" value={result.totalDocuments} />
              <Stat label="Apólices" value={result.policiesFound} highlight />
            </div>
            {canClear && onClear && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="text-muted-foreground hover:text-destructive"
                title="Limpar busca"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {(result.status === "searching" || result.status === "analyzing") && (
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/60 to-primary rounded-full"
              style={{ width: result.status === "searching" ? "40%" : "75%" }}
              animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {result.lawsuits.map((lawsuit, i) => (
        <motion.div
          key={lawsuit.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl p-5 mb-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono text-sm text-primary">{lawsuit.cnj}</p>
              <p className="text-xs text-muted-foreground">{lawsuit.court}</p>
              <p className="text-xs text-muted-foreground">{lawsuit.subject}</p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
              {lawsuit.status}
            </span>
          </div>

          {lawsuit.documents.length > 0 && (
            <div className="space-y-2 mt-3 border-t border-border/30 pt-3">
              <p className="text-xs font-display tracking-wider text-muted-foreground mb-2 uppercase">
                Documentos Analisados
              </p>
              {lawsuit.documents.map((doc) => (
                <DocumentItem key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

const Stat = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div>
    <p className={`font-display text-lg ${highlight ? "text-status-success" : "text-foreground"}`}>
      {value}
    </p>
    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);

const DocumentItem = ({ doc }: { doc: DocumentResult }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-xl border ${
      doc.isCandidate
        ? "border-status-success/30 bg-status-success/5"
        : "border-border/30 bg-secondary/20"
    }`}
  >
    {doc.analyzing ? (
      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
    ) : doc.isCandidate ? (
      <Eye className="w-4 h-4 text-status-success flex-shrink-0" />
    ) : (
      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    )}

    <div className="flex-1 min-w-0">
      <p className={`text-sm truncate ${doc.isCandidate ? "text-status-success" : "text-foreground"}`}>
        {doc.name}
      </p>
      {doc.reasoning && (
        <p className="text-xs text-muted-foreground truncate">{doc.reasoning}</p>
      )}
    </div>

    {doc.confidence > 0 && (
      <span
        className={`text-xs font-mono px-2 py-0.5 rounded-md ${
          doc.confidence > 0.7
            ? "bg-status-success/10 text-status-success"
            : doc.confidence > 0.4
            ? "bg-status-warning/10 text-status-warning"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {Math.round(doc.confidence * 100)}%
      </span>
    )}
  </div>
);
