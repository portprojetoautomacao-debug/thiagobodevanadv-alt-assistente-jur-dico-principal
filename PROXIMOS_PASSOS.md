# 🚀 Próximos Passos - Implementações Prioritárias

**Última Atualização:** Janeiro 2025  
**Status do Sistema:** ✅ Funcional em Produção

---

## 📊 Visão Geral de Completude

```
Sistema Base (CRUD):        ████████████████████ 100% ✅
Design & UX:                ████████████████████ 100% ✅
Autenticação:               ████████████████████ 100% ✅
Gráficos & Visualização:    ████████████████████ 100% ✅
Exportação de Dados:        ████████████████████ 100% ✅
IA & Automação:             ████████░░░░░░░░░░░░  45% 🔄
Integrações Externas:       ██░░░░░░░░░░░░░░░░░░  10% ⏸️
Notificações:               ░░░░░░░░░░░░░░░░░░░░   0% 📋

TOTAL GERAL:                ███████████████░░░░░  75%
```

---

## ✅ Implementações Concluídas Recentemente

### 1. 📊 Gráficos no Dashboard ✅ COMPLETO
**Status:** Implementado e funcionando  
**Tempo de implementação:** 2 horas

**Gráficos adicionados:**
- ✅ Gráfico de pizza: Processos por Status
- ✅ Gráfico de barras: Top 5 Varas com mais processos
- ✅ Gráfico de linha: Evolução de processos (últimos 6 meses)
- ✅ Responsivos e com tema consistente
- ✅ Tooltips interativos

**Biblioteca:** `recharts` (já estava instalada)

---

### 2. 💾 Exportação de Relatórios CSV ✅ COMPLETO
**Status:** Implementado em todas as views principais  
**Tempo de implementação:** 1.5 horas

**Funcionalidades adicionadas:**
- ✅ Exportar processos para CSV (ProcessosView)
- ✅ Exportar prazos para CSV (PrazosView)
- ✅ Exportar clientes para CSV (ClientesView)
- ✅ Exportar dados financeiros para CSV (FinancialManagement)
- ✅ Função helper `exportToCSV` em `lib/utils.ts`
- ✅ Formatação UTF-8 com BOM para Excel
- ✅ Tratamento de valores nulos e aspas
- ✅ Nome de arquivo com data automática

**Como usar:**
```tsx
// Botão de exportação adicionado em cada view
<Button variant="outline" onClick={handleExportCSV}>
  <DownloadSimple size={20} />
  Exportar CSV
</Button>
```

---

## 🎯 Próximas Implementações Recomendadas

### 1. 🔔 Sistema de Notificações Push (3-4 horas)
**Prioridade:** 🔥🔥🔥 ALTA  
**Impacto:** Nunca perder prazos críticos

**O que fazer:**
- [ ] Solicitar permissão de notificações do navegador
- [ ] Notificações para prazos D-7, D-2, D-1
- [ ] Notificações quando agentes completam tarefas
- [ ] Badge de contador de notificações não lidas

**Implementação sugerida:**
```tsx
// Hook customizado: hooks/use-notifications.ts
import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

export function useNotifications() {
  const [prazos] = useKV('prazos', [])
  
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
  
  useEffect(() => {
    const checkPrazos = () => {
      const hoje = new Date()
      prazos.forEach(prazo => {
        const vencimento = new Date(prazo.dataVencimento)
        const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))
        
        if ([7, 2, 1].includes(diasRestantes)) {
          new Notification('⚖️ Prazo Próximo!', {
            body: `${prazo.titulo} vence em ${diasRestantes} dia(s)`,
            icon: '/icon-192.png',
            tag: prazo.id
          })
        }
      })
    }
    
    const interval = setInterval(checkPrazos, 60000) // Check a cada minuto
    return () => clearInterval(interval)
  }, [prazos])
}
```

---

### 2. 🔍 Busca Avançada Multi-Filtro (2-3 horas)
**Prioridade:** 🔥🔥 MÉDIA-ALTA  
**Impacto:** Encontrar processos/clientes rapidamente

**O que fazer:**
- [ ] Filtros combinados (status + cliente + período)
- [ ] Busca fuzzy (tolerante a erros de digitação)
- [ ] Auto-complete em campos de busca
- [ ] Salvamento de filtros favoritos

**Biblioteca sugerida:** `fuse.js` (precisa instalar)

```bash
npm install fuse.js
```

**Implementação:**
```tsx
// Em ProcessosView.tsx
import Fuse from 'fuse.js'

const fuse = new Fuse(processos, {
  keys: ['numero', 'cliente', 'assunto', 'vara'],
  threshold: 0.3, // 0 = exact, 1 = match anything
})

const handleSearch = (query: string) => {
  if (!query) {
    setFilteredProcessos(processos)
  } else {
    const results = fuse.search(query)
    setFilteredProcessos(results.map(r => r.item))
  }
}
```

---

### 3. 📎 Upload de Documentos (3-4 horas)
**Prioridade:** 🔥 MÉDIA  
**Impacto:** Centralizar arquivos de processos

