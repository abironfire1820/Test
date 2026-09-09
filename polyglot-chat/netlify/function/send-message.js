// POST /.netlify/functions/send-message
// Body: { userId, conversationId, clientMessageId?, type: 'text', text }
// The SERVER builds the canonical message object (client translatedText is never trusted).
const { ok, fail, readJson, getIp, genId, isValidUserId, isValidConversationId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');
const { translate } = require('../../lib/logfare');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('msg:' + getIp(event), 20, 60 * 1000)) return fail('Too many requests', 429);

  const { userId, conversationId, clientMessageId, type = 'text', text } = readJson(event);
  if (!isValidUserId(userId)) return fail('Invalid sender');
  if (!isValidConversationId(conversationId)) return fail('Invalid conversation');

  // 1) Validate conversation + membership (never trust the client).
  const conversation = await conv.get(conversationId);
  if (!conversation) return fail('Conversation not found', 404);
  if (!conv.isParticipant(conversation, userId)) return fail('Not a participant', 403);

  if (type !== 'text') return fail('Use the media endpoint for files', 400);
  const clean = (text || '').toString().trim();
  if (!clean) return fail('Empty message');
  if (clean.length > 2000) return fail('Message too long (max 2000 chars)');

  // 2) Idempotency / duplicate protection.
  if (clientMessageId) {
    const existing = await store.find('message', (m) => m.clientMessageId === clientMessageId && m.senderId === userId);
    if (existing) return ok({ message: existing, duplicate: true });
  }

  // 3) Recipient comes from conversation membership — never from the client.
  const recipientId = conv.otherParticipant(conversation, userId);
  const [sender, recipient] = await Promise.all([
    store.find('user', (u) => u.id === userId),
    store.find('user', (u) => u.id === recipientId),
  ]);
  if (!sender || !recipient) return fail('Participant identity missing', 404);

  const sourceLanguage = sender.language;
  const targetLanguage = recipient.language;

  // 4) Cost control + translation (Logfare logfare/auto routing; the selected model detects the real source language).
  let translatedText = null;
  let translationStatus = 'skipped';
  if (sourceLanguage !== targetLanguage) {
    try {
      translatedText = await translate(clean, targetLanguage, sourceLanguage);
      translationStatus = 'ok';
    } catch (e) {
      // Never lose the original message: store with translation_status = failed.
      console.error('Logfare translation failed:', e.message);
      translationStatus = 'failed';
    }
  } else {
    translatedText = clean; // same language: no API call needed
  }

  // 5) Canonical message object (telegramReference = the Telegram storage message).
  const message = {
    id: 'M' + genId(10),
    conversationId,
    senderId: userId,
    recipientId,
    type: 'text',
    originalText: clean,
    sourceLanguage,
    targetLanguage,
    translatedText,
    translationStatus, // 'ok' | 'failed' | 'skipped'
    clientMessageId: clientMessageId || null,
    telegramReference: null,
    createdAt: Date.now(),
  };

  // 6) Persist/relay through Telegram storage adapter.
  try {
    const tg = await store.save('message', message);
    message.telegramReference = tg && tg.id ? String(tg.id) : null;
  } catch (e) {
    console.error('telegram storage failed:', e.message);
    return fail('Message could not be stored right now. Please retry.', 502);
  }

  return ok({ message });
};
