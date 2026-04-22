import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { MatrixRain } from "@/components/FuturisticEffects";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, Filter, AlertCircle, AlertTriangle, Info, Bug,
  ChevronDown, ChevronUp, Clock, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SystemLog {
  id: string; created_at: string; level: string; source: string; action: string;
  message: string; metadata: Record<string, unknown> | null;
  search_id: string | null; lawsuit_cnj: string | null; request_id: string | null; duration_ms: number | null;
}

const LEVEL_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  warn: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  info: { icon: Info, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
  debug: { icon: Bug, color: "text-muted-foreground", bg: "bg-muted border-border/30" },
};

const SOURCE_COLORS: Record<string, string> = {
  "judit-search": "bg-blue-500/20 text-blue-400 border-blue-500/40",
  "analyze-lawsuits": "bg-purple-500/20 text-purple-400 border-purple-500/40",
  "judit-webhook": "bg-green-500/20 text-green-400 border-green-500/40",
  "jusbrasil-fetch": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  frontend: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
};

export default function Logs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(100);

  const fetchLogs = useCallback(async () => {
    let query = supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    if (levelFilter !== "all") query = query.eq("level", levelFilter);
    if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
    if (searchQuery) query = query.or(`message.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,lawsuit_cnj.ilike.%${searchQuery}%,request_id.ilike.%${searchQuery}%`);
    const { data, error } = await query;
    if (error) console.error("Error fetching logs:", error);
    setLogs((data as unknown as SystemLog[]) ?? []);
    setLoading(false);
  }, [levelFilter, sourceFilter, searchQuery, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { if (!autoRefresh) return; const i = setInterval(fetchLogs, 3000); return () => clearInterval(i); }, [autoRefresh, fetchLogs]);

  const toggleExpand = (id: string) => setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `system-logs-${new Date().toISOString().slice(0, 19)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const sources = [...new Set(logs.map((l) => l.source))];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <MatrixRain active={false} />
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="brain-logo text-2xl tracking-wider text-cyan-400 flex items-center gap-3">
            <Bug className="w-6 h-6" /> System Logs
          </h2>
          <p className="text-xs text-cyan-500/40 font-mono mt-1">Registro completo de todas as operações do sistema</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-4 p-4 rounded-lg glass-strong">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40" />
              <Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-black/30 border-cyan-500/20 font-mono text-sm text-cyan-100" />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[130px] bg-black/30 border-cyan-500/20 font-mono text-sm text-cyan-100"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="error">Error</SelectItem><SelectItem value="warn">Warn</SelectItem><SelectItem value="info">Info</SelectItem><SelectItem value="debug">Debug</SelectItem></SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[170px] bg-black/30 border-cyan-500/20 font-mono text-sm text-cyan-100"><SelectValue placeholder="Fonte" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas</SelectItem>{sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[100px] bg-black/30 border-cyan-500/20 font-mono text-sm text-cyan-100"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem><SelectItem value="250">250</SelectItem><SelectItem value="500">500</SelectItem></SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="text-xs font-mono text-cyan-500/40 cursor-pointer">Auto</Label>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} className="font-mono text-xs border-cyan-500/20 text-cyan-400"><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportLogs} className="font-mono text-xs border-cyan-500/20 text-cyan-400"><Download className="w-3 h-3 mr-1" />Export</Button>
          </div>
          <div className="flex gap-4 mt-3 text-xs font-mono text-cyan-500/40">
            <span>{logs.length} logs</span>
            <span className="text-red-400">{logs.filter((l) => l.level === "error").length} errors</span>
            <span className="text-yellow-400">{logs.filter((l) => l.level === "warn").length} warnings</span>
            {autoRefresh && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Atualizando a cada 3s</span>}
          </div>
        </motion.div>

        <div className="space-y-1">
          {loading ? <div className="text-center py-12 text-cyan-500/40 font-mono text-sm">Carregando logs...</div> : logs.length === 0 ? <div className="text-center py-12 text-cyan-500/40 font-mono text-sm">Nenhum log encontrado</div> : (
            <AnimatePresence initial={false}>
              {logs.map((log) => {
                const config = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
                const Icon = config.icon;
                const isExpanded = expandedIds.has(log.id);
                const sourceColor = SOURCE_COLORS[log.source] || "bg-muted text-muted-foreground border-border";
                return (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className={`rounded border ${config.bg} cursor-pointer transition-colors hover:brightness-110`} onClick={() => toggleExpand(log.id)}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-mono">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${config.color}`} />
                      <span className="text-cyan-500/40 shrink-0 w-[70px]">{formatTime(log.created_at)}</span>
                      <Badge variant="outline" className={`shrink-0 text-[10px] px-1.5 py-0 ${sourceColor}`}>{log.source}</Badge>
                      <span className="text-cyan-100 shrink-0 font-semibold">{log.action}</span>
                      <span className={`truncate ${config.color}`}>{log.message}</span>
                      {log.duration_ms && <span className="shrink-0 text-cyan-500/40 flex items-center gap-0.5"><Clock className="w-3 h-3" />{log.duration_ms}ms</span>}
                      {log.lawsuit_cnj && <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0 border-cyan-500/20 text-cyan-400">{log.lawsuit_cnj}</Badge>}
                      {isExpanded ? <ChevronUp className="w-3 h-3 shrink-0 text-cyan-500/40" /> : <ChevronDown className="w-3 h-3 shrink-0 text-cyan-500/40" />}
                    </div>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3 border-t border-cyan-500/10">
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                          <div><span className="text-cyan-500/40">Data:</span> <span className="text-cyan-100">{formatDate(log.created_at)} {formatTime(log.created_at)}</span></div>
                          <div><span className="text-cyan-500/40">Level:</span> <span className={config.color}>{log.level.toUpperCase()}</span></div>
                          {log.search_id && <div><span className="text-cyan-500/40">Search ID:</span> <span className="text-cyan-100/80">{log.search_id.slice(0, 8)}...</span></div>}
                          {log.request_id && <div><span className="text-cyan-500/40">Request ID:</span> <span className="text-cyan-100/80">{log.request_id.slice(0, 8)}...</span></div>}
                          {log.lawsuit_cnj && <div><span className="text-cyan-500/40">CNJ:</span> <span className="text-cyan-100/80">{log.lawsuit_cnj}</span></div>}
                          {log.duration_ms && <div><span className="text-cyan-500/40">Duração:</span> <span className="text-cyan-100">{log.duration_ms}ms</span></div>}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2"><span className="text-cyan-500/40 text-xs font-mono">Metadata:</span><pre className="mt-1 p-2 rounded bg-black/60 text-[11px] font-mono text-cyan-300/70 overflow-x-auto max-h-[200px]">{JSON.stringify(log.metadata, null, 2)}</pre></div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        {logs.length >= limit && <div className="text-center mt-4"><Button variant="outline" size="sm" onClick={() => setLimit((p) => p + 100)} className="font-mono text-xs border-cyan-500/20 text-cyan-400">Carregar mais</Button></div>}
      </main>
    </div>
  );
}