**O que fazer:**
- [ ] Upload de PDFs para processos
- [ ] Armazenamento em base64 no KV (para arquivos pequenos < 1MB)
- [ ] Preview de PDFs inline
- [ ] Lista de documentos por processo
- [ ] Download de documentos

**Implementação sugerida:**
```tsx
// Componente: components/DocumentUploader.tsx
import { useKV } from '@github/spark/hooks'

function DocumentUploader({ processoId }: { processoId: string }) {
  const [documentos, setDocumentos] = useKV<Document[]>(`docs-${processoId}`, [])
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 1MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setDocumentos(docs => [...docs, {
        id: Date.now().toString(),
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        data: new Date().toISOString(),
        conteudo: base64
      }])
      toast.success('Documento enviado!')
    }
    reader.readAsDataURL(file)
  }
  
  return (
    <div>
      <Input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} />
      {documentos.map(doc => (
        <div key={doc.id}>
          <FileText size={16} />
          {doc.nome} ({(doc.tamanho / 1024).toFixed(1)} KB)
        </div>
      ))}
    </div>
  )
}
```

---

## 🎯 Implementações de Médio Prazo

### 6. 🗓️ Integração Google Calendar (1-2 dias)
**Prioridade:** BAIXA (requer OAuth)  
**Status:** ⏸️ Documentação pronta em `GOOGLE_CALENDAR_INTEGRATION.md`

**Motivo do adiamento:** Requer configuração de OAuth2 no Google Cloud Console e backend para gerenciar tokens. Complexo para um MVP.

---

### 7. 📧 Integração Gmail para E-mails (1-2 dias)
**Prioridade:** BAIXA (requer OAuth)  
**Status:** ⏸️ Não iniciada

**O que seria:** Enviar e-mails de alertas de prazo, lembretes de honorários, etc.

---

### 8. 🤖 Agentes IA Autônomos Funcionais (3-5 dias)
**Prioridade:** BAIXA (requer backend)  
**Status:** 🔄 Interface criada, lógica não implementada

**Componentes existentes:**
- ✅ `AIAgents.tsx` - UI completa
- ✅ `AgentMetrics.tsx` - Dashboard de métricas
- ❌ Lógica de execução em background
- ❌ Fila de tarefas persistente
- ❌ Integração real com DJEN/PJe

**Motivo do adiamento:** Agentes autônomos requerem execução em background (workers) ou backend. Spark é frontend-only.

---

## 📋 Quick Wins (< 1 hora cada)

### ✨ Melhorias Rápidas que Causam Grande Impacto

1. **Loading States** (30min)
   - Skeletons em vez de "Carregando..."
   - Usar `<Skeleton />` do shadcn

2. **Empty States Melhores** (30min)
   - Ilustrações ou ícones grandes
   - CTAs claros ("Cadastre seu primeiro processo")

3. **Tooltips Informativos** (20min)
   - Explicar campos complexos
   - Atalhos de teclado

4. **Confirmações de Ações Críticas** (30min)
   - AlertDialog antes de deletar processo
   - Confirmação antes de arquivar cliente

5. **Atalhos de Teclado** (1h)
   - `Ctrl+K` para busca rápida (cmd+k no Mac)
   - `N` para novo processo
   - `/` para focar na busca

---

## 🛠️ Melhorias de Código (Tech Debt)

### Refatorações Recomendadas

1. **Extrair lógica de cálculo de prazos** (1h)
   - Criar `lib/prazo-calculator.ts`
   - Centralizar lógica de feriados e dias úteis

2. **Tipos TypeScript mais estritos** (2h)
   - Substituir `any` por tipos específicos
   - Criar interfaces para todas as entidades

3. **Testes Unitários** (3-4h)
   - Testar cálculo de prazos
   - Testar filtros e buscas
   - Usar Vitest (já configurado)

---

## 📦 Dependências a Instalar (se escolher features acima)

```bash
# Para busca avançada
npm install fuse.js

# Para exportação PDF (alternativa ao CSV)
npm install jspdf jspdf-autotable

# Para drag-and-drop de upload
npm install react-dropzone

# Para rich text editor (minutas)
npm install @tiptap/react @tiptap/starter-kit
```

---

## 🎯 Recomendação do Spark Agent

### Se você tem 1 hora:
👉 **Implementar Quick Wins** - Maior ROI em menos tempo

### Se você tem 1 tarde (4h):
👉 **Gráficos no Dashboard** (3h) + **Exportação CSV** (1h)

### Se você tem 1 dia:
👉 **Gráficos** + **Exportação** + **Notificações Push** + **Busca Avançada**

### Se você tem 1 semana:
👉 Todas as 5 implementações prioritárias + Quick Wins + Upload de Documentos

---

## ❓ Qual você quer implementar agora?

**Escolha uma das opções:**

1. "Adicionar gráficos no dashboard"
2. "Implementar exportação CSV"
3. "Criar sistema de notificações"
4. "Melhorar busca de processos"
5. "Adicionar upload de documentos"
6. "Fazer quick wins (melhorias rápidas)"
7. "Mostrar código de exemplo de [feature específica]"

---

**Autor:** Spark Agent  
**Data:** Janeiro 2025
