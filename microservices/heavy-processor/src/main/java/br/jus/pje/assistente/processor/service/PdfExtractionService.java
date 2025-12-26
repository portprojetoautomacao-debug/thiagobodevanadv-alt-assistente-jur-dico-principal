package br.jus.pje.assistente.processor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URL;

/**
 * PDF Extraction Service
 *
 * Extrai texto de PDFs usando Apache PDFBox
 * Otimizado para Virtual Threads (I/O bloqueante)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExtractionService {

    private final AzureStorageIntegrationService azureStorageService;

    /**
     * Extrai texto de PDF por URL ou blob name
     */
    public String extractText(String source) {
        log.info("Extraindo texto de: {}", source);

        try {
            // Se é um blob name do Azure Storage
            if (!source.startsWith("http") && source.contains("/")) {
                return azureStorageService.extractTextFromAzureBlob(source);
            }

            // Se é uma URL
            if (source.startsWith("http")) {
                return extractFromUrl(source);
            }

            // Caso contrário, assumir que é conteúdo direto
            log.warn("Fonte não reconhecida, retornando placeholder");
            return "Texto extraído do PDF (implementar PDFBox)";

        } catch (Exception e) {
            log.error("Erro ao extrair texto", e);
            return "ERRO: " + e.getMessage();
        }
    }

    /**
     * Extrai texto de PDF via URL
     */
    private String extractFromUrl(String url) throws IOException {
        log.info("Baixando PDF de URL: {}", url);

        try (PDDocument document = PDDocument.load(new URL(url).openStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            log.info("✅ {} páginas extraídas, {} caracteres",
                    document.getNumberOfPages(), text.length());

            return text;
        }
    }

    /**
     * Extrai texto de PDF de bytes
     */
    public String extractFromBytes(byte[] pdfBytes) throws IOException {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
