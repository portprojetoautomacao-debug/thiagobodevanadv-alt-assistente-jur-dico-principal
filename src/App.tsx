import GlobalSearch from "@/components/GlobalSearch";
// Removido Google OAuth (uso exclusivo, login simples)
import NotificationCenter from "@/components/NotificationCenter";
import Sidebar from "@/components/Sidebar";
import { SimpleAuth } from "@/components/SimpleAuth";
import { Toaster } from "@/components/ui/sonner";
import { useAutoMinuta } from "@/hooks/use-auto-minuta";
import { useKV } from "@/hooks/use-kv";
import type { User, ViewType } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense, useEffect, useState } from "react";

// QueryClient global (criado fora do componente para evitar recriação)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ⚡ COMPONENTES PRINCIPAIS - Carregados diretamente (sem lazy loading)
// Sistema 100% automático requer componentes prontos imediatamente
import AIAgents from "@/components/AIAgents";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AudioTranscription from "@/components/AudioTranscription";
import BatchAnalysis from "@/components/BatchAnalysis";
import CalculadoraPrazos from "@/components/CalculadoraPrazos";
import Calendar from "@/components/Calendar";
import Dashboard from "@/components/Dashboard";
import DatabaseQueries from "@/components/DatabaseQueries";
import DatajudChecklist from "@/components/DatajudChecklist";
import ExpedientePanel from "@/components/ExpedientePanel";
import FinancialManagement from "@/components/FinancialManagement";
import HarveySpecterChat from "@/components/HarveySpecterChat";
import KnowledgeBase from "@/components/KnowledgeBase";
import PDFUploader from "@/components/PDFUploader";
import ProcessCRM from "@/components/ProcessCRM";

// ⚡ LAZY LOADING: MinutasManager contém TiptapEditor (ProseMirror) que é pesado
// Isso evita o erro "Cannot set properties of undefined (setting 'Activity')"
// causado por race condition na inicialização do ProseMirror
const MinutasManager = lazy(() => import("@/components/MinutasManager"));

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [user, setUser] = useKV<User | null>("user", null);

  // ✨ Auto-criação de minutas quando agentes completam tarefas de redação
  useAutoMinuta();

  // Autenticação é derivada diretamente da presença do usuário no KV/localStorage

  // Fallback de roteamento: sincroniza currentView com o hash da URL
  useEffect(() => {
    const applyHashView = () => {
      if (window === undefined) return;
      const hash = globalThis.window.location.hash.replace(/^#/, "").trim();
      if (hash) {
        setCurrentView(hash as ViewType);
      }
    };
    // aplica na carga inicial
    applyHashView();
    // escuta alterações de hash
    globalThis.window.addEventListener("hashchange", applyHashView);
    return () => globalThis.window.removeEventListener("hashchange", applyHashView);
  }, []);

  // Handler legado de Google removido

  const handleSimpleAuthSuccess = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("dashboard");
  };

  // Handler de navegação para componentes que passam string como view
  const handleNavigate = (view: string, _data?: unknown) => {
    setCurrentView(view as ViewType);
  };

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentView} />;
      case "crm":
      case "processos":
      case "processes":
        return <ProcessCRM />;
      case "calendar":
      case "calendario":
        return <Calendar />;
      case "financeiro":
      case "financial":
        return <FinancialManagement />;
      case "prazos":
      case "calculadora":
      case "calculator":
        return <CalculadoraPrazos />;
      case "upload-pdf":
        return <PDFUploader />;
      case "minutas":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            }
          >
            <MinutasManager />
          </Suspense>
        );
      case "donna":
      case "assistente":
        return <HarveySpecterChat />;
      case "ai-agents":
        return <AIAgents onNavigate={setCurrentView} />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "expedientes":
        return <ExpedientePanel />;
      case "batch":
        return <BatchAnalysis />;
      case "audio":
        return <AudioTranscription />;
      case "queries":
        return <DatabaseQueries />;
      case "datajud":
        return <DatajudChecklist />;
      case "knowledge":
        return <KnowledgeBase />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <div
          className="min-h-screen bg-background flex items-center justify-center p-4 notranslate"
          translate="no"
        >
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Assistente Jurídico PJe</h1>
              <p className="text-muted-foreground">Sistema inteligente de gestão jurídica com IA</p>
            </div>

            <div className="space-y-4">
              {/* Login simples local (adm/adm123) */}
              <SimpleAuth onSuccess={handleSimpleAuthSuccess} />

              {/* GoogleAuth removido definitivamente */}
            </div>
          </div>
          <Toaster />
          <SpeedInsights />
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-background notranslate" translate="no">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          user={user}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar com Busca Global e Notificações */}
          <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <GlobalSearch onNavigate={handleNavigate} />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Pressione{" "}
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">/</kbd>{" "}
                para buscar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter onNavigate={handleNavigate} />
            </div>
          </header>
          <main
            id="main-content"
            role="main"
            aria-label="Conteúdo principal"
            className="flex-1 overflow-hidden"
          >
            <div className="h-full overflow-y-auto p-6">{renderContent()}</div>
          </main>
        </div>
        <Toaster />
        <SpeedInsights />
      </div>
    </QueryClientProvider>
  );
}

export default App;
