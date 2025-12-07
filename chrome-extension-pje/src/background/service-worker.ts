/**
 * Background Service Worker
 */

import { SyncManager } from "./sync-manager";

console.log("[PJe Sync] Background Service Worker iniciado");

// Inicializa gerenciador de sincronização
new SyncManager();

// Evento de instalação
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[PJe Sync] onInstalled:", details.reason);

  if (details.reason === "install") {
    // Primeira instalação - mostra página de boas-vindas
    chrome.tabs.create({
      url: "https://assistente-juridico-p.vercel.app/extensao-instalada",
    });
  } else if (details.reason === "update") {
    // Atualização
    console.log("[PJe Sync] Extensão atualizada para versão", chrome.runtime.getManifest().version);
  }
});

// Mantém service worker ativo
chrome.runtime.onSuspend.addListener(() => {
  console.log("[PJe Sync] Service Worker sendo suspenso");
});

// Log de erros não tratados
self.addEventListener("error", (event) => {
  console.error("[PJe Sync] Erro global:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[PJe Sync] Promise rejeitada:", event.reason);
});
