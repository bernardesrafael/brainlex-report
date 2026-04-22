import { motion } from "framer-motion";
import { Shield, Calendar, DollarSign, Building, User, FileCheck, Hash, Scale, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PolicyData } from "./SearchResults";

interface PolicyCardProps {
  policy: PolicyData & { document_name?: string; lawsuit_cnj?: string; document_url?: string };
  index: number;
}

const formatCurrency = (value?: number) => {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
};

export const PolicyCard = ({ policy, index }: PolicyCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.15 }}
    className="glass-strong rounded-2xl overflow-hidden shadow-glass-lg"
  >
    {/* Header */}
    <div className="bg-gradient-to-r from-primary/8 via-primary/4 to-primary/8 px-6 py-4 border-b border-border/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm tracking-wide text-foreground">
              Apólice Identificada
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              {policy.policy_number || "Número não identificado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-status-success" />
          {policy.document_url && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-muted-foreground hover:text-primary"
              title="Baixar documento"
            >
              <a href={policy.document_url} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <DataField icon={<Building className="w-4 h-4 text-primary" />} label="Seguradora" value={policy.insurer} />
      <DataField icon={<User className="w-4 h-4 text-primary" />} label="Segurado/Tomador" value={policy.insured} />
      <DataField icon={<Hash className="w-4 h-4 text-muted-foreground" />} label="CNPJ Segurado" value={policy.insured_cnpj} />
      <DataField icon={<User className="w-4 h-4 text-muted-foreground" />} label="Beneficiário" value={policy.beneficiary} />
      <DataField icon={<Shield className="w-4 h-4 text-status-success" />} label="Tipo de Garantia" value={policy.guarantee_type} />
      <DataField icon={<Scale className="w-4 h-4 text-primary" />} label="Tipo de Cobertura" value={policy.coverage_type} />
      <DataField icon={<DollarSign className="w-4 h-4 text-status-success" />} label="Importância Segurada" value={formatCurrency(policy.coverage_amount)} />
      <DataField icon={<DollarSign className="w-4 h-4 text-status-warning" />} label="Prêmio" value={formatCurrency(policy.premium_amount)} />
      <DataField icon={<Calendar className="w-4 h-4 text-primary" />} label="Vigência Início" value={formatDate(policy.start_date)} />
      <DataField icon={<Calendar className="w-4 h-4 text-primary" />} label="Vigência Fim" value={formatDate(policy.end_date)} />
      {policy.guarantee_object && (
        <div className="md:col-span-2">
          <DataField icon={<FileCheck className="w-4 h-4 text-primary" />} label="Objeto da Garantia" value={policy.guarantee_object} />
        </div>
      )}
      {policy.contract_reference && (
        <DataField icon={<Hash className="w-4 h-4 text-muted-foreground" />} label="Ref. Contrato" value={policy.contract_reference} />
      )}
      {policy.court_order_reference && (
        <DataField icon={<Scale className="w-4 h-4 text-muted-foreground" />} label="Ref. Processo" value={policy.court_order_reference} />
      )}
    </div>
  </motion.div>
);

const DataField = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground truncate">{value || "—"}</p>
    </div>
  </div>
);
