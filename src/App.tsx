import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Logs from "./pages/Logs.tsx";
import Historico from "./pages/Historico.tsx";
import Docs from "./pages/Docs.tsx";
import Maps from "./pages/Maps.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import LawsuitDetail from "./pages/LawsuitDetail.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/relatorios" element={<Historico />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/dashboard/:searchId" element={<Dashboard />} />
          <Route path="/lawsuits/:id" element={<LawsuitDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
