# CKEditor 5 Custom Build Configuration

Este documento descreve a configuração de build customizada do CKEditor 5 para o Assistente Jurídico PJe.

## 🎯 Plugins Incluídos

### Core Features
- ✅ **ClassicEditor** - Editor clássico com toolbar
- ✅ **Essentials** - Funcionalidades básicas
- ✅ **Autoformat** - Formatação automática (Markdown-like)
- ✅ **Autosave** - Salvamento automático
- ✅ **Undo/Redo** - Desfazer/Refazer

### Text Formatting
- ✅ **Bold, Italic, Underline** - Formatação básica
- ✅ **Strikethrough** - Texto tachado
- ✅ **Subscript, Superscript** - Sobrescrito/subscrito
- ✅ **Code** - Código inline

### Typography
- ✅ **Heading** - Títulos (h1-h6)
- ✅ **Paragraph** - Parágrafos
- ✅ **FontFamily** - Famílias de fontes
- ✅ **FontSize** - Tamanhos de fonte
- ✅ **FontColor** - Cor do texto
- ✅ **FontBackgroundColor** - Cor de fundo do texto
- ✅ **Highlight** - Destaque de texto

### Lists & Indentation
- ✅ **List** - Listas numeradas/não numeradas
- ✅ **ListProperties** - Propriedades de listas
- ✅ **TodoList** - Listas de tarefas
- ✅ **Indent, IndentBlock** - Indentação

### Blocks
- ✅ **BlockQuote** - Citações
- ✅ **HorizontalLine** - Linha horizontal

### Tables
- ✅ **Table** - Tabelas
- ✅ **TableToolbar** - Toolbar de tabelas
- ✅ **TableProperties** - Propriedades de tabelas
- ✅ **TableCellProperties** - Propriedades de células
- ✅ **TableColumnResize** - Redimensionamento de colunas
- ✅ **TableCaption** - Legendas de tabelas

### Links & Media
- ✅ **Link** - Links
- ✅ **AutoLink** - Links automáticos
- ✅ **SpecialCharacters** - Caracteres especiais
- ✅ **SpecialCharactersEssentials** - Caracteres especiais essenciais

### Tools
- ✅ **FindAndReplace** - Buscar e substituir
- ✅ **SelectAll** - Selecionar tudo
- ✅ **WordCount** - Contador de palavras
- ✅ **BalloonToolbar** - Toolbar flutuante
- ✅ **AccessibilityHelp** - Ajuda de acessibilidade
- ✅ **TextTransformation** - Transformação de texto

## 🚀 Plugins Premium (Necessários para Features Avançadas)

### Track Changes (Rastreamento de Mudanças)
**Status**: ❌ Não incluído (requer licença premium)

**Como adicionar**:
```bash
npm install @ckeditor/ckeditor5-track-changes
```

**Configuração**:
```typescript
import TrackChanges from '@ckeditor/ckeditor5-track-changes/src/trackchanges';

ClassicEditor
  .create(element, {
    plugins: [..., TrackChanges],
    trackChanges: {
      // Configurações
    }
  });
```

### Comments (Comentários)
**Status**: ❌ Não incluído (requer licença premium)

**Como adicionar**:
```bash
npm install @ckeditor/ckeditor5-comments
```

**Configuração**:
```typescript
import Comments from '@ckeditor/ckeditor5-comments/src/comments';

ClassicEditor
  .create(element, {
    plugins: [..., Comments],
    comments: {
      // Configurações
    }
  });
```

### Revision History (Histórico de Revisões)
**Status**: ❌ Não incluído (requer licença premium)

**Como adicionar**:
```bash
npm install @ckeditor/ckeditor5-revision-history
```

**Configuração**:
```typescript
import RevisionHistory from '@ckeditor/ckeditor5-revision-history/src/revisionhistory';

ClassicEditor
  .create(element, {
    plugins: [..., RevisionHistory],
    revisionHistory: {
      // Configurações
    }
  });
```

## 📦 Build Customizada

### Opção 1: CKEditor Online Builder (Recomendado)
1. Acesse: https://ckeditor.com/ckeditor-5/online-builder/
2. Selecione "Classic Editor"
3. Adicione plugins necessários
4. Baixe o build customizado
5. Substitua `ckeditor5` no package.json

