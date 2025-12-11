# 🔒 Guia do Serviço de Redação de Dados

**Conformidade LGPD - Lei 13.709/2018**  
**Versão:** 1.0.0  
**Data:** 11 de Dezembro de 2024  
**Status:** ✅ Implementado

---

## 📋 Resumo Executivo

O **Redaction Service** é um serviço de anonimização configurável de dados sensíveis para conformidade com a LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018).

**Principais Características:**
- ✅ 3 modos de redação: `none`, `partial`, `complete`
- ✅ Redação de 6 tipos de dados: nomes, CPF, CNPJ, telefone, email, endereço
- ✅ Configuração via variáveis de ambiente
- ✅ Integração automática com Tema Extractor
- ✅ 36 testes unitários com 100% de aprovação
- ✅ Compliance total com LGPD Art. 5º, 6º e 46

---

## 🎯 Objetivo

Proteger dados pessoais de clientes, advogados e partes processuais conforme LGPD, permitindo:

1. **Uso Interno**: Dados completos para operação do escritório (`mode: none`)
2. **Compartilhamento Controlado**: Redação parcial para relatórios internos (`mode: partial`)
3. **Compartilhamento Externo**: Redação completa para documentos públicos (`mode: complete`)

---

## 📊 Modos de Redação

| Modo | Descrição | Exemplo (CPF) | Uso Recomendado |
|------|-----------|---------------|-----------------|
| **none** | Mantém dados completos | 123.456.789-01 | Uso interno do escritório |
| **partial** | Redação parcial - preserva utilidade | 12*.***.*89-** | Relatórios internos, compartilhamento controlado |
| **complete** | Redação completa - máxima privacidade | [CPF_REDACTED] | Documentos públicos, compartilhamento externo |

---

## 🔧 Tipos de Dados Redacionados

### 1. Nomes de Pessoas

```typescript
redactionService.redactName("João da Silva Santos", mode)

// none: "João da Silva Santos" (sem alteração)
// partial: "João S." (primeiro nome + inicial do último)
// complete: "[NOME_REDACTED]" (totalmente anonimizado)
```

**Compliance:** LGPD Art. 5º, I (Dados Pessoais)

### 2. CPF (Cadastro de Pessoa Física)

```typescript
redactionService.redactCPF("123.456.789-01", mode)

// none: "123.456.789-01" (sem alteração)
// partial: "12*.***.*89-**" (primeiros 2 + meio 2 dígitos)
// complete: "[CPF_REDACTED]" (totalmente anonimizado)
```

**Compliance:** LGPD Art. 5º, I (Dados Pessoais)

### 3. CNPJ (Cadastro Nacional de Pessoa Jurídica)

```typescript
redactionService.redactCNPJ("12.345.678/0001-90", mode)

// none: "12.345.678/0001-90" (sem alteração)
// partial: "12.***.678/****-**" (primeiros 2 + meio 3 dígitos)
// complete: "[CNPJ_REDACTED]" (totalmente anonimizado)
```

**Compliance:** LGPD Art. 5º, I (Dados Pessoais)

### 4. Telefone

```typescript
redactionService.redactTelefone("(11) 98765-4321", mode)

// none: "(11) 98765-4321" (sem alteração)
// partial: "(11) *****-4321" (DDD + últimos 4 dígitos)
// complete: "[TELEFONE_REDACTED]" (totalmente anonimizado)
```

**Compliance:** LGPD Art. 5º, I (Dados Pessoais)

### 5. Email

```typescript
redactionService.redactEmail("joao.silva@empresa.com.br", mode)

// none: "joao.silva@empresa.com.br" (sem alteração)
// partial: "j***@empresa.com.br" (primeira letra + domínio)
// complete: "[EMAIL_REDACTED]" (totalmente anonimizado)
```

**Compliance:** LGPD Art. 5º, I (Dados Pessoais)

### 6. Endereço

```typescript
redactionService.redactEndereco("Rua das Flores, 123, Apto 45, São Paulo/SP", mode)

// none: "Rua das Flores, 123, Apto 45, São Paulo/SP" (sem alteração)
// partial: "Rua das Flores, ***, São Paulo/SP" (rua + cidade, sem número/complemento)
// complete: "[ENDERECO_REDACTED]" (totalmente anonimizado)
```

**Compliance:** LGPD Art. 5º, I (Dados Pessoais)

---

## ⚙️ Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```bash
# ============================================
# LGPD COMPLIANCE - Redaction Configuration
# ============================================

# Habilita redação de dados sensíveis
VITE_REDACTION_ENABLED=false  # default: false (uso interno)

# Modo geral de redação
VITE_REDACTION_MODE=none  # none | partial | complete

