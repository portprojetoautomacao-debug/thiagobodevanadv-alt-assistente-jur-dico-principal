package br.jus.pje.assistente.processor.controller;

import br.jus.pje.assistente.processor.model.ProcessorRequest;
import br.jus.pje.assistente.processor.model.ProcessorResponse;
import br.jus.pje.assistente.processor.model.StreamingChunk;
import br.jus.pje.assistente.processor.service.HeavyProcessorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

/**
 * Processor REST Controller
 *
 * Expõe endpoints para processamento pesado via Virtual Threads
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/process")
@RequiredArgsConstructor
public class ProcessorController {

    private final HeavyProcessorService processorService;

    /**
     * Endpoint para processamento em lote (não-streaming)
     */
    @PostMapping("/batch")
    public CompletableFuture<ResponseEntity<ProcessorResponse>> processBatch(
            @RequestBody ProcessorRequest request) {

        log.info("Recebida requisição de processamento em lote: {} expedientes",
                request.getExpedientes().size());

        return processorService.processBatch(request)
            .thenApply(ResponseEntity::ok);
    }

    /**
     * Endpoint para processamento com streaming (SSE)
     *
     * Envia atualizações em tempo real para o frontend via Server-Sent Events
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<StreamingChunk> processWithStreaming(@RequestBody ProcessorRequest request) {

        log.info("Recebida requisição de processamento streaming: {} expedientes",
                request.getExpedientes().size());

        // Retorna um Flux que emite chunks conforme o processamento avança
        return Flux.fromIterable(request.getExpedientes())
            .flatMap(expediente -> {
                // Processa cada expediente e emite progresso
                StreamingChunk chunk = new StreamingChunk();
                chunk.setExpedienteId(expediente.getId());
                chunk.setStatus("processing");
                chunk.setProgress(0.0);

                return Flux.just(chunk)
                    .concatWith(
                        Flux.defer(() -> {
                            // Simula processamento (substituir por lógica real)
                            try {
                                Thread.sleep(100); // Virtual Thread - não bloqueia!
                            } catch (InterruptedException e) {
                                Thread.currentThread().interrupt();
                            }

                            StreamingChunk completed = new StreamingChunk();
                            completed.setExpedienteId(expediente.getId());
                            completed.setStatus("completed");
                            completed.setProgress(100.0);
                            completed.setChunk("Processamento concluído para " + expediente.getId());

                            return Flux.just(completed);
                        })
                    )
                    .delayElements(Duration.ofMillis(50));
            });
    }
}