### Opção 2: Build Manual (Avançado)
```bash
# Clone do repositório CKEditor 5
git clone https://github.com/ckeditor/ckeditor5.git
cd ckeditor5

# Instalar dependências
npm install

# Criar configuração customizada
# Editar: packages/ckeditor5-build-classic/src/ckeditor.js

# Build
npm run build

# Copiar build para projeto
cp -r build/ckeditor5-build-classic.js <projeto>/public/ckeditor/
```

### Opção 3: Import Direto (Atual - Limitado)
```typescript
// Importa da distribuição oficial
import { ClassicEditor, /* plugins */ } from 'ckeditor5';
```

**Limitação**: Plugins premium não estão disponíveis sem licença.

## 🔐 Licenciamento CKEditor 5

### Open Source (GPL)
- ✅ Grátis para projetos GPL
- ✅ Todos os plugins básicos incluídos
- ❌ Plugins premium não incluídos

### Licença Comercial
- ✅ Uso em projetos proprietários
- ✅ Track Changes, Comments, Revision History
- ✅ Suporte premium
- 💰 Preço: Sob consulta (https://ckeditor.com/pricing/)

## 🛠️ Alternativas para Track Changes

### 1. Implementação Custom
```typescript
// Usar extensões CKEditor para rastrear mudanças
import { Plugin } from '@ckeditor/ckeditor5-core';

class CustomTrackChanges extends Plugin {
  init() {
    // Implementação customizada
  }
}
```

### 2. Integração com Git/Diff
```typescript
// Usar diff de strings para mostrar mudanças
import { diffWords } from 'diff';

function trackChanges(original: string, modified: string) {
  return diffWords(original, modified);
}
```

### 3. Usar outro Editor
- **ProseMirror** - Com track changes customizado
- **Quill** - Com módulo de histórico
- **TipTap** - Baseado em ProseMirror (removido do projeto)

## 📝 Configuração Atual

```typescript
// src/components/editor/ProfessionalEditor.tsx
const editorConfig: EditorConfig = {
  toolbar: {
    items: [
      "undo", "redo", "|",
      "heading", "|",
      "fontSize", "fontFamily", "fontColor", "fontBackgroundColor", "|",
      "bold", "italic", "underline", "strikethrough", "subscript", "superscript", "code", "|",
      "link", "insertTable", "blockQuote", "horizontalLine", "specialCharacters", "|",
      "bulletedList", "numberedList", "todoList", "outdent", "indent", "|",
      "findAndReplace", "selectAll",
    ],
  },
  // ... outras configurações
};
```

## ✅ Recomendações

### Para Rastreamento de Mudanças:
1. **Curto prazo**: Implementar diff simples usando `diff` library
2. **Médio prazo**: Avaliar licença CKEditor 5 comercial
3. **Longo prazo**: Considerar ProseMirror com track changes customizado

### Para Colaboração:
1. **Usar Upstash Redis** para sincronização em tempo real
2. **WebSockets** para comunicação entre usuários
3. **Operational Transform** para resolução de conflitos

### Para Versionamento:
1. **Git-like versioning** para documentos
2. **Snapshots automáticos** a cada X minutos
3. **Diffs visuais** usando bibliotecas de diff

## 🔗 Recursos

- **CKEditor 5 Docs**: https://ckeditor.com/docs/ckeditor5/latest/
- **Online Builder**: https://ckeditor.com/ckeditor-5/online-builder/
- **Plugin API**: https://ckeditor.com/docs/ckeditor5/latest/api/
- **GitHub**: https://github.com/ckeditor/ckeditor5
- **Pricing**: https://ckeditor.com/pricing/

## 📊 Status de Implementação

| Feature | Status | Solução |
|---------|--------|---------|
| Editor Básico | ✅ Completo | CKEditor 5 Open Source |
| Formatação Avançada | ✅ Completo | Plugins incluídos |
| Tabelas | ✅ Completo | Plugins incluídos |
| Track Changes | ⚠️ Limitado | Implementar custom ou licença comercial |
| Comments | ⚠️ Limitado | Implementar custom ou licença comercial |
| Revision History | ⚠️ Limitado | Implementar custom ou licença comercial |
| AI Streaming | ✅ Completo | Implementado em ProfessionalEditor |
| Colaboração Tempo Real | 🔄 Em andamento | WebSockets + Redis |