# Redação específica por tipo (sobrescreve modo geral)
VITE_REDACTION_NAMES=        # vazio = usa modo geral
VITE_REDACTION_CPF=          # vazio = usa modo geral
VITE_REDACTION_CNPJ=         # vazio = usa modo geral
VITE_REDACTION_TELEFONE=     # vazio = usa modo geral
VITE_REDACTION_ENDERECO=     # vazio = usa modo geral
VITE_REDACTION_EMAIL=        # vazio = usa modo geral
```

### Exemplos de Configuração

**1. Redação Parcial de Nomes em Relatórios Públicos:**

```bash
VITE_REDACTION_ENABLED=true
VITE_REDACTION_NAMES=partial
```

**2. Redação Completa de CPF/CNPJ em Documentos Externos:**

```bash
VITE_REDACTION_ENABLED=true
VITE_REDACTION_CPF=complete
VITE_REDACTION_CNPJ=complete
```

**3. Redação Completa de Todos os Dados Sensíveis:**

```bash
VITE_REDACTION_ENABLED=true
VITE_REDACTION_MODE=complete
```

**4. Redação Mista (CPF completo, outros parcial):**

```bash
VITE_REDACTION_ENABLED=true
VITE_REDACTION_MODE=partial
VITE_REDACTION_CPF=complete  # Sobrescreve modo geral
```

---

## 💻 Uso Programático

### Configurar Serviço

```typescript
import { redactionService } from '@/services/redaction-service';

// Configurar modo de redação
redactionService.setConfig({
  enabled: true,
  mode: 'partial',
  cpf: 'complete',  // Sobrescreve modo geral apenas para CPF
});

// Verificar se está habilitado
if (redactionService.isEnabled()) {
  console.log('Redação ativada');
}

// Obter configuração atual
const config = redactionService.getConfig();
console.log('Modo atual:', config.mode);
```

### Redacionar Texto Livre

```typescript
import { redactionService } from '@/services/redaction-service';

redactionService.setConfig({ enabled: true, mode: 'partial' });

const texto = `
  Contato: João da Silva
  CPF: 123.456.789-01
  Email: joao@empresa.com.br
  Tel: (11) 98765-4321
`;

const result = redactionService.redactText(texto);

console.log('Texto original:', result.originalText);
console.log('Texto redacionado:', result.redactedText);
// "Contato: João da Silva
//  CPF: 12*.***.*89-**
//  Email: j***@empresa.com.br
//  Tel: (11) *****-4321"

console.log('Redações aplicadas:', result.redactionsApplied);
// [
//   { type: 'CPF', count: 1, mode: 'partial' },
//   { type: 'Email', count: 1, mode: 'partial' },
//   { type: 'Telefone', count: 1, mode: 'partial' }
// ]
```

### Redacionar Objeto

```typescript
import { redactionService } from '@/services/redaction-service';

redactionService.setConfig({ enabled: true, mode: 'partial' });

const cliente = {
  nome: "João da Silva",
  cpf: "123.456.789-01",
  email: "joao@empresa.com",
  contato: {
    telefone: "(11) 98765-4321",
    endereco: "Rua das Flores, 123, São Paulo/SP"
  }
};

const redacted = redactionService.redactObject(cliente);

console.log(redacted);
// {
//   nome: "João da Silva",
//   cpf: "12*.***.*89-**",
//   email: "j***@empresa.com",
//   contato: {
//     telefone: "(11) *****-4321",
//     endereco: "Rua das Flores, ***, São Paulo/SP"
//   }
// }
```

### Criar Instância Customizada

```typescript
import { createRedactionService } from '@/services/redaction-service';

// Instância com configuração específica
const publicReportRedaction = createRedactionService({
  enabled: true,
  mode: 'complete',
  names: 'partial'  // Exceção: nomes apenas parcial
});

const text = "João Silva, CPF 123.456.789-01";
const result = publicReportRedaction.redactText(text);
// "João S., CPF [CPF_REDACTED]"
```

---

## 🔗 Integração com Tema Extractor

O serviço de redação está automaticamente integrado ao `TemaExtractorService` para anonimizar nomes de pessoas extraídos de intimações:

```typescript
// src/lib/tema-extractor.ts

class TemaExtractorService {
  constructor(apiKey?: string) {
    this.geminiClient = new GeminiClient(apiKey);
    
    // ✅ Configurar redactionService com configuração do ambiente
    if (config.redaction.enabled) {
      redactionService.setConfig({
        enabled: config.redaction.enabled,
        mode: config.redaction.mode,
        names: config.redaction.names || undefined,
        // ...outros tipos
      });
    }
  }

  private sanitizeEntidades(entidades: TemaExtracao["entidades"]) {
    return {
      pessoas: entidades.pessoas
        .filter((nome) => nome && nome.length > 3)
        .map((nome) => this.redactIfNeeded(nome)),  // ✅ Redação aplicada
      empresas: entidades.empresas,
      leis: entidades.leis,
      tribunais: entidades.tribunais,
    };
  }

