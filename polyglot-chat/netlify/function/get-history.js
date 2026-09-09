// GET /.netlify/functions/get-history?userId=...&conversationId=...
// Returns conversation + participants + whatever history the Telegram adapter can
// legitimately retrieve (recent records only). Never fabricates old messages.
const { ok, fail, getIp, isValidUserId, isValidConversationId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return fail('Method not allowed', 405);
  if (!rateLimit('hist:' + getIp(event), 60, 60 * 1000)) return fail('Too many requests', 429);

  const { userId, conversationId } = event.queryStringParameters || {};
  if (!isValidUserId(userId)) return fail('Invalid sender');
  if (!isValidConversationId(conversationId)) return fail('Invalid conversation');

  const conversation = await conv.get(conversationId);
  if (!conversation) return fail('Conversation not found', 404);
  if (!conv.isParticipant(conversation, userId)) return fail('Not a participant', 403);

  const users = {};
  for (const pid of conversation.participants) {
    const u = await store.find('user', (x) => x.id === pid);
    if (u) users[pid] = { id: u.id, name: u.name, language: u.language };
  }

  const messages = (await store.all('message'))
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt);

  return ok({ conversation, users, messages });
};
