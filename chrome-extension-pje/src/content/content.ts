/**
 * Content Script - Injetado no painel PJe
 */

import { SyncMessage } from "../shared/types";
import { ExpedienteExtractor } from "./extractors/expediente-extractor";
import { ProcessExtractor } from "./extractors/process-extractor";
import { DOMObserver } from "./observers/dom-observer";

class PJeContentScript {
  private processExtractor: ProcessExtractor;
  private expedienteExtractor: ExpedienteExtractor;
  private domObserver: DOMObserver;
  private lastSync: number = 0;
  private syncInProgress: boolean = false;

  constructor() {
    this.processExtractor = new ProcessExtractor();
    this.expedienteExtractor = new ExpedienteExtractor();
    this.domObserver = new DOMObserver(() => this.handleDOMChange());

    this.init();
  }

  private async init(): Promise<void> {
    console.log("[PJe Sync] Content script iniciado");

    // Verifica se está na página correta
    if (!this.isPJePainelPage()) {
      console.log("[PJe Sync] Não é página do painel do advogado");
      return;
    }

    // Aguarda DOM carregar
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }

    // Escuta mensagens do background
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Async response
    });
  }

  private isPJePainelPage(): boolean {
    const url = window.location.href;
    return url.includes("pje") && (url.includes("painel") || url.includes("consulta"));
  }

  private start(): void {
    console.log("[PJe Sync] Iniciando monitoramento...");

    // Sincronização inicial
    this.syncNow();

    // Inicia observador DOM
    this.domObserver.start();

    // Adiciona badge visual
    this.addSyncBadge();
  }

  private async handleDOMChange(): Promise<void> {
    // Evita sync muito frequente
    const now = Date.now();
    if (now - this.lastSync < 5000) {
      // Min 5s entre syncs
      console.log("[PJe Sync] Sync muito recente, aguardando...");
      return;
    }

    await this.syncNow();
  }

  private async handleMessage(
    message: SyncMessage,
    sendResponse: (response: any) => void
  ): Promise<void> {
    if (message.type === "FORCE_SYNC") {
      console.log("[PJe Sync] Sync forçado via popup");
      await this.syncNow();
      sendResponse({ success: true });
    } else if (message.type === "PING") {
      sendResponse({ success: true, active: true });
    }
  }

  private async syncNow(): Promise<void> {
    if (this.syncInProgress) {
      console.log("[PJe Sync] Sync já em andamento");
      return;
    }

    this.syncInProgress = true;
    this.updateBadge("⟳", "#FFC107"); // Amarelo = sincronizando

    try {
      // Extrai processos
      const processos = this.processExtractor.extractProcessos();

      if (processos.length === 0) {
        console.warn("[PJe Sync] Nenhum processo encontrado");
        this.updateBadge("!", "#FF9800");
        return;
      }

      // Extrai expedientes
      const expedientes = this.expedienteExtractor.extractExpedientes(processos);

      // Envia para background
      await this.sendToBackground("SYNC_PROCESSOS", processos);

      if (expedientes.length > 0) {
        await this.sendToBackground("SYNC_EXPEDIENTES", expedientes);
      }

      this.lastSync = Date.now();
      this.updateBadge("✓", "#4CAF50"); // Verde = sucesso

      console.log(
        `[PJe Sync] Sincronizado: ${processos.length} processos, ${expedientes.length} expedientes`
      );
    } catch (error) {
      console.error("[PJe Sync] Erro na sincronização:", error);
      this.updateBadge("✗", "#F44336"); // Vermelho = erro
    } finally {
      this.syncInProgress = false;
    }
  }

  private async sendToBackground(type: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data, timestamp: Date.now() }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error || "Unknown error"));
        }
      });
    });
  }

  private addSyncBadge(): void {
    // Adiciona badge visual no canto superior direito
    const badge = document.createElement("div");
    badge.id = "pje-sync-badge";
    badge.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: #4CAF50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.3s;
    `;
    badge.textContent = "✓";
    badge.title = "PJe Sync - Conectado";

    badge.addEventListener("click", () => this.syncNow());
    document.body.appendChild(badge);
  }

  private updateBadge(text: string, color: string): void {
    const badge = document.getElementById("pje-sync-badge");
    if (badge) {
      badge.textContent = text;
      badge.style.background = color;
    }
  }
}

// Inicializa
new PJeContentScript();
