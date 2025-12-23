# 🔓 Soluções para Bloqueio de IPs Azure pela API DJEN

## 🚨 Problema Identificado

A API DJEN (Comunica PJe) bloqueia requisições vindas de **IPs de datacenters** (Azure, AWS, GCP) via CloudFront com a mensagem:

```
"The Amazon CloudFront distribution is configured to block access from your country"
```

**Causa raiz:**
- A API usa CloudFront da AWS com geo-blocking
- IPs de datacenters são automaticamente detectados e bloqueados
- Mesmo com headers corretos (`Accept`, `User-Agent`), o bloqueio persiste
- O bloqueio é por **origem do IP**, não por país

---

## 📋 Índice de Soluções

1. [Proxy Residencial (Recomendado)](#1-proxy-residencial-recomendado)
2. [Azure Functions + Outbound IP Fixo](#2-azure-functions--outbound-ip-fixo)
3. [Serverless em Provedor Brasileiro](#3-serverless-em-provedor-brasileiro)
4. [NAT Gateway com IP Dedicado](#4-nat-gateway-com-ip-dedicado)
5. [Serviços de Proxy Externos](#5-serviços-de-proxy-externos)
6. [VPN/Tunnel para Servidor Brasil](#6-vpntunnel-para-servidor-brasil)
7. [Comparação de Custos](#7-comparação-de-custos)

---

## 1. Proxy Residencial (Recomendado) ⭐

### ✅ Vantagens
- **Não é bloqueado** - IPs residenciais brasileiros
- **Rápido de implementar** - Código pronto
- **Custo-benefício** - A partir de R$30/mês
- **Escalável** - Pool rotativo de IPs

### 📦 Serviços Recomendados

#### A. Bright Data (ex-Luminati)
- **Preço**: ~US$8/GB (~R$40/mês para 5GB)
- **IPs**: Residenciais brasileiros rotativos
- **Uptime**: 99.9%
- **Site**: https://brightdata.com/

#### B. Smartproxy
- **Preço**: US$12.5/GB (~R$60/mês para 5GB)
- **IPs**: 40M+ residenciais BR
- **Trial**: 3 dias grátis
- **Site**: https://smartproxy.com/

#### C. ProxyMesh (Mais Barato)
- **Preço**: US$10/mês (10GB)
- **IPs**: Rotativos globais
- **Uptime**: 99%
- **Site**: https://proxymesh.com/

### 💻 Implementação (Node.js/TypeScript)

```typescript
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Configuração do proxy (exemplo: Bright Data)
const PROXY_CONFIG = {
  host: 'brd.superproxy.io',
  port: 22225,
  username: 'seu-usuario',
  password: 'sua-senha',
  country: 'br' // Forçar IPs brasileiros
};

// Criar proxy agent
const proxyUrl = `http://${PROXY_CONFIG.username}:${PROXY_CONFIG.password}@${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;
const proxyAgent = new HttpsProxyAgent(proxyUrl);

// Função para consultar DJEN via proxy
async function consultarDJENViaProxy(params: {
  numeroOab: string;
  ufOab: string;
  dataInicio: string;
  dataFim: string;
}) {
  const queryParams = new URLSearchParams({
    numeroOab: params.numeroOab,
    ufOab: params.ufOab,
    dataDisponibilizacaoInicio: params.dataInicio,
    dataDisponibilizacaoFim: params.dataFim,
    pagina: '1',
    itensPorPagina: '100'
  });

  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PJe-DataCollector/1.0'
    },
    agent: proxyAgent // ← Usar proxy
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Exemplo de uso
const resultado = await consultarDJENViaProxy({
  numeroOab: '184404',
  ufOab: 'MG',
  dataInicio: '2025-01-16',
  dataFim: '2025-01-16'
});

console.log(`✅ Encontradas ${resultado.count} publicações`);
```

### 🐍 Implementação (Python)

```python
import requests

# Configuração do proxy
PROXY_CONFIG = {
    'http': 'http://seu-usuario:sua-senha@brd.superproxy.io:22225',
    'https': 'http://seu-usuario:sua-senha@brd.superproxy.io:22225'
}

def consultar_djen_via_proxy(numero_oab, uf_oab, data_inicio, data_fim):
    url = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao'

    params = {
        'numeroOab': numero_oab,
        'ufOab': uf_oab,
        'dataDisponibilizacaoInicio': data_inicio,
        'dataDisponibilizacaoFim': data_fim,
        'pagina': 1,
        'itensPorPagina': 100
    }

    headers = {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
    }

    response = requests.get(
        url,
        params=params,
        headers=headers,
        proxies=PROXY_CONFIG,  # ← Usar proxy
        timeout=30
    )

    response.raise_for_status()
    return response.json()

# Exemplo de uso
resultado = consultar_djen_via_proxy('184404', 'MG', '2025-01-16', '2025-01-16')
print(f"✅ Encontradas {resultado['count']} publicações")
```

---

## 2. Azure Functions + Outbound IP Fixo

### ✅ Vantagens
- **Nativo Azure** - Sem depender de terceiros
- **IP fixo** - Pode ser whitelistado se necessário
- **Escalável** - Serverless nativo

### 💰 Custo
- **Azure NAT Gateway**: ~US$0.045/hora (~US$32/mês)
- **Azure Functions**: ~US$0.20/milhão execuções

### 🔧 Arquitetura

```
Azure Function (Consumption Plan)
    ↓
Virtual Network (VNet)
    ↓
NAT Gateway (IP Fixo Público)
    ↓
Internet → API DJEN
```

### 📝 Passo a Passo

#### 1. Criar Virtual Network
```bash
az network vnet create \
  --resource-group meu-rg \
  --name djen-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name functions-subnet \
  --subnet-prefix 10.0.1.0/24
```

#### 2. Criar Public IP para NAT Gateway
```bash
az network public-ip create \
  --resource-group meu-rg \
  --name djen-nat-ip \
  --sku Standard \
  --allocation-method Static
```

#### 3. Criar NAT Gateway
```bash
az network nat gateway create \
  --resource-group meu-rg \
  --name djen-nat-gateway \
  --public-ip-addresses djen-nat-ip \
  --idle-timeout 10
```

#### 4. Associar NAT Gateway à Subnet
```bash
az network vnet subnet update \
  --resource-group meu-rg \
  --vnet-name djen-vnet \
  --name functions-subnet \
  --nat-gateway djen-nat-gateway
```

#### 5. Criar Function App com VNet Integration
```bash
az functionapp create \
  --resource-group meu-rg \
  --name djen-functions \
  --storage-account djenstorage \
  --consumption-plan-location brazilsouth \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4

# Integrar com VNet
az functionapp vnet-integration add \
  --resource-group meu-rg \
  --name djen-functions \
  --vnet djen-vnet \
  --subnet functions-subnet
```

#### 6. Código da Function (TypeScript)

```typescript
// function/index.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import fetch from 'node-fetch';

export async function consultarDJEN(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const { numeroOab, ufOab, dataInicio, dataFim } = await request.json();

    const queryParams = new URLSearchParams({
      numeroOab,
      ufOab,
      dataDisponibilizacaoInicio: dataInicio,
      dataDisponibilizacaoFim: dataFim,
      pagina: '1',
      itensPorPagina: '100'
    });

    const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

    // A requisição sairá pelo NAT Gateway com IP fixo
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      }
    });

    if (!response.ok) {
      return {
        status: response.status,
        body: JSON.stringify({ error: `HTTP ${response.status}` })
      };
    }

    const data = await response.json();

    return {
      status: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    context.error('Erro ao consultar DJEN:', error);
    return {
      status: 500,
      body: JSON.stringify({ error: 'Erro interno' })
    };
  }
}

app.http('consultarDJEN', {
  methods: ['POST'],
  authLevel: 'function',
  handler: consultarDJEN
});
```

---

## 3. Serverless em Provedor Brasileiro

### ✅ Vantagens
- **IPs brasileiros nativos** - Não são bloqueados
- **Zero config** - Deploy direto
- **Custo baixo** - Free tier generoso

### 🚀 Opções Recomendadas

#### A. Vercel (Brasil South)

**Custo**: Gratuito até 100GB bandwidth

```typescript
// api/djen-proxy.ts (Vercel Edge Function)
export const config = {
  runtime: 'edge'
};

export default async function handler(req: Request) {
  const { numeroOab, ufOab, dataInicio, dataFim } = await req.json();

  const queryParams = new URLSearchParams({
    numeroOab,
    ufOab,
    dataDisponibilizacaoInicio: dataInicio,
    dataDisponibilizacaoFim: dataFim,
    pagina: '1',
    itensPorPagina: '100'
  });

  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PJe-DataCollector/1.0'
    }
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

**Deploy:**
```bash
npm i -g vercel
vercel --prod
```

#### B. Railway (Brasil East)

**Custo**: US$5/mês (500h execution)

```typescript
// server.ts
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/djen', async (req, res) => {
  try {
    const { numeroOab, ufOab, dataInicio, dataFim } = req.body;

    const queryParams = new URLSearchParams({
      numeroOab,
      ufOab,
      dataDisponibilizacaoInicio: dataInicio,
      dataDisponibilizacaoFim: dataFim,
      pagina: '1',
      itensPorPagina: '100'
    });

    const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      }
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
```

**Deploy:**
```bash
# Conectar repositório GitHub ao Railway
# Deploy automático em cada push
```

#### C. Render (Brasil South)

**Custo**: Gratuito (750h/mês)

Similar ao Railway, com deploy via Dockerfile ou Node.js nativo.

---

## 4. NAT Gateway com IP Dedicado

### ✅ Quando Usar
- Precisa de **IP fixo** para whitelist
- Quer manter Azure Functions
- Orçamento permite (~US$32/mês)

### 📝 Configuração Completa

Já explicada na **Solução 2** acima. Resumo:

1. Criar VNet
2. Criar Public IP
3. Criar NAT Gateway
4. Associar à Subnet do Function App
5. Habilitar VNet Integration no Function App

**Resultado**: Todas as requisições saem pelo mesmo IP público fixo.

---

## 5. Serviços de Proxy Externos

### 📦 Opções Comerciais

#### A. Apify (Scraping as a Service)
- **Preço**: US$49/mês (100GB)
- **IPs**: Rotativos residenciais
- **Inclui**: Captcha solving, JS rendering
- **Site**: https://apify.com/

#### B. ScraperAPI
- **Preço**: US$29/mês (100k requests)
- **IPs**: Rotativos automáticos
- **Inclui**: Retry automático
- **Site**: https://scraperapi.com/

#### C. ProxyCrawl
- **Preço**: US$29/mês (50k requests)
- **IPs**: Residenciais BR
- **Site**: https://proxycrawl.com/

### 💻 Exemplo com ScraperAPI

```typescript
import fetch from 'node-fetch';

const SCRAPER_API_KEY = 'sua-api-key';

async function consultarDJENViaScraper(params: {
  numeroOab: string;
  ufOab: string;
  dataInicio: string;
}) {
  // URL original
  const targetUrl = new URLSearchParams({
    numeroOab: params.numeroOab,
    ufOab: params.ufOab,
    dataDisponibilizacaoInicio: params.dataInicio,
    pagina: '1',
    itensPorPagina: '100'
  });

  const djenUrl = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${targetUrl}`;

  // URL do proxy
  const proxyUrl = new URL('http://api.scraperapi.com/');
  proxyUrl.searchParams.append('api_key', SCRAPER_API_KEY);
  proxyUrl.searchParams.append('url', djenUrl);
  proxyUrl.searchParams.append('country_code', 'br'); // Forçar Brasil

  const response = await fetch(proxyUrl.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PJe-DataCollector/1.0'
    }
  });

  return await response.json();
}
```

---

## 6. VPN/Tunnel para Servidor Brasil

### ✅ Quando Usar
- Tem servidor próprio no Brasil
- Quer controle total
- Orçamento permite hosting

### 🏗️ Arquitetura

```
Azure App
    ↓ (HTTPS)
Servidor Brasil (VPS)
    ↓ (API DJEN)
Internet
```

### 📦 Provedor VPS Brasil

#### A. DigitalOcean (São Paulo)
- **Custo**: US$6/mês (1GB RAM)
- **IP**: Brasileiro fixo
- **Setup**: 5 minutos

#### B. Vultr (São Paulo)
- **Custo**: US$6/mês (1GB RAM)
- **IP**: Brasileiro fixo

#### C. Linode (São Paulo)
- **Custo**: US$5/mês (1GB RAM)
- **IP**: Brasileiro fixo

### 💻 Setup do Proxy Server (Node.js)

```javascript
// proxy-server.js
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// Middleware de autenticação (API Key)
const AUTH_KEY = process.env.API_KEY || 'sua-chave-secreta';

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== AUTH_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Endpoint de proxy
app.post('/api/djen/proxy', async (req, res) => {
  try {
    const { numeroOab, ufOab, dataInicio, dataFim } = req.body;

    const queryParams = new URLSearchParams({
      numeroOab,
      ufOab,
      dataDisponibilizacaoInicio: dataInicio,
      dataDisponibilizacaoFim: dataFim,
      pagina: '1',
      itensPorPagina: '100'
    });

    const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

    console.log(`[${new Date().toISOString()}] Consultando DJEN:`, url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[${new Date().toISOString()}] Sucesso: ${data.count} itens`);

    res.json(data);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy DJEN rodando na porta ${PORT}`);
});
```

**Deploy no VPS:**
```bash
# SSH no servidor
ssh root@seu-servidor.com.br

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar código
git clone <seu-repo>
cd proxy-djen
npm install

# Instalar PM2 para manter rodando
npm install -g pm2
pm2 start proxy-server.js --name djen-proxy
pm2 startup
pm2 save

# Configurar Nginx (opcional, para HTTPS)
sudo apt-get install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br
```

**Cliente (Azure):**
```typescript
async function consultarDJENViaProxyServer(params: {
  numeroOab: string;
  ufOab: string;
  dataInicio: string;
  dataFim: string;
}) {
  const PROXY_URL = 'https://seu-servidor.com.br/api/djen/proxy';
  const API_KEY = process.env.PROXY_API_KEY;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify(params)
  });

  return await response.json();
}
```

---

## 7. Comparação de Custos

| Solução | Custo/Mês | Setup | Escalável | Confiabilidade | Recomendado |
|---------|-----------|-------|-----------|----------------|-------------|
| **Proxy Residencial** (ProxyMesh) | US$10 | ⭐⭐⭐⭐⭐ Fácil | ✅ Sim | ⭐⭐⭐⭐⭐ Alta | ✅ **SIM** |
| **Vercel Edge Function** | US$0 | ⭐⭐⭐⭐⭐ Fácil | ✅ Sim | ⭐⭐⭐⭐ Alta | ✅ **SIM** |
| **Railway** | US$5 | ⭐⭐⭐⭐ Fácil | ✅ Sim | ⭐⭐⭐⭐ Alta | ✅ SIM |
| **VPS Brasil** (DigitalOcean) | US$6 | ⭐⭐⭐ Médio | ⚠️ Limitado | ⭐⭐⭐ Média | ⚠️ Se já tem |
| **Azure NAT Gateway** | US$32 | ⭐⭐ Difícil | ✅ Sim | ⭐⭐⭐⭐⭐ Alta | ⚠️ Caro |
| **ScraperAPI** | US$29 | ⭐⭐⭐⭐ Fácil | ✅ Sim | ⭐⭐⭐⭐ Alta | ⚠️ Médio |
| **Bright Data** | US$40 | ⭐⭐⭐⭐ Fácil | ✅ Sim | ⭐⭐⭐⭐⭐ Alta | ⚠️ Caro |

---

## 🎯 Recomendação Final

### Para Produção (Melhor Custo-Benefício)

**1ª opção: Vercel Edge Functions** (GRÁTIS)
- Deploy em segundos
- Free tier generoso (100GB)
- IPs brasileiros nativos
- Código TypeScript nativo

**2ª opção: ProxyMesh** (US$10/mês)
- Mais barato proxy residencial
- 10GB/mês (suficiente)
- IPs rotativos BR
- Código pronto

### Para Desenvolvimento/Testes

**1ª opção: Vercel** (grátis)
**2ª opção: Railway** (US$5/mês com trial)

### Para Enterprise (IP Fixo Necessário)

**Azure NAT Gateway** (US$32/mês)
- IP fixo para whitelist
- Nativo Azure
- Alta disponibilidade

---

## 📝 Código Completo - Solução Híbrida

Código que tenta múltiplas estratégias com fallback:

```typescript
// djen-client-resiliente.ts
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface DJENParams {
  numeroOab: string;
  ufOab: string;
  dataInicio: string;
  dataFim: string;
}

