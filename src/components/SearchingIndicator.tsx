import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchingIndicatorProps {
  onCancel: () => void;
  startedAt?: number | null;
}

const stepAnimation = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

export const SearchingIndicator = ({ onCancel, startedAt }: SearchingIndicatorProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const getElapsed = () => {
      if (!startedAt) return 0;
      return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    };

    setElapsed(getElapsed());

    const interval = setInterval(() => setElapsed(getElapsed()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0
    ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
    : `${seconds}s`;

  return (
    <motion.div {...stepAnimation} className="w-full max-w-4xl mx-auto mt-6 relative z-10">
      <div className="glass rounded-lg p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="font-mono text-sm tracking-wider text-primary">
          Buscando processos...
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Consultando o Brainlex Avançado para listar processos vinculados ao CNPJ
        </p>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Tempo decorrido: {timeStr}
        </p>
        {elapsed >= 30 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mt-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancelar busca
          </Button>
        )}
      </div>
    </motion.div>
  );
};
