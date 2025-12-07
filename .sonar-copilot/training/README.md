# Sonar Copilot Assistant - Training Data

Este diretório armazena padrões aprendidos pelo Copilot Assistant.

## 📁 Estrutura

```
.sonar-copilot/
├── training/
│   ├── patterns/          # Padrões de fix aprovados
│   │   ├── typescript-S1117.json
│   │   ├── typescript-S1481.json
│   │   └── ...
│   └── metadata.json      # Metadados de aprendizado
└── logs/                  # Logs (não commitados)
```

## 🤖 Como Funciona

1. **Fix Aprovado:** Você aplica uma correção sugerida
2. **Documentação:** Sistema salva o padrão aqui
3. **Aprendizado:** Copilot usa esses padrões em issues similares

## ⚠️ Não Deletar

Este diretório é gerenciado automaticamente pelo Sonar Copilot Assistant.
Deletar pode fazer o Copilot perder padrões aprendidos.
