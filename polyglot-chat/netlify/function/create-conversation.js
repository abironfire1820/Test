// POST /.netlify/functions/create-conversation
// Body: { userId, otherUserId } — direct 1-to-1 conversation (idempotent per pair).
const { ok, fail, readJson, getIp, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('conv:' + getIp(event), 15, 60 * 1000)) return fail('Too many requests', 429);

  const { userId, otherUserId } = readJson(event);
  if (!isValidUserId(userId) || !isValidUserId(otherUserId)) return fail('Invalid User ID');
  if (userId === otherUserId) return fail('You cannot chat with yourself');

  const [a, b] = await Promise.all([
    store.find('user', (u) => u.id === userId),
    store.find('user', (u) => u.id === otherUserId),
  ]);
  if (!a || !b) return fail('User not found', 404);

  const existing = await store.find('conversation', (c) =>
    c.participants.includes(userId) && c.participants.includes(otherUserId));
  if (existing) return ok({ conversation: existing, duplicate: true });

  const conversation = await conv.create(userId, otherUserId);
  return ok({ conversation });
};
