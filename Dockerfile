# 1. Imagem base: Linux leve (alpine) já com Node 22 instalado
FROM node:22-alpine

# 2. Pasta de trabalho dentro do container (tipo um "cd /app")
WORKDIR /app

# 3. Copia SÓ os arquivos de dependência primeiro
COPY package*.json ./

# 4. Instala as dependências (express e cors)
RUN npm ci --omit=dev

# 5. Copia o código da API
COPY src ./src

# 6. Documenta que a app usa a porta 3000
EXPOSE 3000

# 7. Comando que roda quando o container sobe
CMD ["node", "src/server.js"]