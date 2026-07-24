// BROM AI WebSocket Proxy — AI Gateway
// Поддерживает: OpenRouter (chain of free models + key rotation) и Ollama (локально)
// Fallback chain: пробует модели по очереди, для каждой — разные API ключи

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// --- Конфигурация ---
const PORT = parseInt(process.env.PORT || '3004', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const SITE_URL = process.env.SITE_URL || 'https://brombet.ru';

// AI Provider: 'openrouter' (default) | 'ollama'
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();

// --- Ollama (опционально, для локальных тестов) ---
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi4-mini';

// --- OpenRouter: несколько ключей через запятую ---
const OPENROUTER_API = 'https://openrouter.ai/api/v1';

// Парсим ключи: OPENROUTER_API_KEY может быть одним ключом или списком через запятую
// Формат: sk-or-v1-xxx или sk-or-v1-xxx,sk-or-v1-yyy,sk-or-v1-zzz
const OPENROUTER_KEYS = (process.env.OPENROUTER_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.startsWith('sk-or-'));

// Счётчик для round-robin по ключам
let keyIndex = 0;

function getNextKey() {
  if (OPENROUTER_KEYS.length === 0) return null;
  const idx = keyIndex % OPENROUTER_KEYS.length;
  keyIndex = (keyIndex + 1) % OPENROUTER_KEYS.length;
  return { index: idx, key: OPENROUTER_KEYS[idx] };
}

// Fallback chain: через запятую — пробуем по очереди
const DEFAULT_OPENROUTER_MODELS =
  'deepseek/deepseek-v4-flash,' +
  'google/gemma-4-31b-it:free';

const OPENROUTER_MODELS = (process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODELS)
  .split(',')
  .map(m => m.trim())
  .filter(Boolean);

if (AI_PROVIDER === 'openrouter' && OPENROUTER_KEYS.length === 0) {
  console.error('FATAL: OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter');
  console.error('Format: single key or comma-separated: sk-or-v1-xxx,sk-or-v1-yyy,...');
  process.exit(1);
}

console.log(`[Config] OpenRouter keys loaded: ${OPENROUTER_KEYS.length}`);
console.log(`[Config] OpenRouter models: ${OPENROUTER_MODELS.join(', ')}`);

// --- Хранилище сессий ---
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
const SYSTEM_PROMPT = `Ты — BROM AI, дружелюбный ИИ-ассистент сайта brombet.ru (онлайн казино).
Отвечай на русском языке. Помогай с вопросами об играх, ставках, бонусах, стратегиях.
Будь полезным, весёлым и энергичным. Используй эмодзи.
Отвечай КРАТКО — 2-4 предложения, если пользователь не просит подробностей.
Не давай финансовых советов и не гарантируй выигрыш.

ТЫ УМЕЕШЬ:
- Объяснять правила игр (кости, рулетка, слоты, покер, блэкджек, краш-игры)
- Давать советы по стратегии ставок (Мартингейл, Анти-Мартингейл, фиксированная ставка)
- Анализировать ситуации и подсказывать, как изменить стратегию
- Поддерживать беседу на тему азартных игр
- Если пользователь в ступоре — подсказывать куда нажать на сайте (кнопки, меню, разделы)
- Предлагать сценарии: "Играю на слотах", "Хочу попробовать рулетку", "Стратегия для костей"

ВАЖНО: В конце каждого ответа ты ОБЯЗАН добавить блок с КОНТЕКСТНЫМИ кнопками выбора (2-4 штуки).
Для этого добавь в конец ответа блок:
[SUGGESTIONS]
[{"label":"🎲 Название кнопки","action":"Текст сообщения который отправится при нажатии"},{"label":"💡 Ещё вариант","action":"Текст для второго варианта"}]
[/SUGGESTIONS]

Кнопки должны быть:
- Короткие (до 40 символов label, до 80 символов action)
- РАЗНЫЕ каждый раз — не повторяй одни и те же кнопки
- Релевантны КОНКРЕТНОМУ контексту разговора
- Если пользователь в ступоре — подсказывать что делать дальше (куда нажать, что попробовать)
- Если пользователь играет в конкретную игру — давать кнопки со стратегией/советом для ЭТОЙ игры
- Разнообразные: чередуй темы (правила → стратегия → бонусы → похожие игры)
- Если пользователь только зашёл — предложи начать с популярных игр

ПРИМЕРЫ контекстных кнопок:
- Спросил про кости → [{"label":"🎲 Стратегия Мартингейл","action":"Расскажи про стратегию Мартингейл для костей"},{"label":"💡 Рискованные ставки","action":"Какие рискованные стратегии для костей?"}]
- Спросил про бонусы → [{"label":"💰 Приветственный бонус","action":"Что даёт приветственный бонус?"},{"label":"🏆 VIP кэшбэк","action":"Как работает кэшбэк для VIP?"}]
- Спросил про слоты → [{"label":"🎰 Pragmatic Play","action":"Какие слоты Pragmatic Play есть?"},{"label":"🎰 Популярные","action":"Покажи самые популярные слоты"}]

ТЫ МОЖЕШЬ УПРАВЛЯТЬ ПРИЛОЖЕНИЕМ!

Если пользователь просит что-то сделать на сайте, ты ОБЯЗАН вернуть команду действия.
Формат команды (строго в конце ответа, после текста):

[ACTION]
{"type": "navigate", "payload": {"path": "/games/slots"}}
[/ACTION]

Доступные команды:
- navigate: перейти в раздел сайта
  payload: { path: "/games/slots" } или "/games/roulette", "/games/poker", "/games/blackjack", "/games/crash", "/games/dice", "/profile", "/wallet", "/bonuses", "/games"
- suggest_bet: предложить ставку
  payload: { amount: 100, game: "slots", message: "Рекомендую поставить 100₽" }
- simulate_spin: симулировать вращение слота
  payload: { bet: 100 }
- open_game: открыть конкретную игру
  payload: { gameId: "slots", name: "Sweet Bonanza" }
- highlight: подсветить элемент на странице
  payload: { element: "deposit-button", text: "Нажми сюда чтобы пополнить" }

⚠️ ТЫ ОБЯЗАН ВЕРНУТЬ [ACTION] В ЭТИХ СЛУЧАЯХ:
- Пользователь сказал "открой", "покажи", "перейди", "навигация" → верни navigate
- Пользователь сказал "крути", "запусти", "спин" → верни simulate_spin
- Пользователь сказал "поставь", "ставка", "bet" → верни suggest_bet
- Пользователь попросил открыть конкретную игру → верни open_game
- Пользователь спросил "как начать играть", "куда нажать" → верни navigate в /games

ПРИМЕР правильного ответа:
Текст: "Открываю раздел слотов! 🎰"
[ACTION]
{"type": "navigate", "payload": {"path": "/games/slots"}}
[/ACTION]

ПРИМЕР 2:
Текст: "Кручу слоты со ставкой 100₽! 🎰"
[ACTION]
{"type": "simulate_spin", "payload": {"bet": 100}}
[/ACTION]

ПРИМЕР 3:
Текст: "Рекомендую поставить 100₽ на слоты с осторожностью."
[ACTION]
{"type": "suggest_bet", "payload": {"amount": 100, "game": "slots", "message": "Попробуй поставить 100₽ на слоты"}}
[/ACTION]
`;

// --- AI Providers ---

// Ollama (локально)
async function ollamaChat(messages, onDelta) {
  const body = {
    model: OLLAMA_MODEL,
    messages,
    stream: true,
    options: {
      temperature: 0.7,
      num_predict: 1024,
    },
  };

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error ${response.status}: ${errText}`);
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
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        const content = event.message?.content || '';
        if (content) {
          fullContent += content;
          if (onDelta) onDelta(content);
        }
        if (event.done) break;
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  return fullContent;
}

// OpenRouter (streaming, model + конкретный ключ)
async function openRouterChatOne(messages, model, apiKey, onDelta) {
  const body = {
    model,
    messages,
    stream: true,
    max_tokens: 2048,
  };

  const response = await fetch(`${OPENROUTER_API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': 'BROM AI Casino Assistant',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status} (${model}): ${errText}`);
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

// OpenRouter с double fallback: модели × ключи
// Для каждого запроса берём следующий ключ (round-robin),
// потом пробуем все модели. Если всё упало с 401 — берём следующий ключ.
async function openRouterChat(messages, onDelta) {
  const errors = [];

  // Пробуем ключи по очереди (round-robin, стартуем с текущего)
  for (let ki = 0; ki < OPENROUTER_KEYS.length; ki++) {
    const { index: keyIdx, key: apiKey } = getNextKey();

    // Для этого ключа пробуем все модели
    for (let mi = 0; mi < OPENROUTER_MODELS.length; mi++) {
      const model = OPENROUTER_MODELS[mi];
      try {
        console.log(`[OpenRouter] key#${keyIdx} model=${model}`);
        const result = await openRouterChatOne(messages, model, apiKey, onDelta);
        console.log(`[OpenRouter] ✅ key#${keyIdx} model=${model}`);
        return result;
      } catch (err) {
        console.warn(`[OpenRouter] ❌ key#${keyIdx} model=${model}: ${err.message}`);
        errors.push({ keyIndex: keyIdx, model, error: err.message });

        // Если последняя модель на последнем ключе — всё, ошибка
        if (ki === OPENROUTER_KEYS.length - 1 && mi === OPENROUTER_MODELS.length - 1) {
          throw new Error(
            `All OpenRouter keys+models failed. Tried: ${errors.map(e => `key#${e.keyIndex}/${e.model} (${e.error})`).join('; ')}`
          );
        }
      }
    }

    // Все модели на этом ключе упали — пробуем следующий ключ
    console.log(`[OpenRouter] key#${keyIdx} exhausted all models, trying next key...`);
  }

  throw new Error('No OpenRouter keys configured');
}

// AI Gateway
async function aiChat(messages, onDelta) {
  if (AI_PROVIDER === 'ollama') {
    console.log(`[AI] Using Ollama model=${OLLAMA_MODEL}`);
    return await ollamaChat(messages, onDelta);
  } else if (AI_PROVIDER === 'openrouter') {
    console.log(`[AI] OpenRouter: ${OPENROUTER_KEYS.length} keys × ${OPENROUTER_MODELS.length} models`);
    return await openRouterChat(messages, onDelta);
  } else {
    throw new Error(`Unknown AI_PROVIDER: ${AI_PROVIDER}. Use 'openrouter' or 'ollama'.`);
  }
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
fastify.get('/health', async () => ({
  status: 'ok',
  proxy: 'brom-ai-proxy',
  provider: AI_PROVIDER,
  keysCount: OPENROUTER_KEYS.length,
  models: AI_PROVIDER === 'openrouter' ? OPENROUTER_MODELS : [OLLAMA_MODEL],
}));

// REST fallback
fastify.post('/api/chat', async (req, reply) => {
  const { message, userId } = req.body;
  if (!message) return reply.status(400).send({ error: 'message required' });

  const sessionId = `web-${userId || 'anon'}`;
  const session = await loadSession(sessionId);

  session.messages.push({ role: 'user', content: message });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...session.messages.slice(-20),
  ];

  let text = await aiChat(messages);
  session.messages.push({ role: 'assistant', content: text });
  await saveSession(session);

  // Парсим suggestions из ответа AI
  let suggestions = [];
  const sugMatch = text.match(/\[SUGGESTIONS\]\s*(\[.*?\])\s*\[\/SUGGESTIONS\]/s);
  if (sugMatch) {
    try {
      suggestions = JSON.parse(sugMatch[1]);
      // Удаляем блок SUGGESTIONS из текста для клиента
      text = text.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/s, '').trim();
    } catch {}
  }

  // Парсим action из ответа AI
  let action = null;
  const actMatch = text.match(/\[ACTION\]\s*(\{.*?\})\s*\[\/ACTION\]/s);
  if (actMatch) {
    try {
      action = JSON.parse(actMatch[1]);
      // Удаляем блок ACTION из текста для клиента
      text = text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/s, '').trim();
    } catch {}
  }

  return { text, sessionId: session.id, suggestions, action };
});

// WebSocket
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const userId = req.query?.userId || req.headers['x-user-id'] || 'anon';
    const userName = req.query?.userName || 'User';
    let sessionId = `web-${userId}`;

    fastify.log.info(`WS connected: user=${userId}, session=${sessionId}`);
    fastify.log.info(`AI provider: ${AI_PROVIDER}`);

    socket.send(JSON.stringify({ type: 'connected', userId, sessionId }));

    socket.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        fastify.log.info({ msgType: data.type, userId: data.userId, text: (data.text || '').substring(0, 50) }, 'WS message received');

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

          await aiChat(messages, (delta) => {
            fullText += delta;
            socket.send(JSON.stringify({ type: 'chunk', text: delta }));
          });

          session.messages.push({ role: 'assistant', content: fullText });
          await saveSession(session);

          socket.send(JSON.stringify({ type: 'done' }));
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
  fastify.log.info(`AI Provider: ${AI_PROVIDER}`);
  if (AI_PROVIDER === 'ollama') {
    fastify.log.info(`Ollama: ${OLLAMA_BASE_URL} model=${OLLAMA_MODEL}`);
  } else {
    fastify.log.info(`OpenRouter: ${OPENROUTER_KEYS.length} keys, fallback chain: ${OPENROUTER_MODELS.join(' → ')}`);
  }
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
