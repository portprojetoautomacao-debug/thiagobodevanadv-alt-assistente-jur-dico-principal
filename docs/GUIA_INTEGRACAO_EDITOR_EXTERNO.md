# 🔄 Guia de Integração de Componentes Externos de Editor

## 📋 Visão Geral

Este guia explica como analisar e integrar componentes de editor do repositório **Multi-Agent-Custom-Automation-Engine-Solution** no projeto atual.

---

## 🚀 Quick Start

### Passo 1: Analisar Componentes Disponíveis

```bash
./scripts/analyze-external-editor.sh
```

**O que este script faz:**
- ✅ Clona o repositório externo temporariamente
- ✅ Procura todos os componentes relacionados a editores
- ✅ Analisa dependências (package.json)
- ✅ Identifica hooks e utilitários
- ✅ Gera relatório completo em `docs/ANALISE_EDITOR_EXTERNO.md`

**Resultado:**
```
📊 Relatório gerado: docs/ANALISE_EDITOR_EXTERNO.md
```

---

### Passo 2: Revisar Relatório de Análise

```bash
cat docs/ANALISE_EDITOR_EXTERNO.md
```

O relatório contém:
- 📁 Lista de todos os componentes de editor encontrados
- 📦 Dependências de editor no package.json
- 🪝 Hooks relacionados
- 🛠️ Utilitários úteis
- 🎯 Recomendações de integração

---

### Passo 3: Listar Componentes para Integração

```bash
./scripts/integrate-external-components.sh
```

**Saída:**
```
📁 Componentes de Editor disponíveis:
 1. ./src/components/RichEditor.tsx
 2. ./src/components/AdvancedEditor.tsx
 3. ./src/hooks/useEditorState.ts
 ...
```

---

### Passo 4: Integrar Componente Específico

```bash
./scripts/integrate-external-components.sh ./src/components/RichEditor.tsx
```

**O que acontece:**
1. ✅ Clone do repositório externo
2. ✅ Cópia do arquivo para `src/components/editor/external/`
3. ✅ Análise de dependências
4. ✅ Geração de documentação
5. ✅ Criação de exemplo de uso

**Arquivos criados:**
```
src/components/editor/external/
├── RichEditor.tsx                    # Componente copiado
├── README.md                         # Documentação da integração
└── example-usage.tsx                 # Exemplo de como usar
```

---

## 📊 Estrutura de Diretórios

```
src/components/editor/
├── ProfessionalEditor.tsx           # Editor atual (CKEditor 5)
├── professional-editor.scss         # Estilos do editor atual
├── index.ts                         # Exports principais
└── external/                        # 🆕 Componentes externos
    ├── README.md                    # Documentação
    ├── example-usage.tsx            # Exemplos
    └── [componentes-copiados].tsx   # Arquivos integrados
```

---

## 🔍 Análise Detalhada

### O que o script de análise procura:

#### 1. **Componentes de Editor**
- `*editor*.tsx`
- `*editor*.ts`
- `*Editor*.tsx`
- `*Editor*.ts`

