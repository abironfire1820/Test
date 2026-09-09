// GET /.netlify/functions/search-user?id=UXXXXXXXX
// Returns ONLY public profile fields. No internal/storage metadata.
const { ok, fail, getIp, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return fail('Method not allowed', 405);
  if (!rateLimit('search:' + getIp(event), 30, 60 * 1000)) return fail('Too many requests', 429);

  const { id } = event.queryStringParameters || {};
  if (!isValidUserId(id)) return fail('Invalid User ID format');

  const user = await store.find('user', (u) => u.id === id);
  if (!user) return fail('User not found', 404);

  return ok({ user: { id: user.id, name: user.name, language: user.language } });
};
