FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/data/sessions

COPY package.json package-lock.json ./
RUN npm ci --production

COPY server.js .

EXPOSE 3004

ENV DATA_DIR=/app/data
ENV AI_PROVIDER=openrouter
ENV OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free,google/gemma-4-31b-it:free,deepseek/deepseek-v4-flash

# Ollama (опционально, для локальной отладки)
ENV OLLAMA_BASE_URL=http://172.17.0.1:11434
ENV OLLAMA_MODEL=phi4-mini

CMD ["node", "server.js"]
