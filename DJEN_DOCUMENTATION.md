# Sistema de Consulta DJEN - Documentação Técnica

## Visão Geral

Sistema completo de consulta ao Diário de Justiça Eletrônico Nacional (DJEN) através da API pública do Comunica PJe do CNJ. Permite buscar publicações de múltiplos tribunais por nome de advogado ou número de OAB de forma automatizada e eficiente.

## Arquitetura

### Componentes Principais

#### 1. `src/lib/djen-api.ts` - Camada de API
Biblioteca TypeScript com funções puras para comunicação com a API do DJEN.

**Principais funções:**
- `consultarDJEN(config)` - Função principal que orquestra a consulta
- `consultarPublicacoesTribunal(params)` - Consulta um tribunal específico
- `matchesSearchTerms()` - Verifica se publicação contém termos buscados
- `validarFormatoData()` - Valida formato de data AAAA-MM-DD
- `validarNumeroOAB()` - Valida formato OAB/UF 12345

**Tratamento de Erros:**
- Classe customizada `DJENAPIError` com contexto detalhado
- Timeout configurável (padrão 60s)
- Retry logic pode ser implementada pelo consumidor
- Validação de content-type da resposta

**Normalização de Texto:**
- Remove acentos (NFD normalization)
- Converte para lowercase
- Permite matching flexível de nomes

#### 2. `src/components/DJENConsulta.tsx` - Interface de Usuário
Componente React completo com formulário e exibição de resultados.

**Recursos:**
- ✅ Seleção múltipla de tribunais (7 disponíveis)
- ✅ Busca por nome e/ou OAB
- ✅ Seletor de data com valor padrão = hoje
- ✅ Loading states com spinner
- ✅ Exibição de erros por tribunal
- ✅ Cards de resultado com badges de match type
- ✅ Copiar teor para clipboard
- ✅ Exportar resultados em JSON
- ✅ Histórico de buscas (persistido com useKV)

#### 3. Integração com DatabaseQueries
O componente foi integrado na aba DJEN do módulo de consultas existente.

## Endpoints da API

### Endpoint Base
```
GET https://comunicaapi.pje.jus.br/api/v1/caderno/{siglaTribunal}/{data}/{meio}
```

### Parâmetros

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| siglaTribunal | string | Sigla oficial do tribunal | `TJSP`, `TST`, `TRT3` |
| data | string | Data no formato AAAA-MM-DD | `2025-01-16` |
| meio | string | Formato da resposta | `html` ou `pdf` |

### Tribunais Suportados

- **TST** - Tribunal Superior do Trabalho
- **TRT3** - Tribunal Regional do Trabalho da 3ª Região (MG)
- **TJMG** - Tribunal de Justiça de Minas Gerais
- **TRF1** - Tribunal Regional Federal da 1ª Região
- **TJES** - Tribunal de Justiça do Espírito Santo
- **TJSP** - Tribunal de Justiça de São Paulo
- **STJ** - Superior Tribunal de Justiça

## Requisitos HTTP

### Headers Obrigatórios

```typescript
{
  'User-Agent': 'PJe-DataCollector/1.0',
  'Accept': 'application/json'
}
```

⚠️ **CRÍTICO**: Sem o User-Agent correto a API retorna 403 Forbidden.

⚠️ **CRÍTICO**: Sem Accept: application/json a resposta pode vir em HTML/PDF.

## Estrutura de Dados

### DJENPublication (Resposta da API)

```typescript
interface DJENPublication {
  tribunal: string
  data_disponibilizacao: string
  tipo_comunicacao?: string
  tipo?: string
  orgao?: string
  meio?: string
  inteiro_teor?: string
  inteiroTeor?: string
  numero_processo?: string
  partes?: string[]
  advogados?: string[]
}
```

### DJENFilteredResult (Resultado Processado)

```typescript
interface DJENFilteredResult {
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  matchType: 'nome' | 'oab' | 'ambos'
}
```

## Uso Programático

### Exemplo Básico

```typescript
import { consultarDJEN } from '@/lib/djen-api'

const resultado = await consultarDJEN({
  tribunais: ['TJSP', 'TJMG'],
  searchTerms: {
    nomeAdvogado: 'Thiago Bodevan',
    numeroOAB: 'OAB/MG 123456'
  },
  data: '2025-01-16',
  meio: 'html'
})

console.log(`${resultado.resultados.length} publicações encontradas`)
console.log(`${resultado.erros.length} tribunais com erro`)
```

### Exemplo com Tratamento de Erros

