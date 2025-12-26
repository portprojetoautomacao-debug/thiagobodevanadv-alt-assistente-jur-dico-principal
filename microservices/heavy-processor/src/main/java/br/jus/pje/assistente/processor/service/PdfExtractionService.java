package br.jus.pje.assistente.processor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * PDF Extraction Service
 *
 * Extrai texto de PDFs usando Apache PDFBox ou similar
 */
@Slf4j
@Service
public class PdfExtractionService {

    public String extractText(String pdfUrl) {
        // TODO: Implementar extração real com Apache PDFBox
        log.info("Extraindo texto de PDF: {}", pdfUrl);
        return "Texto extraído do PDF (implementar PDFBox)";
    }
}
