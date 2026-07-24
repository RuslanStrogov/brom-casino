// BROM AI WebSocket Proxy — connects website clients directly to OpenRouter API
// Использует native WebSocket для связи с клиентом и Server-Sent Events для стриминга от OpenRouter
// История сессий хранится в JSON-файлах на диске

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const OPENROUTER_API = 'https://openrouter.ai/api/v1';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL || 'https://brombet.ru';
const PORT = parseInt(process.env.PORT || '3004', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || '/app/data';

if (!OPENROUTER_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY is required');
  process.exit(1);
}

// --- Хранилище сессий (JSON-файлы) ---
const SESSIONS_DIR = join(DATA_DIR, 'sessions');

async function ensureDirs() {
  await mkdir(SESSIONS_DIR, { recursive: true });
}

function sessionPath(sessionId) {
  return join(SESSIONS_DIR, `${sessionId}.json`);
}

async function loadSession(sessionId) {
  const path = sessionPath(sessionId);
  try {
    const data = await readFile(path, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { id: sessionId, messages: [], created: Date.now() };
  }
}

async function saveSession(session) {
  const path = sessionPath(session.id);
  await writeFile(path, JSON.stringify(session, null, 2));
}

// --- Системный промпт ---
const SYSTEM_PROMPT = `Ты — BROM AI, дружелюбный ИИ-ассистент сайта brombet.ru (онлайн казино).\nОтвечай на русском языке. Помогай с вопросами об играх, ставках, бонусах, стратегиях.\nБудь полезным, весёлым и энергичным. Используй эмодзи.\nОтвечай КРАТКО — 2-4 предложения, если пользователь не просит подробностей.\nНе давай финансовых советов и не гарантируй выигрыш.`;

// --- OpenRouter API ---
const MODEL = 'google/gemini-2.5-flash-lite';

async function openRouterChat(messages, onDelta) {
  const body = {
    model: MODEL,
    messages,
    stream: true,
    max_tokens: 1024,
  };

  const response = await fetch(`${OPENROUTER_API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': 'BROM AI Casino Assistant',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const event = JSON.parse(jsonStr);
          const content = event.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            if (onDelta) onDelta(content);
          }
        } catch {
          // skip malformed SSE
        }
      }
    }
  }

  return fullContent;
}

// --- Fastify ---
const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: ['https://brombet.ru', 'http://localhost:3003', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
});

await fastify.register(websocket, {
  options: { maxPayload: 1024 * 1024 },
});

// Health
fastify.get('/health', async () => ({ status: 'ok', proxy: 'brom-ai-proxy' }));

// REST fallback
fastify.post('/api/chat', async (req, reply) => {
  const { message, userId } = req.body;
  if (!message) return reply.status(400).send({ error: 'message required' });

  const sessionId = `web-${userId || 'anon'}`;
  const session = await loadSession(sessionId);

  session.messages.push({ role: 'user', content: message });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...session.messages.slice(-20), // last 20 for context window
  ];

  const text = await openRouterChat(messages);
  session.messages.push({ role: 'assistant', content: text });
  await saveSession(session);

  return { text, sessionId: session.id };
});

// WebSocket
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const userId = req.query?.userId || req.headers['x-user-id'] || 'anon';
    const userName = req.query?.userName || 'User';
    let sessionId = `web-${userId}`;

    fastify.log.info(`WS connected: user=${userId}, session=${sessionId}`);

    socket.send(JSON.stringify({ type: 'connected', userId, sessionId }));

    socket.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (data.type === 'setUser') {
          sessionId = `web-${data.userId || userId}`;
          socket.send(JSON.stringify({ type: 'connected', userId: data.userId || userId, sessionId }));
          return;
        }

        if (data.type === 'message' && data.text) {
          const session = await loadSession(sessionId);
          session.messages.push({ role: 'user', content: data.text });

          const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...session.messages.slice(-20),
          ];

          let fullText = '';
          await openRouterChat(messages, (delta) => {
            fullText += delta;
            socket.send(JSON.stringify({ type: 'chunk', text: delta }));
          });

          session.messages.push({ role: 'assistant', content: fullText });
          await saveSession(session);

          socket.send(JSON.stringify({ type: 'done' }));
        }

        // --- ИГРОВЫЕ СОБЫТИЯ ---
        if (data.type === 'GAME_START') {
          const { provider, amount } = data;
          fastify.log.info(`Game start: provider=${provider}, amount=${amount}, user=${userId}`);

          // Имитация игрового результата (заглушка — заменяется реальной логикой)
          const winChance = Math.random();
          const winAmount = winChance > 0.7 ? Math.floor(amount * 2) : 0;

          socket.send(JSON.stringify({
            type: 'GAME_RESULT',
            provider,
            amount,
            winAmount,
            seed: randomUUID(),
            timestamp: Date.now()
          }));
          return;
        }

        if (data.type === 'GAME_JOIN') {
          fastify.log.info(`Game join: room=${data.roomId}, user=${userId}`);
          socket.send(JSON.stringify({ type: 'GAME_JOINED', roomId: data.roomId }));
          return;
        }

        // --- ПРОВАЙДЕРЫ (заглушка) ---
        if (data.type === 'GET_PROVIDERS') {
          const providers = ['cryptomus', 'nowpayments', 'corefy'];
          socket.send(JSON.stringify({ type: 'PROVIDERS_LIST', providers }));
          return;
        }

      } catch (err) {
        fastify.log.error(err, 'WS error');
        try {
          socket.send(JSON.stringify({ type: 'error', text: 'Ошибка. Попробуйте ещё раз.' }));
        } catch {}
      }
    });

    socket.on('close', () => {
      fastify.log.info(`WS disconnected: user=${userId}`);
    });
  });
});

// --- Start ---
try {
  await ensureDirs();
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(`BROM AI Proxy listening on ${HOST}:${PORT}`);
  fastify.log.info(`OpenRouter model: ${MODEL}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}