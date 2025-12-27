package br.jus.pje.assistente.processor.service;

import br.jus.pje.assistente.processor.model.Expediente;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Analysis Service
 *
 * Analisa expedientes (placeholder para futura integração com IA)
 */
@Slf4j
@Service
public class AnalysisService {

    public String analyze(Expediente expediente) {
        log.info("Analisando expediente: {}", expediente.getId());
        return "Análise do expediente " + expediente.getId();
    }
}