```typescript
try {
  const resultado = await consultarDJEN({
    tribunais: ['TST', 'TRT3', 'STJ'],
    searchTerms: {
      numeroOAB: 'OAB/SP 12345'
    },
    timeout: 90000, // 90 segundos
    delayBetweenRequests: 2000 // 2s entre requests
  })

  if (resultado.erros.length > 0) {
    console.warn('Alguns tribunais falharam:', resultado.erros)
  }

  for (const pub of resultado.resultados) {
    console.log(`${pub.tribunal} - ${pub.tipo}`)
    console.log(`Match type: ${pub.matchType}`)
    console.log(pub.teor.substring(0, 200))
  }
} catch (error) {
  if (error instanceof DJENAPIError) {
    console.error(`Erro no tribunal ${error.tribunal}: ${error.message}`)
  }
}
```

## Boas Práticas

### Performance

1. **Delay entre requisições**: Use `delayBetweenRequests: 1500` para evitar sobrecarga
2. **Timeout generoso**: Configure `timeout: 60000` (60s) para tribunais grandes
3. **Tribunais seletivos**: Consulte apenas tribunais relevantes ao caso

### Tratamento de Dados

1. **Normalização**: Use `normalizeText()` para matching case-insensitive
2. **Validação**: Sempre valide formato de OAB e data antes de consultar
3. **Empty states**: Trate `[]` como resposta válida (sem publicações naquele dia)

### Rate Limiting

Embora não documentado oficialmente, recomenda-se:
- Máximo 10 requisições por minuto
- Delay mínimo de 1.5s entre requests
- Retry com backoff exponencial em caso de 503/504

## Possíveis Erros e Soluções

### Erro 403 Forbidden

**Causa**: Falta do User-Agent correto
**Solução**: Garantir header `User-Agent: PJe-DataCollector/1.0`

### Erro 404 Not Found

**Causa**: Tribunal ou data inválidos
**Solução**: 
- Verificar sigla do tribunal (case-sensitive)
- Validar formato da data (AAAA-MM-DD)
- Confirmar que há publicação naquela data (evitar finais de semana)

### Timeout

**Causa**: Tribunal com volume alto de publicações (ex: TJSP)
**Solução**: 
- Aumentar timeout para 90-120 segundos
- Consultar dias úteis (menos volume)

### Response não é JSON

**Causa**: Header Accept incorreto
**Solução**: Garantir `Accept: application/json`

### AbortError

**Causa**: Request cancelado por timeout
**Solução**: Aumentar timeout ou tentar novamente

## Limitações Conhecidas

1. **Sem paginação**: API retorna todos resultados do dia de uma vez
2. **Sem autenticação**: Não requer nem suporta tokens de API
3. **Volume**: Dias com muitas publicações podem ter resposta lenta
4. **Campos variáveis**: Estrutura JSON pode variar entre tribunais
5. **Histórico limitado**: Consulta apenas data específica (não ranges)

## Futuras Melhorias

### Curto Prazo
- [ ] Cache de resultados (evitar requests duplicados)
- [ ] Filtros adicionais (tipo de comunicação, órgão)
- [ ] Exportar em PDF/Excel além de JSON
- [ ] Agendamento de consultas recorrentes

### Médio Prazo
- [ ] Agent autônomo para monitoramento diário
- [ ] Notificações push quando encontrar match
- [ ] Integração com cálculo automático de prazos
- [ ] Dashboard analítico de publicações

### Longo Prazo
- [ ] IA para classificação semântica de publicações
- [ ] Resumo automático com LLM
- [ ] Detecção de urgência/prioridade
- [ ] OCR para processar PDFs diretamente

## Referências

### Documentação Oficial
- [API Comunica PJe - Swagger](https://comunicaapi.pje.jus.br/swagger-ui.html)
- [Resolução CNJ sobre DJEN](https://pje.csjt.jus.br/manual/index.php?title=DJEN)

### Discussões Técnicas
- [Reddit r/brdev - API do DJEN](https://www.reddit.com/r/brdev/comments/1ncvpww/)

## Suporte

Para dúvidas ou problemas:
1. Verificar esta documentação primeiro
2. Consultar logs de erro detalhados (`DJENAPIError`)
3. Validar parâmetros de entrada
4. Testar endpoint manualmente (curl/Postman)

## Changelog

### v1.0.0 (2025-01-16)
- ✅ Implementação inicial completa
- ✅ Suporte a 7 tribunais principais
- ✅ UI responsiva com React/TypeScript
- ✅ Tratamento robusto de erros
- ✅ Exportação JSON
- ✅ Histórico de buscas persistido
- ✅ Documentação técnica completa