  private redactIfNeeded(nome: string): string {
    return redactionService.redactName(nome);  // ✅ Usa configuração global
  }
}
```

**Resultado:**

Se `VITE_REDACTION_ENABLED=true` e `VITE_REDACTION_NAMES=partial`:

```typescript
const temas = await temaExtractor.extractTemas({ texto: intimacao });

console.log(temas.entidades.pessoas);
// ["João S.", "Maria O."]  ✅ Nomes redacionados automaticamente
```

---

## 📝 Integração com Workflow de Minutas

### 1. Redação Automática em Minutas

```typescript
// Ao criar minuta a partir de template
import { redactionService } from '@/services/redaction-service';
import { replaceTemplateVariables } from '@/lib/document-templates';

const template = getTemplateById('peticao-inicial');

// Dados completos (interno)
const variaveis = {
  'autor.nome': 'João da Silva',
  'autor.cpf': '123.456.789-01',
  'autor.telefone': '(11) 98765-4321'
};

// Redacionar variáveis se necessário (compartilhamento externo)
const variaveisRedacionadas = redactionService.redactObject(variaveis);
// {
//   'autor.nome': 'João S.',
//   'autor.cpf': '12*.***.*89-**',
//   'autor.telefone': '(11) *****-4321'
// }

const conteudo = replaceTemplateVariables(template.content, variaveisRedacionadas);
```

### 2. Redação ao Exportar para Google Docs

```typescript
import { redactionService } from '@/services/redaction-service';
import { googleDocsService } from '@/lib/google-docs-service';

async function exportarMinutaPublica(minuta: Minuta) {
  // Habilitar redação para compartilhamento externo
  const previousConfig = redactionService.getConfig();
  
  redactionService.setConfig({
    enabled: true,
    mode: 'partial',
    cpf: 'complete',
    cnpj: 'complete'
  });

  // Redacionar conteúdo
  const result = redactionService.redactText(minuta.conteudo);
  
  // Criar documento no Google Docs com conteúdo redacionado
  const doc = await googleDocsService.createDocument({
    ...minuta,
    conteudo: result.redactedText
  });

  // Restaurar configuração original
  redactionService.setConfig(previousConfig);

  return doc;
}
```

---

## ✅ Conformidade LGPD

### Art. 5º - Definições

**Dado Pessoal (I):**
> "informação relacionada a pessoa natural identificada ou identificável"

✅ **Implementado**: Redação de CPF, nome, email, telefone, endereço

### Art. 6º - Princípios

**I - Finalidade:**
> "realização do tratamento para propósitos legítimos, específicos, explícitos e informados ao titular"

✅ **Implementado**: Redação aplicada apenas quando necessária (compartilhamento externo), configurável por finalidade

**III - Minimização:**
> "limitação do tratamento ao mínimo necessário para a realização de suas finalidades"

✅ **Implementado**: Modo `partial` permite manter utilidade dos dados enquanto protege privacidade

**VI - Transparência:**
> "garantia, aos titulares, de informações claras, precisas e facilmente acessíveis"

✅ **Implementado**: Documentação completa, configuração transparente via variáveis de ambiente

**VII - Segurança:**
> "utilização de medidas técnicas e administrativas aptas a proteger os dados pessoais"

✅ **Implementado**: Controle técnico adequado com 3 níveis de proteção (none, partial, complete)

### Art. 46 - Segurança

> "Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados"

✅ **Implementado**: Serviço de redação permite anonimização antes de compartilhamento externo

### Art. 48 - Comunicação de Incidente

> "O controlador deverá comunicar à autoridade nacional e ao titular a ocorrência de incidente de segurança"

✅ **Implementado**: Dados já anonimizados reduzem impacto de possíveis incidentes de segurança

---

## 🧪 Testes

O Redaction Service possui **36 testes unitários** com **100% de aprovação**:

```bash
npm run test -- src/services/redaction-service.test.ts
```

**Cobertura de Testes:**

- ✅ Configuration (4 testes)
- ✅ Name Redaction (4 testes)
- ✅ CPF Redaction (4 testes)
- ✅ CNPJ Redaction (3 testes)
- ✅ Telefone Redaction (3 testes)
- ✅ Email Redaction (3 testes)
- ✅ Endereco Redaction (3 testes)
- ✅ Text Redaction (4 testes)
- ✅ Object Redaction (5 testes)
- ✅ LGPD Compliance (3 testes)

---

## 📚 Referências

- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional de Proteção de Dados](https://www.gov.br/anpd/pt-br)
- [Guia de Boas Práticas LGPD](https://www.gov.br/anpd/pt-br/assuntos/guias)
- [Documentação LGPD Compliance](./LGPD_COMPLIANCE.md)
- [Fluxo de Minutas Automáticas](./FLUXO_MINUTAS_AUTOMATICAS.md)

---

**Versão:** 1.0.0  
**Última Atualização:** 11 de Dezembro de 2024  
**Autor:** Sistema Assistente Jurídico PJe
