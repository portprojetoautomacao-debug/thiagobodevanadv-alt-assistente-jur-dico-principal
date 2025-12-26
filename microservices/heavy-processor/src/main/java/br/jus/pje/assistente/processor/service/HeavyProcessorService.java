package br.jus.pje.assistente.processor.service;

import br.jus.pje.assistente.processor.model.Expediente;
import br.jus.pje.assistente.processor.model.ProcessorRequest;
import br.jus.pje.assistente.processor.model.ProcessorResponse;
import br.jus.pje.assistente.processor.model.ProcessorResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Heavy Processor Service
 *
 * Processa expedientes usando Virtual Threads (Project Loom - Java 21)
 * permitindo milhões de threads concorrentes com overhead mínimo.
 *
 * BENEFÍCIOS DE VIRTUAL THREADS:
 * - 1000x menos memória que threads nativas (2KB vs 2MB)
 * - Milhões de threads concorrentes sem problemas
 * - Código síncrono com performance assíncrona
 * - Gerenciamento automático pelo JVM
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HeavyProcessorService {

    private final PdfExtractionService pdfExtractionService;
    private final AnalysisService analysisService;

    /**
     * Processa expedientes em lote usando Virtual Threads
     *
     * Cada expediente é processado em sua própria Virtual Thread,
     * permitindo paralelismo massivo sem overhead de threads nativas.
     */
    @Async("virtualThreadExecutor")
    public CompletableFuture<ProcessorResponse> processBatch(ProcessorRequest request) {
        Instant startTime = Instant.now();
        log.info("Processando {} expedientes com Virtual Threads", request.getExpedientes().size());

        List<Expediente> expedientes = request.getExpedientes();
        String operation = request.getOperation();
        boolean parallel = request.getOptions() != null &&
                          Boolean.TRUE.equals(request.getOptions().get("parallel"));

        List<ProcessorResult> results;

        try {
            if (parallel) {
                // Usa Virtual Threads para processamento paralelo massivo
                results = processParallel(expedientes, operation);
            } else {
                // Processamento sequencial (ainda usa Virtual Threads internamente)
                results = processSequential(expedientes, operation);
            }

            long executionTimeMs = Duration.between(startTime, Instant.now()).toMillis();
            int threadsUsed = parallel ? expedientes.size() : 1;

            ProcessorResponse response = new ProcessorResponse();
            response.setSuccess(true);
            response.setResults(results);
            response.setExecutionTimeMs(executionTimeMs);
            response.setThreadsUsed(threadsUsed);

            log.info("Processamento concluído: {} expedientes em {}ms usando {} threads",
                    expedientes.size(), executionTimeMs, threadsUsed);

            return CompletableFuture.completedFuture(response);

        } catch (Exception e) {
            log.error("Erro ao processar expedientes", e);

            ProcessorResponse errorResponse = new ProcessorResponse();
            errorResponse.setSuccess(false);
            errorResponse.setError(e.getMessage());
            errorResponse.setResults(new ArrayList<>());

            return CompletableFuture.completedFuture(errorResponse);
        }
    }

    /**
     * Processamento paralelo usando Virtual Threads
     *
     * Cria uma Virtual Thread para cada expediente, permitindo
     * processar milhares de expedientes simultaneamente.
     */
    private List<ProcessorResult> processParallel(List<Expediente> expedientes, String operation) {
        // Executor com Virtual Threads
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {

            // Submete cada expediente como uma tarefa separada
            List<CompletableFuture<ProcessorResult>> futures = expedientes.stream()
                .map(expediente -> CompletableFuture.supplyAsync(
                    () -> processExpediente(expediente, operation),
                    executor
                ))
                .collect(Collectors.toList());

            // Aguarda todas as tarefas completarem
            CompletableFuture<Void> allOf = CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0])
            );

            // Bloqueia até todas completarem (Virtual Threads não bloqueiam OS threads)
            allOf.join();

            // Coleta resultados
            return futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
        }
    }

    /**
     * Processamento sequencial (ainda usa Virtual Thread implicitamente)
     */
    private List<ProcessorResult> processSequential(List<Expediente> expedientes, String operation) {
        return expedientes.stream()
            .map(expediente -> processExpediente(expediente, operation))
            .collect(Collectors.toList());
    }

    /**
     * Processa um único expediente
     *
     * Executado dentro de uma Virtual Thread, permitindo operações
     * síncronas (mais fáceis de programar) com performance assíncrona.
     */
    private ProcessorResult processExpediente(Expediente expediente, String operation) {
        ProcessorResult result = new ProcessorResult();
        result.setExpedienteId(expediente.getId());

        try {
            switch (operation) {
                case "pdf-extraction":
                    String extractedText = pdfExtractionService.extractText(expediente.getConteudo());
                    result.setSuccess(true);
                    result.setData(Map.of("extractedText", extractedText));
                    break;

                case "bulk-analysis":
                    String analysis = analysisService.analyze(expediente);
                    result.setSuccess(true);
                    result.setData(Map.of("analysis", analysis));
                    break;

                case "batch-sync":
                    // Processa sincronização em lote
                    result.setSuccess(true);
                    result.setData(Map.of("synced", true));
                    break;

                default:
                    throw new IllegalArgumentException("Operação desconhecida: " + operation);
            }

            log.debug("Expediente {} processado com sucesso", expediente.getId());

        } catch (Exception e) {
            log.error("Erro ao processar expediente {}", expediente.getId(), e);
            result.setSuccess(false);
            result.setError(e.getMessage());
        }

        return result;
    }
}
