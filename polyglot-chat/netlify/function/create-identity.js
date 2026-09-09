// POST /.netlify/functions/create-identity
// Body: { name, language } -> creates a temporary account-less identity.
const { ok, fail, readJson, getIp, genId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const LANGS = require('../../lib/langs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('create:' + getIp(event), 10, 60 * 1000)) return fail('Too many requests', 429);

  const { name, language } = readJson(event);
  const cleanName = (name || '').toString().trim();
  if (!cleanName || cleanName.length > 40) return fail('Name must be 1-40 characters');
  if (!LANGS.includes(language)) return fail('Unsupported language');

  let id;
  do { id = 'U' + genId(8); } while (await store.find('user', (u) => u.id === id));

  const user = { id, name: cleanName, language, createdAt: Date.now() };
  await store.save('user', user);
  return ok({ user });
};
