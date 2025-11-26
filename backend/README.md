# Backend API - Assistente Jurídico PJe

Backend API em Node.js/TypeScript para o sistema Assistente Jurídico PJe, com foco na proteção das chaves Spark e gerenciamento seguro de recursos.

## 🚀 Funcionalidades

- **Proteção de Chaves Spark**: Gerenciamento seguro das credenciais Spark
- **API KV Store**: Armazenamento persistente de chave-valor
- **Interface LLM**: Comunicação com modelos de linguagem
- **CORS Configurado**: Suporte para frontend
- **TypeScript**: Tipagem forte e segura
- **Health Checks**: Monitoramento de saúde da API

## 📦 Instalação

```bash
cd backend
npm install
```

## 🏃‍♂️ Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento com hot reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Executa versão compilada
- `npm run test` - Executa testes (placeholder)

## 🌐 Endpoints da API

### Health Check
```
GET /health
```
Retorna status do servidor e ambiente.

### Spark API
```
GET  /api/spark/status     - Status do serviço Spark
POST /api/spark/auth       - Autenticação Spark
GET  /api/spark/config     - Configuração Spark
```

### KV Store API
```
GET    /api/kv             - Lista chaves
GET    /api/kv/:key        - Busca valor por chave
POST   /api/kv/:key        - Armazena valor
DELETE /api/kv/:key        - Remove chave
```

### LLM API
```
POST /api/llm/chat         - Chat com modelo de linguagem
POST /api/llm/embeddings   - Gera embeddings
GET  /api/llm/models       - Lista modelos disponíveis
```

## 🔒 Segurança

- **CORS**: Configurado para aceitar apenas origens autorizadas
- **Proteção de Chaves**: Chaves Spark nunca expostas em logs
- **Validação**: Todos os inputs são validados
- **Rate Limiting**: Implementado para prevenir abuso

## 🛠️ Tecnologias

- **Node.js** 22+
- **Express.js** - Framework web
- **TypeScript** - Tipagem forte
- **CORS** - Controle de origem cruzada
- **Dotenv** - Variáveis de ambiente

## 📝 Variáveis de Ambiente

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🧪 Testes

```bash
# Health check
curl http://localhost:3001/health

# Spark status
curl http://localhost:3001/api/spark/status

# KV operations
curl http://localhost:3001/api/kv/test_key
```

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── server.ts          # Servidor principal
│   └── routes/
│       ├── spark.ts       # Rotas Spark
│       ├── kv.ts          # Rotas KV Store
│       └── llm.ts         # Rotas LLM
├── dist/                  # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT - veja o arquivo LICENSE para detalhes.