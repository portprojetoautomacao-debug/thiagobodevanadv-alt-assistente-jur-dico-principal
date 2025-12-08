/**
 * Popup Controller
 */

class PopupController {
  private apiKey: string | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
    await this.updateStatus();
    await this.updateStats();
    this.startAutoRefresh();
  }

  private async loadSettings(): Promise<void> {
    const result = await chrome.storage.sync.get(["apiKey"]);
    this.apiKey = result.apiKey || null;

    const input = document.getElementById("apiKey") as HTMLInputElement;
    if (this.apiKey) {
      input.value = "••••••••••••••••";
      input.dataset.hasKey = "true";
    }
  }

  private setupEventListeners(): void {
    // Toggle API Key visibility
    const toggleBtn = document.getElementById("toggleApiKey");
    toggleBtn?.addEventListener("click", () => {
      const input = document.getElementById("apiKey") as HTMLInputElement;
      if (input.type === "password") {
        input.type = "text";
        toggleBtn.textContent = "🙈";
      } else {
        input.type = "password";
        toggleBtn.textContent = "👁️";
      }
    });

    // Save API Key
    const saveBtn = document.getElementById("saveApiKey");
    saveBtn?.addEventListener("click", async () => {
      const input = document.getElementById("apiKey") as HTMLInputElement;
      const key = input.value.trim();

      if (!key || key === "••••••••••••••••") {
        this.showToast("Digite uma API Key válida", "error");
        return;
      }

      saveBtn.textContent = "Salvando...";
      (saveBtn as HTMLButtonElement).disabled = true;

      try {
        await chrome.storage.sync.set({ apiKey: key });
        this.apiKey = key;
        input.value = "••••••••••••••••";
        input.dataset.hasKey = "true";
        this.showToast("API Key salva com sucesso!", "success");
        await this.updateStatus();
      } catch (error) {
        this.showToast("Erro ao salvar API Key", "error");
      } finally {
        saveBtn.textContent = "Salvar";
        (saveBtn as HTMLButtonElement).disabled = false;
      }
    });

    // Sync Now
    const syncBtn = document.getElementById("syncNow");
    syncBtn?.addEventListener("click", () => this.syncNow());

    // Open Dashboard
    const dashboardBtn = document.getElementById("openDashboard");
    dashboardBtn?.addEventListener("click", () => {
      chrome.tabs.create({
        url: "https://assistente-juridico-p.vercel.app",
      });
    });

    // Open Settings
    const settingsBtn = document.getElementById("openSettings");
    settingsBtn?.addEventListener("click", () => {
      chrome.tabs.create({
        url: "https://assistente-juridico-p.vercel.app/settings/api-keys",
      });
    });
  }

  private async updateStatus(): Promise<void> {
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");

    if (!this.apiKey) {
      statusDot?.classList.remove("online", "syncing");
      statusDot?.classList.add("offline");
      statusText!.textContent = "Configure sua API Key";
      return;
    }

    statusDot?.classList.add("syncing");
    statusDot?.classList.remove("online", "offline");
    statusText!.textContent = "Verificando...";

    try {
      const response = await fetch("https://assistente-juridico-p.vercel.app/api/status", {
        headers: { "X-API-Key": this.apiKey },
      });

      if (response.ok) {
        statusDot?.classList.add("online");
        statusDot?.classList.remove("offline", "syncing");
        statusText!.textContent = "Conectado";
      } else {
        throw new Error("Backend offline");
      }
    } catch {
      statusDot?.classList.remove("online", "syncing");
      statusDot?.classList.add("offline");
      statusText!.textContent = "Desconectado";
    }
  }

  private async updateStats(): Promise<void> {
    const storage = await chrome.storage.local.get([
      "processos",
      "processos_timestamp",
      "expedientes_today",
    ]);

    // Processos
    const processosCount = storage.processos?.length || 0;
    document.getElementById("processosCount")!.textContent = String(processosCount);

    // Expedientes hoje
    const today = new Date().toDateString();
    const expedientesCount = (storage.expedientes_today || []).filter(
      (e: any) => new Date(e.createdAt).toDateString() === today
    ).length;
    document.getElementById("expedientesCount")!.textContent = String(expedientesCount);

    // Última sincronização
    if (storage.processos_timestamp) {
      const date = new Date(storage.processos_timestamp);
      const formatted = this.formatRelativeTime(date);
      document.getElementById("lastSync")!.textContent = `Última sincronização: ${formatted}`;
    }
  }

  private async syncNow(): Promise<void> {
    const btn = document.getElementById("syncNow") as HTMLButtonElement;
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "🔄 Sincronizando...";

    try {
      // Busca abas do PJe
      const tabs = await chrome.tabs.query({
        url: "https://pje*.tjmg.jus.br/*",
      });

      if (tabs.length === 0) {
        this.showToast("Abra o painel do PJe primeiro", "error");
        return;
      }

      // Envia mensagem para content script
      for (const tab of tabs) {
        if (tab.id) {
          await chrome.tabs.sendMessage(tab.id, {
            type: "FORCE_SYNC",
            timestamp: Date.now(),
          });
        }
      }

      this.showToast("Sincronização iniciada!", "success");
      await this.updateStats();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      this.showToast("Erro na sincronização", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  private startAutoRefresh(): void {
    setInterval(() => {
      this.updateStatus();
      this.updateStats();
    }, 30000); // 30 segundos
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Agora mesmo";
    if (minutes === 1) return "Há 1 minuto";
    if (minutes < 60) return `Há ${minutes} minutos`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "Há 1 hora";
    if (hours < 24) return `Há ${hours} horas`;

    return date.toLocaleString("pt-BR");
  }

  private showToast(message: string, type: "success" | "error" = "success"): void {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  new PopupController();
});
