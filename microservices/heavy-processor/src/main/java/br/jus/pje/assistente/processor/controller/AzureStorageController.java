package br.jus.pje.assistente.processor.controller;

import br.jus.pje.assistente.processor.service.AzureStorageIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Azure Storage Controller
 *
 * Endpoints para processar documentos do Azure Storage
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/azure")
@RequiredArgsConstructor
public class AzureStorageController {

    private final AzureStorageIntegrationService azureStorageService;

    /**
     * Extrai texto de um PDF específico no Azure Storage
     */
    @GetMapping("/extract-pdf")
    public ResponseEntity<Map<String, Object>> extractPdf(@RequestParam String blobName) {

        log.info("Extraindo texto de PDF: {}", blobName);

        try {
            String text = azureStorageService.extractTextFromAzureBlob(blobName);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "blobName", blobName,
                "text", text,
                "length", text.length()
            ));

        } catch (Exception e) {
            log.error("Erro ao extrair PDF", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", e.getMessage()
                ));
        }
    }

    /**
     * Lista todos os blobs de um processo
     */
    @GetMapping("/list-blobs/{processNumber}")
    public ResponseEntity<Map<String, Object>> listBlobs(@PathVariable String processNumber) {

        log.info("Listando blobs do processo: {}", processNumber);

        try {
            List<String> blobs = azureStorageService.listProcessBlobs(processNumber);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "processNumber", processNumber,
                "blobs", blobs,
                "count", blobs.size()
            ));

        } catch (Exception e) {
            log.error("Erro ao listar blobs", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", e.getMessage()
                ));
        }
    }

    /**
     * Processa TODOS os PDFs de um processo em paralelo
     *
     * IDEAL PARA CENTENAS DE PÁGINAS:
     * - Download paralelo de múltiplos PDFs
     * - Extração de texto em Virtual Threads
     * - Sem bloqueio de threads de plataforma
     */
    @PostMapping("/process-all-pdfs")
    public ResponseEntity<Map<String, Object>> processAllPdfs(@RequestBody Map<String, String> request) {

        String processNumber = request.get("processNumber");

        if (processNumber == null || processNumber.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "success", false,
                    "error", "processNumber é obrigatório"
                ));
        }

        log.info("Processando TODOS os PDFs do processo {} em paralelo", processNumber);
        long startTime = System.currentTimeMillis();

        try {
            Map<String, String> results = azureStorageService.processAllPdfsInParallel(processNumber);

            long durationMs = System.currentTimeMillis() - startTime;
            int totalChars = results.values().stream()
                .mapToInt(String::length)
                .sum();

            log.info("✅ {} PDFs processados em {}ms, {} caracteres extraídos",
                    results.size(), durationMs, totalChars);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "processNumber", processNumber,
                "results", results,
                "totalPdfs", results.size(),
                "totalCharacters", totalChars,
                "durationMs", durationMs
            ));

        } catch (Exception e) {
            log.error("Erro ao processar PDFs", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", e.getMessage()
                ));
        }
    }
}
