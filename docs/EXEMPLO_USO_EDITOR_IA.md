# 💡 Exemplos Práticos - Editor IA com Streaming

## 📚 Guia de Uso do ProfessionalEditor com Agentes de IA

Este documento contém exemplos práticos de como integrar os agentes de IA com o CKEditor 5 de forma fluida.

---

## 🎯 Exemplo 1: Redação Automática de Petição (Agente Redator)

### Cenário
Mrs. Justin-e identificou uma intimação e precisa redigir uma contestação. O agente **Redação de Petições** vai escrever diretamente no editor.

```typescript
import { ProfessionalEditor } from '@/components/editor/ProfessionalEditor';
import { streamGeminiResponse } from '@/lib/gemini-service';
import { useState } from 'react';

export function ContestarIntimacao({ expediente }: { expediente: Expediente }) {
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState({
    numero_processo: expediente.numeroProcesso,
    tipo_intimacao: expediente.tipo,
    prazo_final: expediente.prazoFinal,
    nome_cliente: expediente.parte,
    data_hoje: new Date().toLocaleDateString('pt-BR'),
  });

  const handleStreamingIA = async (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => {
    // Monta o prompt com contexto jurídico
    const fullPrompt = `
SISTEMA: Você é um assistente jurídico especializado em redação de petições.

TAREFA: ${prompt}

DADOS DO PROCESSO:
- Número: {{numero_processo}}
- Tipo de Intimação: {{tipo_intimacao}}
- Prazo: {{prazo_final}}
- Cliente: {{nome_cliente}}
- Data: {{data_hoje}}

CONTEXTO DA INTIMAÇÃO:
${expediente.conteudo}

INSTRUÇÕES:
1. Use linguagem jurídica formal e técnica
2. Cite artigos de lei quando relevante
3. Estruture com: Cabeçalho → Fatos → Direito → Pedido
4. Mantenha variáveis no formato {{variavel}} para dados dinâmicos
5. Gere HTML rico quando necessário (tabelas, listas)

EXEMPLO DE ESTRUTURA:
<h2>I - DOS FATOS</h2>
<p>{{nome_cliente}} vem respeitosamente...</p>

<h2>II - DO DIREITO</h2>
<p>Conforme art. X da Lei Y...</p>

<table>
  <tr><th>Item</th><th>Valor</th></tr>
  <tr><td>Principal</td><td>{{valor_causa}}</td></tr>
</table>

<h2>III - DOS PEDIDOS</h2>
<ul>
  <li>Seja julgada procedente a presente ação...</li>
</ul>
`;

    // Streaming via Gemini
    try {
      const stream = streamGeminiResponse(fullPrompt);

      for await (const chunk of stream) {
        callbacks.onChunk(chunk);
      }

      callbacks.onComplete();
    } catch (error) {
      callbacks.onError(error as Error);
    }
  };

  return (
    <div className="space-y-4">
      <h1>Redigir Contestação</h1>

      <ProfessionalEditor
        content={content}
        onChange={setContent}
        variables={variables}
        showCollaboration={true}
        onAIStream={handleStreamingIA}
        placeholder="Digite /ai seguido do comando ou use os botões de IA..."
      />

      <div className="flex gap-2">
        <button onClick={() => handleStreamingIA("Redija uma contestação completa", {
          onChunk: (chunk) => console.log(chunk),
          onComplete: () => console.log('Concluído'),
          onError: (e) => console.error(e)
        })}>
          🤖 Gerar Contestação Completa
        </button>

        <button onClick={() => handleStreamingIA("Adicione fundamentação jurídica", {
          onChunk: (chunk) => console.log(chunk),
          onComplete: () => console.log('Concluído'),
          onError: (e) => console.error(e)
        })}>
          📚 Adicionar Fundamentação
        </button>
      </div>
    </div>
  );
}
```

---

## 🎯 Exemplo 2: Comandos `/ai` Inline

### Cenário
Advogado está escrevendo manualmente e quer que a IA continue.

