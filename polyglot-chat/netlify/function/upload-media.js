// POST /.netlify/functions/upload-media
// Body (JSON, base64): { userId, conversationId, clientMessageId?, kind: 'image'|'video',
//                        fileName, mimeType, dataBase64 }
// Validation: type from MIME (never filename), size cap, membership check, idempotency.
// Media is relayed to Telegram (file_id); nothing permanent is stored in Netlify.
const { ok, fail, readJson, getIp, genId, isValidUserId, isValidConversationId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');
const { sendMedia } = require('../../lib/telegram');

const MAX_BYTES = 20 * 1024 * 1024; // 20MB (also keep below Netlify's request limit)
const ALLOWED = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm'],
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('media:' + getIp(event), 10, 60 * 1000)) return fail('Too many requests', 429);

  const { userId, conversationId, clientMessageId, kind, fileName, mimeType, dataBase64 } = readJson(event);
  if (!isValidUserId(userId)) return fail('Invalid sender');
  if (!isValidConversationId(conversationId)) return fail('Invalid conversation');
  if (!ALLOWED[kind]) return fail('Unsupported media kind');
  if (!ALLOWED[kind].includes(mimeType)) return fail('Unsupported file type: ' + mimeType);

  let buf;
  try { buf = Buffer.from(dataBase64 || '', 'base64'); } catch (_) { buf = Buffer.alloc(0); }
  if (!buf.length) return fail('Empty file');
  if (buf.length > MAX_BYTES) return fail('File too large (max 20MB)');

  const conversation = await conv.get(conversationId);
  if (!conversation) return fail('Conversation not found', 404);
  if (!conv.isParticipant(conversation, userId)) return fail('Not a participant', 403);

  if (clientMessageId) {
    const existing = await store.find('message', (m) => m.clientMessageId === clientMessageId && m.senderId === userId);
    if (existing) return ok({ message: existing, duplicate: true });
  }

  let tgMsg;
  try {
    tgMsg = await sendMedia(kind, buf, (fileName || kind + '.bin').slice(0, 80), mimeType);
  } catch (e) {
    console.error('telegram media upload failed:', e.message);
    return fail('Media upload failed. Please retry.', 502);
  }
  const fileId = kind === 'photo'
    ? tgMsg.photo[tgMsg.photo.length - 1].file_id
    : tgMsg.video.file_id;

  const recipientId = conv.otherParticipant(conversation, userId);
  const message = {
    id: 'M' + genId(10),
    conversationId,
    senderId: userId,
    recipientId,
    type: kind,
    fileId,
    fileName: (fileName || '').slice(0, 80),
    mimeType,
    size: buf.length,
    originalText: null,
    sourceLanguage: null,
    targetLanguage: null,
    translatedText: null,
    translationStatus: 'not-required', // cost control: never translate media
    clientMessageId: clientMessageId || null,
    telegramReference: null,
    createdAt: Date.now(),
  };
  await store.save('message', message);
  return ok({ message });
};
