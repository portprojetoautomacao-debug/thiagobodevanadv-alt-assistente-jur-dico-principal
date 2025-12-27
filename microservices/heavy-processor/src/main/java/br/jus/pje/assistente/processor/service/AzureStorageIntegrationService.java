package br.jus.pje.assistente.processor.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Azure Storage Integration Service
 *
 * Integra com Azure Blob Storage para processar documentos grandes
 * armazenados via Azure Storage Explorer
 *
 * USAR VIRTUAL THREADS: Operações de I/O (download blob, leitura PDF)
 * são ideais para Virtual Threads - não bloqueiam threads de plataforma
 */
@Slf4j
@Service
public class AzureStorageIntegrationService {

    @Value("${azure.storage.connection-string}")
    private String connectionString;

    @Value("${azure.storage.container-name:process-documents}")
    private String containerName;

    private BlobServiceClient blobServiceClient;
    private BlobContainerClient containerClient;

    /**
     * Inicializa conexão com Azure Storage
     * Chamado automaticamente pelo Spring na primeira requisição
     */
    public void initialize() {
        if (blobServiceClient == null) {
            log.info("Inicializando Azure Storage Client...");

            blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

            containerClient = blobServiceClient.getBlobContainerClient(containerName);

            // Criar container se não existir
            if (!containerClient.exists()) {
                containerClient.create();
                log.info("Container {} criado", containerName);
            }

            log.info("✅ Azure Storage conectado: {}", containerName);
        }
    }

    /**
     * Download de blob do Azure Storage
     *
     * Virtual Thread permite download de múltiplos arquivos
     * simultaneamente sem bloquear threads de plataforma
     */
    public byte[] downloadBlob(String blobName) throws IOException {
        initialize();

        log.debug("Baixando blob: {}", blobName);

        BlobClient blobClient = containerClient.getBlobClient(blobName);

        if (!blobClient.exists()) {
            throw new IOException("Blob não encontrado: " + blobName);
        }

        // Download do blob
        try (InputStream inputStream = blobClient.openInputStream()) {
            byte[] bytes = inputStream.readAllBytes();
            log.info("✅ Blob baixado: {} ({} KB)", blobName, bytes.length / 1024);
            return bytes;
        }
    }

    /**
     * Extrai texto de PDF armazenado no Azure Storage
     *
     * IDEAL PARA VIRTUAL THREADS:
     * - Download do Azure (I/O bloqueante)
     * - Leitura do PDF (I/O bloqueante)
     * - Processamento pode levar minutos para PDFs de centenas de páginas
     */
    public String extractTextFromAzureBlob(String blobName) throws IOException {
        initialize();

        log.info("Extraindo texto de PDF no Azure: {}", blobName);
        long startTime = System.currentTimeMillis();

        // 1. Download do blob (I/O bloqueante - Virtual Thread não bloqueia!)
        byte[] pdfBytes = downloadBlob(blobName);

        // 2. Processar PDF com PDFBox (I/O intensivo)
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {

            int totalPages = document.getNumberOfPages();
            log.info("PDF com {} páginas - processando...", totalPages);

            // PDFBox é thread-safe, perfeito para Virtual Threads
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            long durationMs = System.currentTimeMillis() - startTime;
            log.info("✅ Texto extraído: {} páginas, {} caracteres em {}ms",
                    totalPages, text.length(), durationMs);

            return text;
        } catch (IOException e) {
            log.error("Erro ao processar PDF: {}", blobName, e);
            throw e;
        }
    }

    /**
     * Lista todos os blobs de um processo
     */
    public java.util.List<String> listProcessBlobs(String processNumber) {
        initialize();

        String prefix = processNumber + "/";

        return containerClient.listBlobs()
            .stream()
            .filter(blob -> blob.getName().startsWith(prefix))
            .map(blob -> blob.getName())
            .toList();
    }

    /**
     * Processa todos os PDFs de um processo em paralelo
     * usando Virtual Threads
     */
    public java.util.Map<String, String> processAllPdfsInParallel(String processNumber) {
        initialize();

        log.info("Processando todos os PDFs do processo {} em paralelo", processNumber);

        java.util.List<String> blobNames = listProcessBlobs(processNumber);

        // Usar Virtual Thread Executor para processar em paralelo
        try (java.util.concurrent.ExecutorService executor =
                java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {

            java.util.List<java.util.concurrent.CompletableFuture<java.util.Map.Entry<String, String>>> futures =
                blobNames.stream()
                    .filter(name -> name.endsWith(".pdf"))
                    .map(blobName -> java.util.concurrent.CompletableFuture.supplyAsync(
                        () -> {
                            try {
                                String text = extractTextFromAzureBlob(blobName);
                                return java.util.Map.entry(blobName, text);
                            } catch (IOException e) {
                                log.error("Erro ao processar {}", blobName, e);
                                return java.util.Map.entry(blobName, "ERROR: " + e.getMessage());
                            }
                        },
                        executor
                    ))
                    .toList();

            // Aguardar todos completarem
            java.util.concurrent.CompletableFuture.allOf(
                futures.toArray(new java.util.concurrent.CompletableFuture[0])
            ).join();

            // Coletar resultados
            return futures.stream()
                .map(java.util.concurrent.CompletableFuture::join)
                .collect(java.util.stream.Collectors.toMap(
                    java.util.Map.Entry::getKey,
                    java.util.Map.Entry::getValue
                ));
        }
    }
}
