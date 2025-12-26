/**
 * Azure Blob Storage Service
 *
 * Serviço para upload e gerenciamento de autos processuais no Azure Blob Storage
 * Suporta upload direto, análise automática e integração com agentes
 */

import { BlobServiceClient, BlockBlobClient, ContainerClient } from "@azure/storage-blob";

export interface AzureStorageConfig {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  containerName: string;
}

export interface UploadResult {
  success: boolean;
  blobName: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  error?: string;
}

export interface ProcessDocument {
  id: string;
  processNumber: string;
  fileName: string;
  blobName: string;
  url: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  analyzedAt?: Date;
  status: "pending" | "analyzing" | "analyzed" | "error";
  extractedText?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Serviço de integração com Azure Blob Storage
 */
export class AzureBlobStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerClient: ContainerClient | null = null;
  private config: AzureStorageConfig;

  constructor(config?: Partial<AzureStorageConfig>) {
    this.config = {
      connectionString: import.meta.env.VITE_AZURE_STORAGE_CONNECTION_STRING,
      accountName: import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME,
      accountKey: import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_KEY,
      containerName: config?.containerName || "process-documents",
      ...config,
    };
  }

  /**
   * Inicializa conexão com Azure Blob Storage
   */
  async initialize(): Promise<boolean> {
    try {
      // Prioridade: Connection String > Account Name + Key
      if (this.config.connectionString) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          this.config.connectionString
        );
      } else if (this.config.accountName && this.config.accountKey) {
        const accountUrl = `https://${this.config.accountName}.blob.core.windows.net`;
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          `DefaultEndpointsProtocol=https;AccountName=${this.config.accountName};AccountKey=${this.config.accountKey};EndpointSuffix=core.windows.net`
        );
      } else {
        console.error("[Azure Storage] Credenciais não configuradas");
        return false;
      }

      // Obter container client
      this.containerClient = this.blobServiceClient.getContainerClient(this.config.containerName);

      // Criar container se não existir
      await this.containerClient.createIfNotExists({
        access: "blob",
      });

      console.log(`[Azure Storage] ✅ Conectado ao container: ${this.config.containerName}`);
      return true;
    } catch (error) {
      console.error("[Azure Storage] Erro ao inicializar:", error);
      return false;
    }
  }

  /**
   * Upload de arquivo para Azure Blob Storage
   */
  async uploadFile(
    file: File,
    processNumber: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      if (!this.containerClient) {
        await this.initialize();
      }

      if (!this.containerClient) {
        throw new Error("Container client não inicializado");
      }

      // Gerar nome único para o blob
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const blobName = `${processNumber}/${timestamp}_${sanitizedFileName}`;

      // Upload do arquivo
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      const uploadBlobResponse = await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: file.type || "application/pdf",
        },
        metadata: {
          processNumber,
          uploadedBy: "assistente-juridico",
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      });

      console.log(`[Azure Storage] ✅ Upload concluído: ${blobName}`, uploadBlobResponse.requestId);

      return {
        success: true,
        blobName,
        url: blockBlobClient.url,
        size: file.size,
        contentType: file.type,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error("[Azure Storage] Erro no upload:", error);
      return {
        success: false,
        blobName: "",
        url: "",
        size: 0,
        contentType: "",
        uploadedAt: new Date(),
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Lista arquivos de um processo
   */
  async listProcessFiles(processNumber: string): Promise<ProcessDocument[]> {
    try {
      if (!this.containerClient) {
        await this.initialize();
      }

      if (!this.containerClient) {
        throw new Error("Container client não inicializado");
      }

      const documents: ProcessDocument[] = [];
      const prefix = `${processNumber}/`;

      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blob.name);
        const properties = await blockBlobClient.getProperties();

        documents.push({
          id: blob.name,
          processNumber,
          fileName: blob.name.split("/").pop() || blob.name,
          blobName: blob.name,
          url: blockBlobClient.url,
          size: blob.properties.contentLength || 0,
          contentType: blob.properties.contentType || "application/pdf",
          uploadedAt: blob.properties.createdOn || new Date(),
          status: (properties.metadata?.status as any) || "pending",
          metadata: properties.metadata,
        });
      }

      return documents;
    } catch (error) {
      console.error("[Azure Storage] Erro ao listar arquivos:", error);
      return [];
    }
  }

  /**
   * Download de arquivo do blob storage
   */
  async downloadFile(blobName: string): Promise<Blob | null> {
    try {
      if (!this.containerClient) {
        await this.initialize();
      }

      if (!this.containerClient) {
        throw new Error("Container client não inicializado");
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download();

      if (!downloadResponse.readableStreamBody) {
        throw new Error("Stream de download vazio");
      }

      // Converter stream para blob
      const chunks: Uint8Array[] = [];
      const stream = downloadResponse.readableStreamBody as unknown as ReadableStream<Uint8Array>;
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Converter Uint8Array[] para BlobPart[] usando slice() para criar cópia do ArrayBuffer
      const blobParts: ArrayBuffer[] = chunks.map((chunk) => {
        // slice() cria uma cópia real do ArrayBuffer, não apenas uma referência
        const buffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
        // Garantir que seja ArrayBuffer, não SharedArrayBuffer
        return buffer as ArrayBuffer;
      });

      const blob = new Blob(blobParts, {
        type: downloadResponse.contentType || "application/pdf",
      });

      return blob;
    } catch (error) {
      console.error("[Azure Storage] Erro no download:", error);
      return null;
    }
  }

  /**
   * Deleta arquivo do blob storage
   */
  async deleteFile(blobName: string): Promise<boolean> {
    try {
      if (!this.containerClient) {
        await this.initialize();
      }

      if (!this.containerClient) {
        throw new Error("Container client não inicializado");
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();

      console.log(`[Azure Storage] ✅ Arquivo deletado: ${blobName}`);
      return true;
    } catch (error) {
      console.error("[Azure Storage] Erro ao deletar:", error);
      return false;
    }
  }

  /**
   * Atualiza metadata de um blob
   */
  async updateMetadata(blobName: string, metadata: Record<string, string>): Promise<boolean> {
    try {
      if (!this.containerClient) {
        await this.initialize();
      }

      if (!this.containerClient) {
        throw new Error("Container client não inicializado");
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.setMetadata(metadata);

      return true;
    } catch (error) {
      console.error("[Azure Storage] Erro ao atualizar metadata:", error);
      return false;
    }
  }

  /**
   * Verifica se container está configurado e acessível
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.containerClient) {
        await this.initialize();
      }

      if (!this.containerClient) {
        return false;
      }

      await this.containerClient.exists();
      return true;
    } catch (error) {
      console.error("[Azure Storage] Health check falhou:", error);
      return false;
    }
  }
}

// Exportar instância singleton
export const azureStorage = new AzureBlobStorageService();
