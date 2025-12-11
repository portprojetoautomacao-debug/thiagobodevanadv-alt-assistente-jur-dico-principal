FROM node:25-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage de produção
FROM nginx:alpine
# Instala Python 3 no estágio final para suportar comandos que exigem python3 (ex.: bridges/scripts em ambientes que o requerem)
RUN apk update && apk add --no-cache python3 py3-pip && ln -sf /usr/bin/python3 /usr/bin/python

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
