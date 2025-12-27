package br.jus.pje.assistente.processor.model;

import lombok.Data;

import java.util.List;

/**
 * Processor Response Model
 */
@Data
public class ProcessorResponse {
    private boolean success;
    private List<ProcessorResult> results;
    private long executionTimeMs;
    private int threadsUsed;
    private String error;
}
