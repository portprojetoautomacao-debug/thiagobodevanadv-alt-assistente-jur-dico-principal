package br.jus.pje.assistente.processor.model;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Processor Request Model
 */
@Data
public class ProcessorRequest {
    private List<Expediente> expedientes;
    private String operation; // "pdf-extraction" | "batch-sync" | "bulk-analysis"
    private Map<String, Object> options;
}
