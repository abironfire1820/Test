// POST /.netlify/functions/send-request
// Body: { fromId, toId, clientRequestId? } — message request flow, never auto-chat.
const { ok, fail, readJson, getIp, genId, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('req-send:' + getIp(event), 15, 60 * 1000)) return fail('Too many requests', 429);

  const { fromId, toId, clientRequestId } = readJson(event);
  if (!isValidUserId(fromId) || !isValidUserId(toId)) return fail('Invalid User ID');
  if (fromId === toId) return fail('You cannot send a request to yourself');

  const [from, to] = await Promise.all([
    store.find('user', (u) => u.id === fromId),
    store.find('user', (u) => u.id === toId),
  ]);
  if (!from || !to) return fail('User not found', 404);

  // Idempotency: same pair (or same clientRequestId) must not create duplicates.
  const existing = await store.find('request', (r) =>
    (clientRequestId && r.clientRequestId === clientRequestId) ||
    (r.fromId === fromId && r.toId === toId && r.status === 'pending')
  );
  if (existing) return ok({ request: existing, duplicate: true });

  const request = { id: 'R' + genId(8), fromId, toId, status: 'pending', clientRequestId: clientRequestId || null, createdAt: Date.now() };
  await store.save('request', request);
  return ok({ request });
};
