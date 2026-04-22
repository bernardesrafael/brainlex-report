import { useParams, useNavigate } from "react-router-dom";
import { MatrixRain } from "@/components/FuturisticEffects";
import { Header } from "@/components/Header";
import { SearchDashboard } from "@/components/SearchDashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();

  const { data: search, isLoading } = useQuery({
    queryKey: ["search-info", searchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("searches")
        .select("cnpj")
        .eq("id", searchId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!searchId,
  });

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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : search && searchId ? (
          <SearchDashboard searchId={searchId} cnpj={search.cnpj} />
        ) : (
          <p className="text-center text-muted-foreground font-mono">Pesquisa não encontrada.</p>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
