# 📚 Guia Completo de Integração com API DJEN

## 🎯 Objetivo

Este guia fornece **todas as informações necessárias** para implementar consultas ao **DJEN (Diário de Justiça Eletrônico Nacional)** em qualquer aplicação, usando a **API oficial pública e gratuita** do CNJ.

---

## 📖 Índice

1. [O que é o DJEN](#o-que-é-o-djen)
2. [Endpoint da API](#endpoint-da-api)
3. [Autenticação e Headers](#autenticação-e-headers)
4. [Parâmetros de Consulta](#parâmetros-de-consulta)
5. [Formato de Resposta](#formato-de-resposta)
6. [Rate Limiting](#rate-limiting)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Implementação em TypeScript](#implementação-em-typescript)
9. [Boas Práticas](#boas-práticas)
10. [Troubleshooting](#troubleshooting)

---

## 🏛️ O que é o DJEN

O **DJEN** é o Diário de Justiça Eletrônico Nacional, uma plataforma centralizada do CNJ (Conselho Nacional de Justiça) que publica todas as intimações, citações, avisos e editais de tribunais brasileiros.

### Por que usar a API oficial?

✅ **Gratuita** - Sem custo de acesso
✅ **Oficial** - Mantida pelo CNJ
✅ **Completa** - Acesso a todos os tribunais integrados
✅ **Atualizada** - Publicações em tempo real
✅ **Legal** - Dispensa uso de robôs pagos ou scraping

### Tribunais Disponíveis

**Tribunais Trabalhistas:**
- TST (Tribunal Superior do Trabalho)
- TRT3 (Tribunal Regional do Trabalho da 3ª Região - MG)
- TRT1, TRT2, TRT4... (demais regionais)

**Tribunais Estaduais:**
- TJMG (Tribunal de Justiça de Minas Gerais)
- TJSP (Tribunal de Justiça de São Paulo)
- TJES (Tribunal de Justiça do Espírito Santo)
- TJRJ, TJRS, TJSC... (demais estaduais)

**Tribunais Federais:**
- TRF1, TRF2, TRF3, TRF4, TRF5, TRF6 (Tribunais Regionais Federais)

**Tribunais Superiores:**
- STJ (Superior Tribunal de Justiça)
- STF (Supremo Tribunal Federal)

---

## 🌐 Endpoint da API

### Base URL

```
https://comunicaapi.pje.jus.br
```

### Endpoint Principal

```
GET /api/v1/comunicacao
```

### Documentação Oficial

- **Swagger UI**: https://comunicaapi.pje.jus.br/swagger/index.html
- **Versão atual**: 1.0.3
- **Última atualização**: 29/05/2025

---

## 🔑 Autenticação e Headers

### Headers Obrigatórios

```http
Accept: application/json
User-Agent: PJe-DataCollector/1.0
```

### ⚠️ IMPORTANTE

**Sem `Accept: application/json`:**
- A API pode retornar HTML, PDF ou XML ao invés de JSON
- Causará erro no parsing da resposta

**Sem `User-Agent` correto:**
- A API retorna `403 Forbidden`
- Use sempre `PJe-DataCollector/1.0` ou similar

### Exemplo cURL

```bash
curl -X GET "https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG" \
  -H "Accept: application/json" \
  -H "User-Agent: PJe-DataCollector/1.0"
```

---

## 📋 Parâmetros de Consulta

### Parâmetros Principais

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `numeroOab` | string | Condicional* | Número da OAB (apenas dígitos) | `184404` |
| `ufOab` | string | Condicional* | UF da OAB (2 letras) | `MG` |
| `nomeAdvogado` | string | Condicional* | Nome completo do advogado | `Thiago Bodevan Veiga` |
| `siglaTribunal` | string | Condicional* | Sigla oficial do tribunal | `TJMG`, `TST` |
| `numeroProcesso` | string | Condicional* | Número CNJ (20 dígitos) | `50012345620228130000` |
| `nomeParte` | string | Condicional* | Nome de parte no processo | `Maria Santos` |
| `texto` | string | Condicional* | Busca textual livre | `intimação` |

**\* Pelo menos UM dos parâmetros marcados como "Condicional" é obrigatório**

### Parâmetros de Filtro

| Parâmetro | Tipo | Descrição | Padrão | Exemplo |
|-----------|------|-----------|--------|---------|
| `dataDisponibilizacaoInicio` | string | Data inicial (AAAA-MM-DD) | Hoje | `2025-01-16` |
| `dataDisponibilizacaoFim` | string | Data final (AAAA-MM-DD) | dataInicio | `2025-01-16` |
| `meio` | string | Tipo de publicação | - | `D` (Diário) ou `E` (Edital) |
| `pagina` | number | Página dos resultados | 1 | `1`, `2`, `3`... |
| `itensPorPagina` | number | Itens por página | 100 | `5` ou `100` |

### Formato de Datas

✅ **Correto**: `2025-01-16` (AAAA-MM-DD)
❌ **Errado**: `16/01/2025`, `16-01-2025`, `2025/01/16`

---

## 📦 Formato de Resposta

### Estrutura JSON (Status 200 OK)

```json
{
  "status": "success",
  "message": "Comunicações encontradas",
  "count": 42,
  "items": [
    {
      "id": 123456,
      "data_disponibilizacao": "2025-01-16",
      "siglaTribunal": "TJMG",
      "tipoComunicacao": "Intimação",
      "nomeOrgao": "1ª Vara Cível da Comarca de Belo Horizonte",
      "texto": "Intimação para apresentação de manifestação em 15 dias...",
      "numero_processo": "50012345620228130001",
      "meio": "D",
      "link": "https://pje.tjmg.jus.br/...",
      "tipoDocumento": "Despacho",
      "nomeClasse": "Procedimento Comum Cível",
      "codigoClasse": "318",
      "numeroComunicacao": 123456,
      "ativo": true,
      "hash": "abc123def456",
      "datadisponibilizacao": "2025-01-16",
      "meiocompleto": "Diário Eletrônico",
      "numeroprocessocommascara": "5001234-56.2022.8.13.0001",
      "destinatarios": [
        {
          "nome": "João da Silva",
          "polo": "A",
          "comunicacao_id": 123456
        }
      ],
      "destinatarioadvogados": [
        {
          "id": 789,
          "comunicacao_id": 123456,
          "advogado_id": 101112,
          "created_at": "2025-01-16T09:00:00Z",
          "updated_at": "2025-01-16T09:00:00Z",
          "advogado": {
            "id": 101112,
            "nome": "Thiago Bodevan Veiga",
            "numero_oab": "184404",
            "uf_oab": "MG"
          }
        }
      ]
    }
  ]
}
```

### Campos Importantes

**Metadados da Publicação:**
- `id` - ID único da comunicação
- `data_disponibilizacao` - Data de publicação
- `siglaTribunal` - Tribunal de origem
- `tipoComunicacao` - Tipo (Intimação, Citação, Aviso)
- `nomeOrgao` - Vara/órgão que publicou

**Conteúdo:**
- `texto` - Teor completo da publicação
- `tipoDocumento` - Tipo do documento (Despacho, Sentença, Decisão)
- `link` - Link direto no sistema PJe

**Processo:**
- `numero_processo` - Número CNJ (20 dígitos)
- `numeroprocessocommascara` - Número formatado (com pontuação)
- `nomeClasse` - Classe processual
- `codigoClasse` - Código CNJ da classe

**Partes e Advogados:**
- `destinatarios[]` - Lista de partes no processo
- `destinatarioadvogados[]` - Lista de advogados com dados da OAB

---

## ⚡ Rate Limiting

### Controle por IP

A API implementa controle de taxa por endereço IP do cliente.

### Headers de Rate Limit

```http
x-ratelimit-limit: 100
x-ratelimit-remaining: 95
```

- `x-ratelimit-limit` - Número máximo de requisições na janela atual
- `x-ratelimit-remaining` - Requisições restantes

### Erro 429 Too Many Requests

**Quando acontece:**
- Limite de requisições excedido no período

**Resposta:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{
  "status": "error",
  "message": "Rate limit excedido. Aguarde 1 minuto."
}
```

**Como tratar:**
1. Aguardar o tempo especificado em `Retry-After` (em segundos)
2. Usar exponential backoff em retries
3. Implementar fila de requisições com delay entre chamadas

### ⚠️ Boas Práticas de Rate Limiting

✅ **FAÇA:**
- Respeite o `Retry-After`
- Use delay de 500ms-1s entre requisições
- Implemente cache local para resultados
- Monitore os headers `x-ratelimit-*`

❌ **NÃO FAÇA:**
- Usar múltiplos IPs para contornar limite (é considerado abuso)
- Fazer requisições em loop sem delay
- Ignorar erro 429 e continuar tentando

---

## 💻 Exemplos Práticos

### 1. Busca Simples por OAB (Browser)

Copie e cole no navegador:

```
https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG&dataDisponibilizacaoInicio=2025-01-16&dataDisponibilizacaoFim=2025-01-16
```

### 2. Busca por Nome de Advogado (cURL)

```bash
curl -X GET \
  "https://comunicaapi.pje.jus.br/api/v1/comunicacao?nomeAdvogado=Thiago%20Bodevan%20Veiga&dataDisponibilizacaoInicio=2025-01-16" \
  -H "Accept: application/json" \
  -H "User-Agent: PJe-DataCollector/1.0"
```

### 3. Busca em Tribunal Específico (Python)

```python
import requests
from datetime import date

def consultar_djen(oab_numero: str, oab_uf: str, tribunal: str = None):
    url = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"

    params = {
        "numeroOab": oab_numero,
        "ufOab": oab_uf,
        "dataDisponibilizacaoInicio": date.today().isoformat(),
        "dataDisponibilizacaoFim": date.today().isoformat(),
        "pagina": 1,
        "itensPorPagina": 100
    }

    if tribunal:
        params["siglaTribunal"] = tribunal

    headers = {
        "Accept": "application/json",
        "User-Agent": "PJe-DataCollector/1.0"
    }

    response = requests.get(url, params=params, headers=headers, timeout=30)
    response.raise_for_status()

    return response.json()

# Usar:
resultado = consultar_djen("184404", "MG", "TJMG")
print(f"Encontradas {resultado['count']} comunicações")
```

### 4. Busca com Paginação (JavaScript/Node.js)

```javascript
async function consultarDJENComPaginacao(oab, uf, dataInicio, dataFim) {
  const baseUrl = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';
  const todasPublicacoes = [];
  let paginaAtual = 1;
  let totalPaginas = 1;

  while (paginaAtual <= totalPaginas) {
    const params = new URLSearchParams({
      numeroOab: oab,
      ufOab: uf,
      dataDisponibilizacaoInicio: dataInicio,
      dataDisponibilizacaoFim: dataFim,
      pagina: paginaAtual,
      itensPorPagina: 100
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limit atingido. Aguardando ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue; // Tentar novamente
      }
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    todasPublicacoes.push(...data.items);

    // Calcular total de páginas (máximo 10.000 itens / 100 por página = 100 páginas)
    totalPaginas = Math.min(Math.ceil(data.count / 100), 100);
    paginaAtual++;

    // Delay entre requisições para respeitar rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return todasPublicacoes;
}

// Usar:
const publicacoes = await consultarDJENComPaginacao(
  '184404',
  'MG',
  '2025-01-01',
  '2025-01-16'
);
console.log(`Total de publicações: ${publicacoes.length}`);
```

---

## 🛠️ Implementação em TypeScript

### Tipos (Interfaces)

```typescript
// Comunicação individual
export interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  tipoDocumento: string;
  nomeClasse: string;
  codigoClasse: string;
  numeroComunicacao: number;
  ativo: boolean;
  hash: string;
  datadisponibilizacao: string;
  meiocompleto: string;
  numeroprocessocommascara: string;
  destinatarios: Array<{
    nome: string;
    polo: string;
    comunicacao_id: number;
  }>;
  destinatarioadvogados: Array<{
    id: number;
    comunicacao_id: number;
    advogado_id: number;
    created_at: string;
    updated_at: string;
    advogado: {
      id: number;
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

// Resposta da API
export interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

// Parâmetros de consulta
export interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: 'E' | 'D'; // E=Edital, D=Diário
}

// Erro customizado
export class DJENAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public tribunal?: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'DJENAPIError';
  }
}
```

### Função Principal de Consulta

```typescript
const DJEN_BASE_URL = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';
const DEFAULT_TIMEOUT = 30000; // 30 segundos

export async function consultarDJEN(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DJENResponse> {
  // Validar parâmetros obrigatórios
  if (!params.numeroOab && !params.nomeAdvogado && !params.siglaTribunal && !params.numeroProcesso) {
    throw new Error('Pelo menos um parâmetro de busca é obrigatório');
  }

  // Construir query string
  const queryParams = new URLSearchParams();

  if (params.numeroOab) queryParams.append('numeroOab', params.numeroOab);
  if (params.ufOab) queryParams.append('ufOab', params.ufOab);
  if (params.nomeAdvogado) queryParams.append('nomeAdvogado', params.nomeAdvogado);
  if (params.siglaTribunal) queryParams.append('siglaTribunal', params.siglaTribunal);
  if (params.dataDisponibilizacaoInicio) {
    queryParams.append('dataDisponibilizacaoInicio', params.dataDisponibilizacaoInicio);
  }
  if (params.dataDisponibilizacaoFim) {
    queryParams.append('dataDisponibilizacaoFim', params.dataDisponibilizacaoFim);
  }
  if (params.pagina) queryParams.append('pagina', params.pagina.toString());
  if (params.itensPorPagina) {
    queryParams.append('itensPorPagina', params.itensPorPagina.toString());
  }
  if (params.meio) queryParams.append('meio', params.meio);

  const url = `${DJEN_BASE_URL}?${queryParams.toString()}`;

  // Controller para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Tratar rate limit
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new DJENAPIError(
        'Rate limit excedido',
        429,
        params.siglaTribunal,
        retryAfter
      );
    }

    // Validar resposta
    if (!response.ok) {
      throw new DJENAPIError(
        `Erro HTTP ${response.status}: ${response.statusText}`,
        response.status,
        params.siglaTribunal
      );
    }

    // Validar content-type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new DJENAPIError(
        'Resposta não está em formato JSON. Verifique os headers.',
        response.status,
        params.siglaTribunal
      );
    }

    const data: DJENResponse = await response.json();
    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DJENAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new DJENAPIError(
          `Timeout após ${timeout}ms`,
          undefined,
          params.siglaTribunal
        );
      }
      throw new DJENAPIError(
        `Erro de rede: ${error.message}`,
        undefined,
        params.siglaTribunal
      );
    }

    throw new DJENAPIError(
      'Erro desconhecido ao consultar API',
      undefined,
      params.siglaTribunal
    );
  }
}
```

### Funções Auxiliares

```typescript
// Formatar data para padrão AAAA-MM-DD
export function formatarData(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Validar formato de data
export function validarFormatoData(data: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) return false;

  const date = new Date(data);
  if (isNaN(date.getTime())) return false;

  // Verificar se a data não foi ajustada (ex: 2025-04-31 vira 2025-05-01)
  const [year, month, day] = data.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

// Parse de número OAB (vários formatos)
export function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {};
  const value = numeroOAB.trim();

  // Formato: OAB/UF 123456
  const matchOAB = /OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i.exec(value);
  if (matchOAB) {
    return { numero: matchOAB[2], uf: matchOAB[1].toUpperCase() };
  }

  // Formato: 123456/UF
  const matchNumericUF = /(\d+)\s?\/\s?([A-Z]{2})/i.exec(value);
  if (matchNumericUF) {
    return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  }

  // Formato: apenas número
  const matchNumeric = /^(\d+)$/.exec(value);
  if (matchNumeric) {
    return { numero: matchNumeric[1] };
  }

  return {};
}

// Normalizar texto (para busca case-insensitive e sem acentos)
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Verificar se publicação contém termo de busca
export function contemTermoDeBusca(
  publicacao: DJENComunicacao,
  termo: string
): boolean {
  const textoNormalizado = normalizarTexto([
    publicacao.texto,
    publicacao.tipoComunicacao,
    publicacao.nomeOrgao,
    ...publicacao.destinatarios.map(d => d.nome),
    ...publicacao.destinatarioadvogados.map(da => da.advogado.nome)
  ].join(' '));

  const termoNormalizado = normalizarTexto(termo);
  return textoNormalizado.includes(termoNormalizado);
}
```

### Exemplo de Uso Completo

```typescript
async function buscarPublicacoesHoje() {
  const hoje = formatarData(new Date());

  try {
    const resultado = await consultarDJEN({
      numeroOab: '184404',
      ufOab: 'MG',
      dataDisponibilizacaoInicio: hoje,
      dataDisponibilizacaoFim: hoje,
      itensPorPagina: 100,
      pagina: 1
    });

    console.log(`✅ Encontradas ${resultado.count} publicações`);

    // Filtrar apenas intimações
    const intimacoes = resultado.items.filter(
      item => item.tipoComunicacao.toLowerCase().includes('intimação')
    );

    console.log(`📋 ${intimacoes.length} intimações encontradas`);

    return intimacoes;

  } catch (error) {
    if (error instanceof DJENAPIError) {
      if (error.statusCode === 429) {
        console.error(`⏳ Rate limit! Aguardar ${error.retryAfter}s`);
      } else {
        console.error(`❌ Erro ao consultar DJEN: ${error.message}`);
      }
    }
    throw error;
  }
}
```

---

## ✅ Boas Práticas

### 1. Tratamento de Erros

✅ **Implemente retry com backoff exponencial:**

```typescript
async function consultarComRetry(
  params: DJENQueryParams,
  maxRetries: number = 3
): Promise<DJENResponse> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await consultarDJEN(params);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof DJENAPIError && error.statusCode === 429) {
        // Rate limit: aguardar tempo especificado
        const waitTime = error.retryAfter || Math.pow(2, i) * 1000;
        console.log(`Tentativa ${i + 1}/${maxRetries} - Aguardando ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (i < maxRetries - 1) {
        // Outros erros: backoff exponencial
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Tentativa ${i + 1}/${maxRetries} falhou - Aguardando ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}
```

### 2. Cache de Resultados

✅ **Use cache para evitar consultas repetidas:**

```typescript
interface CacheEntry {
  data: DJENResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(params: DJENQueryParams): string {
  return JSON.stringify(params);
}

async function consultarDJENComCache(
  params: DJENQueryParams
): Promise<DJENResponse> {
  const cacheKey = getCacheKey(params);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✨ Resultado do cache');
    return cached.data;
  }

  const data = await consultarDJEN(params);
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}
```

### 3. Consulta em Múltiplos Tribunais

✅ **Paralelizar com Promise.allSettled:**

```typescript
async function consultarMultiplosTribunais(
  tribunais: string[],
  oab: string,
  uf: string,
  dataInicio: string,
  dataFim: string
): Promise<Map<string, DJENResponse>> {
  const resultados = new Map<string, DJENResponse>();

  // Paralelizar consultas (respeitando rate limit)
  const promises = tribunais.map(async (tribunal) => {
    try {
      const resultado = await consultarDJENComRetry({
        numeroOab: oab,
        ufOab: uf,
        siglaTribunal: tribunal,
        dataDisponibilizacaoInicio: dataInicio,
        dataDisponibilizacaoFim: dataFim,
        itensPorPagina: 100
      });

      return { tribunal, resultado, erro: null };
    } catch (error) {
      console.error(`Erro ao consultar ${tribunal}:`, error);
      return { tribunal, resultado: null, erro: error as Error };
    }
  });

  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.resultado) {
      resultados.set(result.value.tribunal, result.value.resultado);
    }
  });

  return resultados;
}
```

### 4. Monitoramento de Rate Limit

✅ **Monitore e logue headers de rate limit:**

```typescript
async function consultarDJENComMonitoramento(
  params: DJENQueryParams
): Promise<DJENResponse> {
  const response = await fetch(/* ... */);

  // Monitorar rate limit
  const rateLimit = {
    limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
    remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0')
  };

  console.log(`📊 Rate Limit: ${rateLimit.remaining}/${rateLimit.limit}`);

  // Alertar se está próximo do limite
  if (rateLimit.remaining < rateLimit.limit * 0.1) {
    console.warn('⚠️ Próximo do limite de rate limit!');
  }

  return await response.json();
}
```

### 5. Validação de Entrada

✅ **Valide parâmetros antes de consultar:**

```typescript
function validarParametros(params: DJENQueryParams): void {
  // Validar OAB
  if (params.numeroOab && !/^\d+$/.test(params.numeroOab)) {
    throw new Error('Número OAB deve conter apenas dígitos');
  }

  if (params.ufOab && !/^[A-Z]{2}$/.test(params.ufOab)) {
    throw new Error('UF da OAB deve ter 2 letras maiúsculas (ex: MG)');
  }

  // Validar datas
  if (params.dataDisponibilizacaoInicio) {
    if (!validarFormatoData(params.dataDisponibilizacaoInicio)) {
      throw new Error('Data início inválida. Use formato AAAA-MM-DD');
    }
  }

  if (params.dataDisponibilizacaoFim) {
    if (!validarFormatoData(params.dataDisponibilizacaoFim)) {
      throw new Error('Data fim inválida. Use formato AAAA-MM-DD');
    }
  }

  // Validar paginação
  if (params.pagina && params.pagina < 1) {
    throw new Error('Página deve ser >= 1');
  }

  if (params.itensPorPagina && ![5, 100].includes(params.itensPorPagina)) {
    throw new Error('Itens por página deve ser 5 ou 100');
  }
}
```

---

## 🔧 Troubleshooting

### Problema: Resposta em HTML ao invés de JSON

**Causa:** Falta do header `Accept: application/json`

**Solução:**
```typescript
headers: {
  'Accept': 'application/json',  // ← Obrigatório!
  'User-Agent': 'PJe-DataCollector/1.0'
}
```

### Problema: Erro 403 Forbidden

**Causa:** Falta do header `User-Agent` correto

**Solução:**
```typescript
headers: {
  'Accept': 'application/json',
  'User-Agent': 'PJe-DataCollector/1.0'  // ← Obrigatório!
}
```

### Problema: Erro 422 (Unprocessable Entity)

**Causa:** Parâmetros obrigatórios faltando ou inválidos

**Soluções:**
1. Forneça pelo menos UM dos parâmetros: `numeroOab`, `nomeAdvogado`, `siglaTribunal`, `numeroProcesso` ou `texto`
2. Se usar `numeroOab`, forneça também `ufOab`
3. Valide formato das datas (AAAA-MM-DD)

### Problema: Erro 429 (Rate Limit Exceeded)

**Causa:** Muitas requisições em curto período

**Soluções:**
1. Aguarde o tempo especificado em `Retry-After`
2. Implemente delay entre requisições (500ms-1s)
3. Use cache para evitar consultas repetidas
4. Considere paralelizar com limite de concorrência

### Problema: Timeout na Requisição

**Causa:** API lenta ou parâmetros que retornam muitos resultados

**Soluções:**
1. Aumente o timeout (padrão: 30s)
2. Reduza o intervalo de datas
3. Use paginação (100 itens por página)
4. Filtre por tribunal específico

### Problema: Nenhum Resultado Retornado

**Causas possíveis:**
1. Não há publicações no período consultado
2. Filtros muito restritivos
3. Dados de OAB incorretos

**Soluções:**
1. Verifique se o número OAB está correto (apenas dígitos)
2. Verifique se a UF está correta (2 letras maiúsculas)
3. Expanda o intervalo de datas
4. Teste sem filtro de tribunal

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **Swagger UI**: https://comunicaapi.pje.jus.br/swagger/index.html
- **Portal PJe**: https://www.pje.jus.br/

### Arquivos de Referência no Projeto

- `src/lib/djen-api.ts` - Implementação completa TypeScript
- `api/lib/djen-client.ts` - Cliente backend com retry logic
- `src/components/DJENConsulta.tsx` - Interface React
- `docs/DJEN_DOCUMENTATION.md` - Documentação detalhada

### Tribunais com API Integrada

Lista completa de tribunais disponíveis: https://comunicaapi.pje.jus.br/swagger/index.html

---

## 🎯 Resumo Rápido

**Endpoint:**
```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
```

**Headers obrigatórios:**
```http
Accept: application/json
User-Agent: PJe-DataCollector/1.0
```

**Parâmetros mínimos:**
```
?numeroOab=184404&ufOab=MG&dataDisponibilizacaoInicio=2025-01-16
```

**Código básico:**
```typescript
const response = await fetch(
  'https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG',
  {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PJe-DataCollector/1.0'
    }
  }
);
const data = await response.json();
console.log(`Encontradas ${data.count} publicações`);
```

---

## 📝 Licença e Uso

A API DJEN é **pública e gratuita**, mantida pelo CNJ para facilitar o acesso à informação processual.

**Restrições:**
- Respeitar rate limiting
- Não usar para fins comerciais não autorizados
- Não redistribuir dados em larga escala sem autorização
- Manter conformidade com LGPD ao armazenar dados

---

**Documento criado em:** 23/12/2025
**Versão:** 1.0
**Baseado em:** API Comunica PJe v1.0.3 (CNJ)
