package br.jus.pje.assistente.processor.model;

import lombok.Data;

/**
 * Streaming Chunk Model (SSE)
 */
@Data
public class StreamingChunk {
    private String expedienteId;
    private double progress;
    private String status; // "processing" | "completed" | "error"
    private String chunk;
}
