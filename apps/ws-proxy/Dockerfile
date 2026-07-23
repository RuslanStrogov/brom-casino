FROM node:20-alpine

WORKDIR /app

RUN mkdir -p /app/data/sessions

COPY package.json package-lock.json ./
RUN npm ci --production

COPY server.js .

EXPOSE 3004

ENV DATA_DIR=/app/data
ENV OPENROUTER_API_KEY=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

CMD ["node", "server.js"]