```typescript
// No editor, o usuário digita:

"Excelentíssimo Senhor Doutor Juiz de Direito da Vara do Trabalho,

{{nome_cliente}}, nacionalidade brasileira, estado civil casado, CPF {{cpf}}, residente em {{endereco}}, vem respeitosamente perante Vossa Excelência, por meio de seu advogado infra-assinado, propor a presente

/ai continue escrevendo uma reclamação trabalhista por verbas rescisórias não pagas"

// Sistema detecta o comando, remove "/ai continue..." e a IA escreve:

RECLAMAÇÃO TRABALHISTA em desfavor de {{nome_empresa}}, CNPJ {{cnpj_empresa}}, situada em {{endereco_empresa}}, pelos fundamentos de fato e de direito a seguir expostos:

<h2>I - DOS FATOS</h2>

<p>O Reclamante foi admitido em {{data_admissao}} para exercer a função de {{cargo}}, mediante registro em CTPS, percebendo a remuneração mensal de {{salario}}.</p>

<p>Em {{data_demissao}}, o Reclamante foi dispensado sem justa causa, porém a Reclamada deixou de pagar as verbas rescisórias devidas, violando os artigos 477 e 467 da CLT.</p>

// ... continua escrevendo automaticamente
```

**Outros comandos úteis:**

```
/ai expanda o parágrafo anterior com jurisprudência do TST
/ai adicione uma tabela com cálculo de verbas trabalhistas
/ai revise o texto em linguagem mais técnica
/ai cite 3 precedentes relevantes sobre este tema
/ai adicione fundamentação baseada no art. 477 da CLT
```

---

## 🎯 Exemplo 3: Revisão Colaborativa Humano-IA

### Cenário
Advogado escreve um rascunho, a IA revisa e sugere melhorias.

```typescript
export function EditorRevisaoColaborativa() {
  const [content, setContent] = useState(`
    <p>O cliente quer processar a empresa porque não pagou direito.</p>
    <p>Ele trabalhou muito tempo e merece receber tudo.</p>
  `);

  const handleRevisar = async () => {
    const prompt = `
SISTEMA: Você é um revisor jurídico profissional.

TAREFA: Revise e melhore o texto a seguir, mantendo o significado mas elevando a linguagem para padrão jurídico formal.

TEXTO ORIGINAL:
${content}

DIRETRIZES:
1. Use termos técnicos jurídicos
2. Corrija gramática e concordância
3. Estruture em parágrafos lógicos
4. Adicione fundamentação legal quando cabível
5. Mantenha todas as informações do texto original
6. NÃO invente fatos não mencionados

FORMATO DE SAÍDA:
- Retorne APENAS o texto revisado em HTML
- Use <p>, <strong>, <em> quando necessário
- Não adicione explicações, apenas o texto revisado
`;

    // A IA vai reescrever o conteúdo de forma profissional
    // O editor vai mostrar o streaming em tempo real
  };

  return (
    <ProfessionalEditor
      content={content}
      onChange={setContent}
      showCollaboration={true}
      onAIStream={async (prompt, callbacks) => {
        // Implementação do streaming
        const stream = streamGeminiResponse(prompt);
        for await (const chunk of stream) {
          callbacks.onChunk(chunk);
        }
        callbacks.onComplete();
      }}
    />
  );
}

// Resultado após revisão:
/*
<p>O Reclamante busca a tutela jurisdicional em face da Reclamada, tendo em vista o inadimplemento de obrigações trabalhistas.</p>

<p>Considerando o longo período de prestação de serviços, faz jus o obreiro ao recebimento integral das verbas rescisórias devidas, nos termos dos artigos 477 e 478 da CLT.</p>
*/
```

---

## 🎯 Exemplo 4: Geração de Tabelas e Listas

### Cenário
Gerar cálculo de verbas trabalhistas com tabela formatada.

```typescript
const handleGerarCalculo = async () => {
  const prompt = `
Gere uma tabela HTML com o cálculo de verbas rescisórias:

- Aviso prévio indenizado: {{salario}} x 1
- 13º salário proporcional: {{salario}} / 12 x {{meses_trabalhados}}
- Férias vencidas: {{salario}} x 1.33
- Férias proporcionais: ({{salario}} / 12 x {{meses_trabalhados}}) x 1.33
- Multa 40% FGTS: {{saldo_fgts}} x 0.4