class DJENClient {
  private proxyUrl?: string;
  private vercelProxyUrl?: string;

  constructor(config: {
    proxyUrl?: string; // Proxy residencial
    vercelProxyUrl?: string; // Edge function Vercel
  }) {
    this.proxyUrl = config.proxyUrl;
    this.vercelProxyUrl = config.vercelProxyUrl;
  }

  // Método 1: Direto (pode falhar no Azure)
  private async consultarDireto(params: DJENParams) {
    const queryParams = new URLSearchParams({
      numeroOab: params.numeroOab,
      ufOab: params.ufOab,
      dataDisponibilizacaoInicio: params.dataInicio,
      dataDisponibilizacaoFim: params.dataFim,
      pagina: '1',
      itensPorPagina: '100'
    });

    const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Método 2: Via Proxy Residencial
  private async consultarViaProxy(params: DJENParams) {
    if (!this.proxyUrl) {
      throw new Error('Proxy URL não configurado');
    }

    const proxyAgent = new HttpsProxyAgent(this.proxyUrl);

    const queryParams = new URLSearchParams({
      numeroOab: params.numeroOab,
      ufOab: params.ufOab,
      dataDisponibilizacaoInicio: params.dataInicio,
      dataDisponibilizacaoFim: params.dataFim,
      pagina: '1',
      itensPorPagina: '100'
    });

    const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'
      },
      agent: proxyAgent
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Método 3: Via Vercel Edge Function
  private async consultarViaVercel(params: DJENParams) {
    if (!this.vercelProxyUrl) {
      throw new Error('Vercel Proxy URL não configurado');
    }

    const response = await fetch(this.vercelProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Método Principal: Tenta com fallback
  async consultar(params: DJENParams) {
    const strategies = [
      { name: 'Direto', fn: () => this.consultarDireto(params) },
      { name: 'Via Proxy', fn: () => this.consultarViaProxy(params) },
      { name: 'Via Vercel', fn: () => this.consultarViaVercel(params) }
    ];

    for (const strategy of strategies) {
      try {
        console.log(`Tentando estratégia: ${strategy.name}`);
        const result = await strategy.fn();
        console.log(`✅ Sucesso com ${strategy.name}`);
        return result;
      } catch (error) {
        console.log(`❌ ${strategy.name} falhou:`, error.message);
        // Continua para próxima estratégia
      }
    }

    throw new Error('Todas as estratégias falharam');
  }
}

// Uso:
const client = new DJENClient({
  proxyUrl: process.env.PROXY_URL, // Opcional
  vercelProxyUrl: process.env.VERCEL_PROXY_URL // Opcional
});

const resultado = await client.consultar({
  numeroOab: '184404',
  ufOab: 'MG',
  dataInicio: '2025-01-16',
  dataFim: '2025-01-16'
});

console.log(`📊 Encontradas ${resultado.count} publicações`);
```

---

## 🔧 Troubleshooting

### Erro: "CloudFront block" mesmo com proxy

**Causa**: Proxy não está sendo usado corretamente

**Solução**:
```typescript
// Verificar se proxy está ativo
console.log('Usando proxy:', proxyAgent ? 'SIM' : 'NÃO');
```

### Erro: Proxy timeout

**Causa**: Proxy lento ou offline

**Solução**:
- Aumentar timeout (60s)
- Trocar servidor proxy
- Usar pool rotativo

### Erro: "Too many requests" (429)

**Causa**: Rate limit do proxy

**Solução**:
- Adicionar delay entre requisições (1s)
- Usar cache local
- Escalonar horizontalmente

---

## 📚 Recursos Adicionais

### Documentação
- **Vercel Edge Functions**: https://vercel.com/docs/functions/edge-functions
- **Azure NAT Gateway**: https://learn.microsoft.com/azure/virtual-network/nat-gateway/
- **ProxyMesh**: https://proxymesh.com/documentation
- **Bright Data**: https://docs.brightdata.com/

### Código de Referência
- `src/lib/djen-api.ts` - Cliente base DJEN
- `api/lib/djen-client.ts` - Cliente com retry logic

---

**Documento criado em:** 23/12/2025
**Versão:** 1.0
**Última atualização:** Solução de bloqueio CloudFront Azure
