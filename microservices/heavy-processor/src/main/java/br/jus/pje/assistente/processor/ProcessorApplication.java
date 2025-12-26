package br.jus.pje.assistente.processor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Heavy Processor Microservice
 *
 * Microserviço Spring Boot 3.2+ com Java 21 (LTS) usando Virtual Threads (Project Loom)
 * para processar tarefas pesadas de forma assíncrona e escalável.
 *
 * Características:
 * - Virtual Threads (Project Loom) - milhões de threads concorrentes
 * - Spring Boot 3.2+ - suporte nativo para Virtual Threads
 * - Processamento em lote de Expedientes
 * - Extração de texto de PDFs
 * - Streaming Server-Sent Events (SSE)
 *
 * @author Assistente Jurídico Team
 * @since 2025-12-26
 */
@SpringBootApplication
@EnableAsync
public class ProcessorApplication {

    public static void main(String[] args) {
        // Habilita Virtual Threads globalmente
        System.setProperty("spring.threads.virtual.enabled", "true");
        SpringApplication.run(ProcessorApplication.class, args);
    }

    /**
     * Configura executor com Virtual Threads para tarefas assíncronas
     */
    @Bean(name = "virtualThreadExecutor")
    public Executor virtualThreadExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