Use o seguinte formato HTML:

<table>
  <thead>
    <tr>
      <th>Verba</th>
      <th>Cálculo</th>
      <th>Valor</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Aviso Prévio Indenizado</td>
      <td>{{salario}} x 1</td>
      <td>R$ X.XXX,XX</td>
    </tr>
    <!-- ... -->
  </tbody>
  <tfoot>
    <tr>
      <th colspan="2">TOTAL</th>
      <th>R$ XX.XXX,XX</th>
    </tr>
  </tfoot>
</table>
`;

  // O editor vai renderizar a tabela formatada automaticamente
};
```

**Resultado no editor:**

| Verba | Cálculo | Valor |
|-------|---------|-------|
| Aviso Prévio Indenizado | R$ 3.000,00 x 1 | R$ 3.000,00 |
| 13º Salário Proporcional | R$ 3.000,00 / 12 x 8 | R$ 2.000,00 |
| Férias Vencidas | R$ 3.000,00 x 1.33 | R$ 3.990,00 |
| Férias Proporcionais | (R$ 3.000,00 / 12 x 8) x 1.33 | R$ 2.660,00 |
| Multa 40% FGTS | R$ 15.000,00 x 0.4 | R$ 6.000,00 |
| **TOTAL** | | **R$ 17.650,00** |

---

## 🎯 Exemplo 5: Multi-Agentes Escrevendo em Paralelo

### Cenário
Vários agentes trabalhando em diferentes seções da petição.

```typescript
export function PeticaoMultiAgentes() {
  const [content, setContent] = useState('');
  const editorRef = useRef<ClassicEditor | null>(null);

  const gerarSecaoCompleta = async () => {
    if (!editorRef.current) return;

    // Agente 1: Cabeçalho
    await inserirNoInicio(
      editorRef.current,
      `<h1>EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO</h1>
       <p>{{comarca}} - {{estado}}</p>`
    );

    // Agente 2: Fatos (em paralelo)
    Promise.all([
      gerarSecao("I - DOS FATOS", "Descreva os fatos relevantes..."),
      gerarSecao("II - DO DIREITO", "Fundamente juridicamente..."),
      gerarSecao("III - DOS PEDIDOS", "Liste os pedidos..."),
    ]);
  };

  const inserirNoInicio = (editor: ClassicEditor, html: string) => {
    editor.model.change((writer) => {
      const viewFragment = editor.data.processor.toView(html);
      const modelFragment = editor.data.toModel(viewFragment);
      const root = editor.model.document.getRoot()!;
      const position = writer.createPositionAt(root, 0);
      writer.insert(modelFragment, position);
    });
  };

  const gerarSecao = async (titulo: string, instrucao: string) => {
    const prompt = `
<h2>${titulo}</h2>

${instrucao}

Contexto: ${JSON.stringify(dadosProcesso)}
`;
    // Streaming...
  };

  return <ProfessionalEditor content={content} onChange={setContent} />;
}
```

---

## 🎯 Exemplo 6: Detecção de Variáveis Faltantes

### Cenário
IA detecta que faltam dados e gera variáveis automaticamente.

```typescript
const prompt = `
SISTEMA: Ao gerar documentos, se faltar algum dado, use variáveis no formato {{nome_variavel}}.

EXEMPLO:
- Nome não informado → {{nome_cliente}}
- CPF não informado → {{cpf}}
- Data não informada → {{data_audiencia}}
- Valor não informado → {{valor_causa}}

DOCUMENTO A GERAR:
Redija uma petição inicial de ação de cobrança.

DADOS DISPONÍVEIS:
- Comarca: São Paulo
- Cliente: João Silva

DADOS FALTANTES:
- CPF, endereço, valor da causa, data dos fatos
`;

// A IA vai gerar:
/*
<p>{{nome_cliente}}, brasileiro, portador do CPF {{cpf}}, residente em {{endereco_completo}}, vem propor a presente AÇÃO DE COBRANÇA em face de {{nome_reu}}, pelos fundamentos que seguem:</p>

<p>Em {{data_fatos}}, ocorreu o inadimplemento do débito no valor de {{valor_causa}}.</p>
*/
```

