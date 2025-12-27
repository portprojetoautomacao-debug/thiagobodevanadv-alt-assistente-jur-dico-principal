package br.jus.pje.assistente.processor.model;

import lombok.Data;

import java.util.Map;

/**
 * Processor Result Model
 */
@Data
public class ProcessorResult {
    private String expedienteId;
    private boolean success;
    private Map<String, Object> data;
    private String error;
}