#### 2. **Bibliotecas de Editor**
- Tiptap (@tiptap/*)
- Lexical (lexical)
- Slate (slate)
- ProseMirror (prosemirror-*)
- Quill (quill)
- TinyMCE (tinymce)
- Draft.js (draft-js)
- CKEditor (@ckeditor/*)

#### 3. **Hooks Customizados**
- `useEditor*`
- `use*Editor*`

#### 4. **Utilitários**
- Funções de conversão (HTML ↔ Markdown)
- Validação de conteúdo
- Formatação de texto

---

## 🎯 Casos de Uso

### Cenário 1: Copiar Hook de Estado de Editor

```bash
# 1. Analisar
./scripts/analyze-external-editor.sh

# 2. Revisar relatório e encontrar hook
cat docs/ANALISE_EDITOR_EXTERNO.md | grep "useEditorState"

# 3. Integrar
./scripts/integrate-external-components.sh ./src/hooks/useEditorState.ts

# 4. Usar no projeto
```

```typescript
// src/components/MinutasManagerV2.tsx
import { useEditorState } from '@/components/editor/external/useEditorState';

function MinutasEditor() {
  const { content, setContent, isDirty, reset } = useEditorState('');

  return <ProfessionalEditor content={content} onChange={setContent} />;
}
```

---

### Cenário 2: Copiar Utilitário de Conversão

```bash
./scripts/integrate-external-components.sh ./src/utils/htmlToMarkdown.ts
```

```typescript
// Usar no projeto
import { htmlToMarkdown } from '@/components/editor/external/htmlToMarkdown';

const markdown = htmlToMarkdown(editorContent);
```

---

### Cenário 3: Copiar Plugin Customizado

```bash
./scripts/integrate-external-components.sh ./src/plugins/AIAssistantPlugin.ts
```

```typescript
// Integrar ao CKEditor atual
import { AIAssistantPlugin } from '@/components/editor/external/AIAssistantPlugin';

const editorConfig = {
  plugins: [
    // ... plugins existentes
    AIAssistantPlugin,
  ],
};
```

---

## ⚠️ Checklist de Integração

Após integrar um componente externo, siga este checklist:

### 1. ✅ **Revisão de Código**
- [ ] Ler código completo do componente
- [ ] Entender funcionalidade e propósito
- [ ] Verificar qualidade e padrões de código
- [ ] Identificar possíveis bugs ou problemas

### 2. ✅ **Compatibilidade**
- [ ] Verificar compatibilidade com React 19
- [ ] Verificar compatibilidade com TypeScript strict
- [ ] Verificar compatibilidade com CKEditor 5
- [ ] Testar em ambiente de desenvolvimento

### 3. ✅ **Dependências**
- [ ] Identificar dependências necessárias
- [ ] Instalar dependências faltantes: `npm install [pacote]`
- [ ] Verificar conflitos de versões
- [ ] Atualizar `package.json` se necessário

### 4. ✅ **Adaptação**
- [ ] Substituir imports relativos por `@/` alias
- [ ] Adaptar tipos TypeScript se necessário
- [ ] Ajustar estilos CSS/SCSS
- [ ] Remover código não utilizado

### 5. ✅ **Testes**
- [ ] Criar testes unitários
- [ ] Testar integração com componentes existentes
- [ ] Executar `npm run test`
- [ ] Executar `npm run type-check`
- [ ] Executar `npm run lint`

### 6. ✅ **Documentação**
- [ ] Documentar uso do componente
- [ ] Adicionar exemplos práticos
- [ ] Atualizar README.md do projeto
- [ ] Adicionar comentários JSDoc

### 7. ✅ **Performance**
- [ ] Verificar impacto no bundle size
- [ ] Testar performance em produção
- [ ] Otimizar se necessário (lazy loading, code splitting)

### 8. ✅ **Segurança e Licença**
- [ ] Verificar licença do componente original
- [ ] Adicionar atribuição adequada
- [ ] Verificar vulnerabilidades conhecidas
- [ ] Validar inputs/outputs

---

## 🛠️ Troubleshooting

### Problema: Dependência não encontrada

```bash
❌ Dependência não instalada: @tiptap/core
```

**Solução:**
```bash
npm install @tiptap/core @tiptap/react @tiptap/starter-kit
```

---

### Problema: Conflito de tipos TypeScript

```
❌ Type 'X' is not assignable to type 'Y'
```

**Solução:**
```typescript
// Adicionar arquivo de tipos em src/types/external.ts
export interface AdaptedType extends OriginalType {
  // Adaptações necessárias
}
```

---

### Problema: Estilos CSS conflitantes

```
⚠️ Classes CSS conflitando com CKEditor 5
```

**Solução:**
```scss
// src/components/editor/external/external-editor.scss
.external-editor {
  // Encapsular estilos em namespace único
  &__content { /* ... */ }
  &__toolbar { /* ... */ }
}
```

---

## 📚 Exemplos de Integração

### Exemplo 1: Hook de Gerenciamento de Estado

```typescript
// src/components/editor/external/useEditorContent.ts
import { useState, useCallback } from 'react';

export function useEditorContent(initialContent: string = '') {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== initialContent);
  }, [initialContent]);

  const reset = useCallback(() => {
    setContent(initialContent);
    setIsDirty(false);
  }, [initialContent]);

  return { content, handleChange, isDirty, reset };
}
```

**Uso:**
```typescript
function MinutaEditor() {
  const { content, handleChange, isDirty, reset } = useEditorContent('');

  return (
    <>
      <ProfessionalEditor content={content} onChange={handleChange} />
      {isDirty && <Button onClick={reset}>Descartar Alterações</Button>}
    </>
  );
}
```

---

### Exemplo 2: Utilitário de Conversão

```typescript
// src/components/editor/external/convertContent.ts
export function htmlToPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function htmlToMarkdown(html: string): string {
  // Conversões básicas
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n');
}
```

**Uso:**
```typescript
const plainText = htmlToPlainText(editorContent);
const markdown = htmlToMarkdown(editorContent);
```

---

## 🎯 Próximos Passos

Depois de executar a análise:

1. **Revisar** o relatório gerado: `docs/ANALISE_EDITOR_EXTERNO.md`
2. **Identificar** componentes úteis para o projeto
3. **Integrar** componentes selecionados
4. **Testar** integração localmente
5. **Documentar** mudanças no projeto
6. **Commit** seguindo padrões do projeto

---

## 📖 Comandos de Referência Rápida

```bash
# Análise completa
./scripts/analyze-external-editor.sh

# Listar componentes disponíveis
./scripts/integrate-external-components.sh

# Integrar componente específico
./scripts/integrate-external-components.sh ./src/components/Editor.tsx

# Verificar relatório
cat docs/ANALISE_EDITOR_EXTERNO.md

# Testar após integração
npm run type-check
npm run lint
npm run test
```

---

## 🔐 Segurança e Compliance

### Verificar Licença

```bash
# Procurar arquivo de licença no repositório externo
cat /tmp/external-editor-analysis/LICENSE

# Verificar compatibilidade com GPL v3 (projeto atual)
```

### Validar Código

- ✅ Executar SonarQube: `npm run sonar:analyze`
- ✅ Verificar vulnerabilidades: `npm audit`
- ✅ Revisar manualmente código sensível

---

**Atualizado em**: 24/12/2025
**Versão**: 1.0.0
**Modo**: MANUTENÇÃO (Apenas correções críticas)
