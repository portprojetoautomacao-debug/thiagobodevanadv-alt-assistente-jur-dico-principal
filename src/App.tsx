import GlobalSearch from "@/components/GlobalSearch";
import type { GoogleUser } from "@/components/GoogleAuth";
import { GoogleAuthButton } from "@/components/GoogleAuth";
import NotificationCenter from "@/components/NotificationCenter";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAutoMinuta } from "@/hooks/use-auto-minuta";
import { useKV } from "@/hooks/use-kv";
import type { User, ViewType } from "@/types";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect, useState } from "react";

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
import MinutasManager from "@/components/MinutasManager";
import PDFUploader from "@/components/PDFUploader";
import ProcessCRM from "@/components/ProcessCRM";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [user, setUser] = useKV<User | null>("user", null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✨ Auto-criação de minutas quando agentes completam tarefas de redação
  useAutoMinuta();

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const handleAuthSuccess = (authUser: GoogleUser) => {
    // Normalize user data for Google provider
    const normalizedUser: User = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      avatarUrl: authUser.picture,
      role: authUser.role || "advogado", // Valor padrão para advogados
    };
    setUser(normalizedUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
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
        return <MinutasManager />;
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

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-4 notranslate"
        translate="no"
      >
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Assistente Jurídico PJe
            </h1>
            <p className="text-muted-foreground">
              Sistema inteligente de gestão jurídica com IA
            </p>
          </div>

          <div className="space-y-4">
            <GoogleAuthButton
              onSuccess={handleAuthSuccess}
              onError={(error) =>
                console.error("Erro na autenticação Google:", error)
              }
            />
          </div>
        </div>
        <Toaster />
        <SpeedInsights />
      </div>
    );
  }

  return (
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
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">
                /
              </kbd>{" "}
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
  );
}

export default App;
