package br.jus.pje.assistente.processor.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Expediente Model
 *
 * Espelha a interface TypeScript Expediente de src/types.ts
 * Mantém compatibilidade com payload JSON do frontend
 */
@Data
public class Expediente {

    private String id;

    @JsonProperty("processId")
    private String processId;

    private String tipo; // "intimacao" | "citacao" | "documento" | "outro"

    private String type;

    private String titulo;

    private String conteudo;

    private String content;

    private String descricao;

    @JsonProperty("dataRecebimento")
    private String dataRecebimento;

    @JsonProperty("receivedAt")
    private String receivedAt;

    @JsonProperty("prazoFatal")
    private String prazoFatal;

    private Object deadline; // Pode ser String ou Map

    private Boolean lido;

    private Boolean arquivado;

    private Boolean analyzed;

    private Boolean processado;

    private Boolean urgente;

    private List<String> tags;

    private String summary;

    @JsonProperty("suggestedAction")
    private String suggestedAction;

    @JsonProperty("pendingDocs")
    private List<String> pendingDocs;

    @JsonProperty("draftPetition")
    private String draftPetition;

    private String priority; // "low" | "medium" | "high" | "urgent"

    // Campos DJEN
    private String tribunal;

    @JsonProperty("numeroProcesso")
    private String numeroProcesso;

    private String orgao;

    private String teor;

    @JsonProperty("lawyerName")
    private String lawyerName;

    @JsonProperty("matchType")
    private String matchType;

    private String source;

    @JsonProperty("createdAt")
    private String createdAt;

    private String data;

    // Campos adicionais
    private String status; // "pendente" | "em-analise" | "processado" | "arquivado" | "erro"

    private String prioridade; // "baixa" | "media" | "alta" | "urgente" | "critica"

    private Map<String, Object> prazo;
}
