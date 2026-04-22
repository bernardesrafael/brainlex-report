import { motion } from "framer-motion";
import { Gavel, Calendar, User, FileText, ChevronDown, ChevronRight, Download, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface SentenceData {
  id: string;
  search_id: string;
  lawsuit_id: string;
  document_name: string;
  document_type?: string;
  sentence_date?: string;
  judge_name?: string;
  summary: string;
  outcome?: string;
  key_points?: string[];
  document_url?: string;
  is_termination?: boolean;
  termination_type?: string;
}

interface SentenceCardProps {
  sentence: SentenceData;
  index: number;
}

const outcomeColors: Record<string, string> = {
  procedente: "bg-status-success/10 text-status-success border-status-success/20",
  improcedente: "bg-destructive/10 text-destructive border-destructive/20",
  "parcialmente procedente": "bg-status-warning/10 text-status-warning border-status-warning/20",
  extinto: "bg-muted text-muted-foreground border-border",
  acordo: "bg-primary/10 text-primary border-primary/20",
};

const getOutcomeStyle = (outcome?: string) => {
  if (!outcome) return "bg-muted text-muted-foreground border-border";
  const key = outcome.toLowerCase();
  for (const [k, v] of Object.entries(outcomeColors)) {
    if (key.includes(k)) return v;
  }
  return "bg-muted text-muted-foreground border-border";
};

const formatDate = (value?: string) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
};

const terminationLabel = (type?: string) => {
  if (!type) return "Finalização identificada";
  const t = type.toLowerCase();
  if (t.includes("extinção") || t.includes("extincao")) return "Extinção identificada";
  if (t.includes("arquivamento")) return "Arquivamento identificado";
  if (t.includes("quitação") || t.includes("quitacao")) return "Quitação identificada";
  return "Finalização identificada";
};

export const SentenceCard = ({ sentence, index }: SentenceCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const keyPoints = (sentence.key_points || []) as string[];
  const isTermination = sentence.is_termination === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl overflow-hidden ${
        isTermination
          ? "glass-strong ring-2 ring-status-success/40 shadow-[0_0_24px_-4px_hsl(var(--status-success)/0.25)]"
          : "glass-strong shadow-glass-lg"
      }`}
    >
      {/* Header */}
      <div
        className={`px-6 py-4 border-b border-border/30 ${
          isTermination
            ? "bg-gradient-to-r from-status-success/12 via-status-success/6 to-status-success/12"
            : "bg-gradient-to-r from-status-warning/8 via-status-warning/4 to-status-warning/8"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isTermination ? "bg-status-success/15" : "bg-status-warning/10"
              }`}
            >
              {isTermination ? (
                <ShieldCheck className="w-5 h-5 text-status-success" />
              ) : (
                <Gavel className="w-5 h-5 text-status-warning" />
              )}
            </div>
            <div>
              <p className="font-display text-sm tracking-wide text-foreground">
                {sentence.document_type || "Sentença"}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                {sentence.document_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTermination && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg border bg-status-success/15 text-status-success border-status-success/30 animate-pulse">
                {terminationLabel(sentence.termination_type)}
              </span>
            )}
            {sentence.outcome && (
              <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${getOutcomeStyle(sentence.outcome)}`}>
                {sentence.outcome}
              </span>
            )}
            {sentence.document_url && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-primary"
                title="Baixar documento"
              >
                <a href={sentence.document_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Meta info row */}
        <div className="flex flex-wrap gap-4 mb-4">
          {sentence.sentence_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(sentence.sentence_date)}</span>
            </div>
          )}
          {sentence.judge_name && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{sentence.judge_name}</span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mb-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Resumo IA</p>
          <p className="text-sm text-foreground leading-relaxed">{sentence.summary || "Sem resumo disponível"}</p>
        </div>

        {/* Key points */}
        {keyPoints.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary/80 transition-colors mt-2"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>{keyPoints.length} ponto(s)-chave</span>
          </button>
        )}
        {expanded && keyPoints.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 space-y-1.5 pl-2"
          >
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3 mt-0.5 text-status-warning flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.div>
  );
};
