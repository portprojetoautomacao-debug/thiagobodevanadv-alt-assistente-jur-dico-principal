---
name: legal-document-assistant
description: Assistente especializado em documentos jurídicos brasileiros (petições, contratos, manifestações) para o Assistente Jurídico PJe
---

# Legal Document Assistant

## Overview
Esta skill auxilia na criação, edição e formatação de documentos jurídicos seguindo os padrões brasileiros e as convenções do Assistente Jurídico PJe.

## Usage
Use quando precisar:
- Criar petições, manifestações, recursos
- Revisar documentos jurídicos
- Formatar conforme normas ABNT/tribunais
- Inserir variáveis dinâmicas
- Gerar minutas automáticas

## Document Types

### 1. Petição Inicial
**Estrutura:**
```
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA [VARA]

[PARTE AUTORA], [qualificação], vem, respeitosamente, à presença de Vossa Excelência, por meio de seu advogado que esta subscreve, propor

AÇÃO [TIPO]

em face de [PARTE RÉ], pelos fatos e fundamentos a seguir expostos:

I - DOS FATOS
[Narrativa dos fatos]

II - DO DIREITO
[Fundamentação jurídica]

III - DOS PEDIDOS
[Pedidos específicos]

[Local], [data].

[Nome do Advogado]
OAB/[UF] [número]
```

### 2. Contestação
**Estrutura:**
```
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA [VARA]

Processo nº [número CNJ]

[PARTE RÉ], nos autos da ação [tipo] que lhe move [PARTE AUTORA], vem, respeitosamente, à presença de Vossa Excelência, por meio de seu advogado que esta subscreve, apresentar

CONTESTAÇÃO

pelos fundamentos de fato e de direito a seguir expostos:

I - PRELIMINARMENTE
[Preliminares]

II - DO MÉRITO
[Defesa de mérito]

III - DOS PEDIDOS
[Pedidos]
```

### 3. Recurso de Apelação
**Estrutura padrão CPC/2015**

## Formatting Standards

### ABNT NBR 6023 (Referências)
```
AUTOR. Título. Edição. Local: Editora, ano.
```

### Citações (Art. 11, CPC/2015)
```
"[texto]" (TRIBUNAL, Processo nº, Relator, julgamento, publicação)
```

### Numeração
- Seções em ROMANO (I, II, III)
- Artigos em arábico (1, 2, 3)
- Alíneas em letras (a, b, c)

## Variables System

**Variáveis disponíveis:**
```
{{processo.numero}} - Número CNJ
{{processo.partes.autor}} - Nome do autor
{{processo.partes.reu}} - Nome do réu
{{processo.valor}} - Valor da causa formatado
{{processo.comarca}} - Comarca
{{processo.vara}} - Vara
{{advogado.nome}} - Nome do advogado
{{advogado.oab}} - OAB do advogado
{{data.hoje}} - Data atual
{{data.prazo}} - Data do prazo
```

**Uso no template:**
```markdown
Processo nº {{processo.numero}}

{{processo.partes.autor}} vs {{processo.partes.reu}}

Valor da Causa: {{processo.valor}}
```

## Integration with CKEditor

**Como inserir conteúdo gerado:**
```typescript
// Via streaming
const stream = streamGeminiResponse(prompt);
for await (const chunk of stream) {
  editor.model.change(writer => {
    writer.insertText(chunk, position);
  });
}

// Com variáveis
const template = loadTemplate('peticao-inicial');
const content = replaceTemplateVariables(template, {
  'processo.numero': processo.numero,
  'processo.partes.autor': processo.partes.autor
});
```

## Quality Checklist

Antes de finalizar documento:
- [ ] Formatação ABNT correta
- [ ] Todas as variáveis substituídas
- [ ] Citações com referências completas
- [ ] Numeração consistente
- [ ] Português correto (sem inglês)
- [ ] Assinatura e OAB presentes
- [ ] Data atualizada
- [ ] Protocolo eletrônico compatível (PJe)

## Commands

```bash
# Gerar minuta
@workspace Cria petição inicial para [caso]

# Revisar documento
@workspace Revisa contestação seguindo padrões ABNT

# Inserir variáveis
@workspace Substitui variáveis no template de recurso

# Validar formato
@workspace Valida formatação da manifestação para PJe
```

## Examples

### Exemplo 1: Petição Trabalhista
```
Processo: Reclamação trabalhista
Pedidos: Horas extras, adicional noturno, FGTS
Valor: R$ 50.000,00
```

### Exemplo 2: Recurso Cível
```
Processo: Apelação cível
Fundamento: Cerceamento de defesa
Pedido: Reforma da sentença
```

## References

- CPC/2015
- CLT
- Resoluções CNJ
- ABNT NBR 6023
- Normas OAB

## Related Files

- `src/lib/document-templates.ts` - Templates do sistema
- `src/components/MinutasManager.tsx` - Gestão de minutas
- `src/components/editor/ProfessionalEditor.tsx` - Editor
- `docs/FLUXO_MINUTAS_AUTOMATICAS.md` - Documentação
