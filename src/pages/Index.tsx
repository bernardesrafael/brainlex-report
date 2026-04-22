import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { MatrixRain } from "@/components/FuturisticEffects";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  FileText,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Unlock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SearchRow {
  id: string;
  cnpj: string;
  status: string;
  total_lawsuits: number | null;
  total_policies_found: number | null;
  total_sentences_found: number | null;
  date_from: string | null;
  date_to: string | null;
  created_at: string;
}

const formatCnpj = (cnpj: string) => {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const Index = () => {
  const navigate = useNavigate();
  const { data: searches, isLoading } = useQuery({
    queryKey: ["searches-index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("searches")
        .select(
          "id, cnpj, status, total_lawsuits, total_policies_found, total_sentences_found, date_from, date_to, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SearchRow[];
    },
  });

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <MatrixRain active={false} />
      <Header />

      <main className="relative z-10 container mx-auto px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-tight">
                BrainLex Sentinel — Relatórios
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                Estudos concluídos e em andamento
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : !searches || searches.length === 0 ? (
            <div className="glass-strong rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground font-mono">
                Nenhum estudo registrado ainda. Novos estudos são disparados via agente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searches.map((s) => {
                const dateRange =
                  s.date_from && s.date_to
                    ? `${format(new Date(s.date_from), "dd/MM/yy")} → ${format(new Date(s.date_to), "dd/MM/yy")}`
                    : s.date_from
                      ? `a partir de ${format(new Date(s.date_from), "dd/MM/yy")}`
                      : s.date_to
                        ? `até ${format(new Date(s.date_to), "dd/MM/yy")}`
                        : "sem filtro";
                return (
                  <motion.button
                    key={s.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/dashboard/${s.id}`)}
                    className="w-full glass rounded-xl p-4 text-left border border-border/30 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <Briefcase className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-foreground">
                            CNPJ {formatCnpj(s.cnpj)}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} · atividade {dateRange}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-secondary/40 text-muted-foreground">
                          {s.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <FileText className="w-3 h-3" /> {s.total_lawsuits ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-status-warning">
                          <Unlock className="w-3 h-3" /> {s.total_policies_found ?? 0}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate("/relatorios")}
              className="gap-2 text-xs font-mono"
            >
              Ver histórico completo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
