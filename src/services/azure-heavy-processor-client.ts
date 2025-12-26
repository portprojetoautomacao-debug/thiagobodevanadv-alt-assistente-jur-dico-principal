/**
 * Azure Storage + Heavy Processor Integration
 *
 * Cliente TypeScript para processar documentos grandes do Azure Storage
 * usando o Heavy Processor Java com Virtual Threads
 */

import { getHeavyProcessorClient } from "./heavy-processor-client";

export interface AzurePdfExtractionRequest {
  blobName: string; // Ex: "0001234-56.2024.8.02.0001/1704067200000_auto_completo.pdf"
  processNumber?: string;
}

export interface AzurePdfExtractionResult {
  success: boolean;
  blobName: string;
  text: string;
  length: number;
  pages?: number;
  durationMs?: number;
  error?: string;
}

export interface AzureProcessBatchRequest {
  processNumber: string; // Ex: "0001234-56.2024.8.02.0001"
  parallel?: boolean;
}

export interface AzureProcessBatchResult {
  success: boolean;
  processNumber: string;
  results: Record<string, string>; // { blobName: extractedText }
  totalPdfs: number;
  totalCharacters: number;
  durationMs: number;
  error?: string;
}

/**
 * Cliente para integração Azure Storage + Heavy Processor
 */
export class AzureHeavyProcessorClient {
  private heavyProcessor = getHeavyProcessorClient();

  /**
   * Extrai texto de um PDF específico no Azure Storage
   */
  async extractPdfFromAzure(request: AzurePdfExtractionRequest): Promise<AzurePdfExtractionResult> {
    const available = await this.heavyProcessor.isAvailable();

    if (!available) {
      throw new Error("Heavy Processor não disponível");
    }

    const response = await fetch(
      `${this.heavyProcessor["config"].baseUrl}/api/v1/azure/extract-pdf?blobName=${encodeURIComponent(request.blobName)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.heavyProcessor["config"].apiKey && {
            Authorization: `Bearer ${this.heavyProcessor["config"].apiKey}`,
          }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao extrair PDF: ${error}`);
    }

    return await response.json();
  }

  /**
   * Processa TODOS os PDFs de um processo em paralelo
   *
   * IDEAL PARA CENTENAS DE PÁGINAS:
   * - Usa Virtual Threads Java para processar em paralelo
   * - Não bloqueia frontend
   * - Sem timeout do Vercel
   */
  async processAllPdfs(request: AzureProcessBatchRequest): Promise<AzureProcessBatchResult> {
    const available = await this.heavyProcessor.isAvailable();

    if (!available) {
      throw new Error("Heavy Processor não disponível");
    }

    console.log(
      `[Azure-Heavy] Processando todos os PDFs do processo ${request.processNumber} em paralelo`
    );

    const response = await fetch(
      `${this.heavyProcessor["config"].baseUrl}/api/v1/azure/process-all-pdfs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.heavyProcessor["config"].apiKey && {
            Authorization: `Bearer ${this.heavyProcessor["config"].apiKey}`,
          }),
        },
        body: JSON.stringify({
          processNumber: request.processNumber,
          parallel: request.parallel ?? true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao processar PDFs: ${error}`);
    }

    const result: AzureProcessBatchResult = await response.json();

    console.log(
      `[Azure-Heavy] ✅ ${result.totalPdfs} PDFs processados em ${result.durationMs}ms, ${result.totalCharacters} caracteres`
    );

    return result;
  }

  /**
   * Lista blobs de um processo
   */
  async listProcessBlobs(processNumber: string): Promise<string[]> {
    const available = await this.heavyProcessor.isAvailable();

    if (!available) {
      throw new Error("Heavy Processor não disponível");
    }

    const response = await fetch(
      `${this.heavyProcessor["config"].baseUrl}/api/v1/azure/list-blobs/${processNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(this.heavyProcessor["config"].apiKey && {
            Authorization: `Bearer ${this.heavyProcessor["config"].apiKey}`,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao listar blobs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.blobs || [];
  }
}

// Singleton instance
let azureHeavyProcessorClient: AzureHeavyProcessorClient | null = null;

export function getAzureHeavyProcessorClient(): AzureHeavyProcessorClient {
  if (!azureHeavyProcessorClient) {
    azureHeavyProcessorClient = new AzureHeavyProcessorClient();
  }
  return azureHeavyProcessorClient;
}
