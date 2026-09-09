// GET /.netlify/functions/get-requests?userId=UXXXXXXXX
// Incoming pending requests (enriched) + my conversation list. Powers polling too.
const { ok, fail, getIp, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return fail('Method not allowed', 405);
  if (!rateLimit('req-list:' + getIp(event), 40, 60 * 1000)) return fail('Too many requests', 429);

  const { userId } = event.queryStringParameters || {};
  if (!isValidUserId(userId)) return fail('Invalid User ID');

  const requests = [];
  for (const r of await store.all('request')) {
    if (r.toId !== userId || r.status !== 'pending') continue;
    const from = await store.find('user', (u) => u.id === r.fromId);
    requests.push({ ...r, from: from ? { id: from.id, name: from.name, language: from.language } : null });
  }

  const conversations = [];
  for (const c of await store.all('conversation')) {
    if (!c.participants.includes(userId)) continue;
    const otherId = c.participants.find((p) => p !== userId);
    const other = await store.find('user', (u) => u.id === otherId);
    conversations.push({
      id: c.id,
      createdAt: c.createdAt,
      other: other ? { id: other.id, name: other.name, language: other.language } : { id: otherId, name: 'Unknown user', language: '' },
    });
  }

  return ok({ requests, conversations });
};