**Depois o usuário preenche:**

```typescript
setVariables({
  nome_cliente: "João Silva",
  cpf: "123.456.789-00",
  endereco_completo: "Rua X, 123 - São Paulo/SP",
  nome_reu: "Empresa XYZ Ltda",
  data_fatos: "15/01/2025",
  valor_causa: "R$ 10.000,00"
});

// O editor substitui automaticamente todas as variáveis
```

---

## 🎯 Exemplo 7: Exportação de Documento Final

### Cenário
Após a IA terminar, exportar para PDF/DOCX.

```typescript
export function ExportarDocumento() {
  const exportarPDF = (content: string) => {
    // Converter HTML do CKEditor para PDF
    const blob = htmlToPdf(content);
    saveAs(blob, 'peticao.pdf');
  };

  const exportarDOCX = (content: string) => {
    // Converter HTML do CKEditor para DOCX
    const blob = htmlToDocx(content);
    saveAs(blob, 'peticao.docx');
  };

  return (
    <div>
      <ProfessionalEditor content={content} onChange={setContent} />

      <div className="flex gap-2 mt-4">
        <button onClick={() => exportarPDF(content)}>
          📄 Exportar PDF
        </button>
        <button onClick={() => exportarDOCX(content)}>
          📝 Exportar DOCX
        </button>
        <button onClick={() => navigator.clipboard.writeText(content)}>
          📋 Copiar HTML
        </button>
      </div>
    </div>
  );
}
```

---

## 📊 Fluxo Completo: Da Intimação à Petição

```typescript
// 1. Mrs. Justin-e detecta intimação
const intimacao = await monitorDJEN();

// 2. Análise Documental extrai dados
const analise = await analisarExpediente(intimacao);

// 3. Gestão de Prazos calcula deadline
const prazo = calcularPrazo(analise.prazoEmDias);

// 4. Estratégia Processual define ação
const estrategia = await definirEstrategia(analise);

// 5. Redação de Petições gera documento
const peticao = await gerarPeticao({
  tipo: estrategia.tipoAcao,
  expediente: analise,
  prazo: prazo,
  template: 'contestacao_trabalhista',
  streaming: true, // ✅ Usa o editor com streaming fluido
});

// 6. Operador revisa no editor
<ProfessionalEditor
  content={peticao.conteudo}
  onChange={(novo) => salvarMinuta(novo)}
  variables={peticao.variaveis}
  showCollaboration={true}
/>

// 7. Aprovação e protocolo
await protocoloAutomatico(peticao.id);
```

---

## ✅ Checklist de Uso

- [ ] Importar `ProfessionalEditor` do caminho correto
- [ ] Passar `content` e `onChange` (obrigatórios)
- [ ] Definir `variables` com dados do processo
- [ ] Implementar `onAIStream` para seu serviço de IA
- [ ] Ativar `showCollaboration` para indicadores visuais
- [ ] Instruir a IA sobre formato de variáveis `{{variavel}}`
- [ ] Testar comandos `/ai` inline
- [ ] Validar substituição de variáveis
- [ ] Testar HTML rico (tabelas, listas)
- [ ] Verificar pausa automática na digitação

---

## 🚀 Dicas de Performance

1. **Buffer de Streaming**: Mantenha `BUFFER_SIZE` entre 5-10 para equilíbrio
2. **Chunks HTML**: Envie blocos HTML completos (`<p>...</p>`, não `<p>...`)
3. **Variáveis**: Substitua ANTES de inserir no editor para evitar re-renders
4. **Debounce**: Use debounce no `onChange` se for salvar no backend
5. **Lazy Loading**: Carregue o CKEditor de forma lazy se não usar imediatamente

```typescript
// Lazy load do editor
const ProfessionalEditor = lazy(() =>
  import('@/components/editor/ProfessionalEditor')
    .then(m => ({ default: m.ProfessionalEditor }))
);
```

---

**Atualizado em:** 24/12/2025
**Versão:** 1.0.0
**Compatibilidade:** CKEditor 5.x, React 19.x
