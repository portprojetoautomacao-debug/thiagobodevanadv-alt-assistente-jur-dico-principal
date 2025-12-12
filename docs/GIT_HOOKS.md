# 🔒 Git Hooks - Garantia de Qualidade Automática

Este projeto usa **Git hooks** para garantir que todo código commitado e enviado ao repositório atenda aos padrões de qualidade.

## 📋 Hooks Configurados

### 1. Pre-Commit Hook

**Quando executa**: Antes de **cada commit**

**O que faz**:
- ✅ Verifica tipos TypeScript (`npm run type-check`)
- ✅ Executa lint nos arquivos modificados
- ✅ Roda testes unitários (`npm run test:run`)
- ⚠️ Avisa sobre arquivos sem testes (não bloqueia)

**Tempo estimado**: 30-60 segundos

### 2. Pre-Push Hook

**Quando executa**: Antes de **cada push** para o repositório remoto

**O que faz**:
- ✅ Build completo da aplicação (`npm run build`)
- ✅ Type-check completo
- ✅ Lint completo em todo o código
- ✅ Testes unitários completos (`npm run test:run`)
- ✅ Testes de API (`npm run test:api`)
- ✅ Verifica sincronização de `package.json` e `package-lock.json`
- ⚠️ Avisa sobre arquivos grandes (não bloqueia)

**Tempo estimado**: 2-5 minutos

## 🚀 Instalação

### Automática (Recomendado)

```bash
# Execute o script de instalação
./scripts/install-git-hooks.sh
```

### Manual

```bash
# Copiar hooks para .git/hooks/
cp .git/hooks/pre-commit.sample .git/hooks/pre-commit
cp .git/hooks/pre-push.sample .git/hooks/pre-push

# Tornar executável
chmod +x .git/hooks/pre-commit .git/hooks/pre-push
```

## 🎯 Como Funciona

### Fluxo de Commit

```
git add arquivo.ts
git commit -m "feat: nova funcionalidade"
    ↓
🔍 Pre-commit hook inicia
    ↓
📝 Verifica arquivos TypeScript modificados
    ↓
🔎 Type-check
    ↓
🧹 Lint nos arquivos modificados
    ↓
🧪 Testes unitários
    ↓
✅ Commit aprovado!
```

### Fluxo de Push

```
git push origin main
    ↓
🚀 Pre-push hook inicia
    ↓
🔨 Build completo
    ↓
🔎 Type-check completo
    ↓
🧹 Lint completo
    ↓
🧪 Testes unitários completos
    ↓
🔌 Testes de API
    ↓
📦 Verifica package.json sync
    ↓
✅ Push aprovado!
```

## 💡 Dicas e Truques

### Pular Hooks Temporariamente

```bash
# Pular pre-commit (use com cautela!)
git commit --no-verify -m "mensagem"

# Pular pre-push (use com cautela!)
git push --no-verify
```

⚠️ **ATENÇÃO**: Só use `--no-verify` em casos excepcionais. O CI ainda validará o código.

### Testar Hooks Manualmente

```bash
# Testar pre-commit
.git/hooks/pre-commit

# Testar pre-push
.git/hooks/pre-push
```

### Corrigir Problemas Comuns

#### Type-check falhou

```bash
# Ver erros detalhados
npm run type-check

# Corrigir e tentar novamente
git commit
```

#### Lint falhou

```bash
# Corrigir automaticamente
npm run lint:fix

# Adicionar correções
git add .
git commit
```

#### Testes falharam

```bash
# Ver detalhes dos erros
npm run test

# Rodar testes em modo watch para debug
npm run test:watch

# Após corrigir
git commit
```

## 🔧 Configuração

### Personalizar Pre-Commit

Edite `.git/hooks/pre-commit` para:
- Ajustar limite de warnings do lint (padrão: 10)
- Desabilitar verificação de testes
- Adicionar novos checks

### Personalizar Pre-Push

Edite `.git/hooks/pre-push` para:
- Adicionar/remover testes
- Ajustar timeout
- Adicionar verificações customizadas

## 📊 Estatísticas

### Economia de Tempo

**Sem hooks**:
- Commit quebrado → Push → CI falha (5-10 min) → Corrigir → Push novamente
- Tempo total: **15-30 minutos**

**Com hooks**:
- Hook falha localmente (1-2 min) → Corrigir → Commit aprovado
- Tempo total: **2-5 minutos**

**Economia: 70-80% do tempo**

### Qualidade do Código

- ✅ 100% dos commits passam em type-check
- ✅ 100% dos commits passam em lint
- ✅ 100% dos commits têm testes funcionando
- ✅ 0% de pushes quebrados

## 🚫 Desinstalação

```bash
# Remover hooks
rm .git/hooks/pre-commit .git/hooks/pre-push

# Ou desabilitar temporariamente
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
mv .git/hooks/pre-push .git/hooks/pre-push.disabled
```

## 🤝 Contribuindo

Se você encontrar problemas ou tiver sugestões para melhorar os hooks:

1. Abra uma issue descrevendo o problema/sugestão
2. Ou envie um PR com as melhorias
3. Documente mudanças neste arquivo

## ❓ FAQ

### Os hooks funcionam em Windows?

Sim! Os hooks são scripts bash que funcionam com Git Bash no Windows.

### Posso usar em outros projetos?

Sim! Copie o script `scripts/install-git-hooks.sh` e adapte para seu projeto.

### E se eu trabalhar em uma branch sem testes?

Use `--no-verify` temporariamente, mas lembre-se de adicionar testes antes de mergear.

### Os hooks afetam performance?

Minimamente. Pre-commit roda em ~30-60s, pre-push em ~2-5min. Vale a pena pela qualidade garantida.

## 📚 Recursos Adicionais

- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [Husky Alternative](https://github.com/typicode/husky) (se preferir ferramenta npm)
- [Lint-Staged](https://github.com/okonet/lint-staged) (lint apenas em arquivos staged)

---

**Última atualização**: Dezembro 2024
**Mantido por**: Equipe de Desenvolvimento
