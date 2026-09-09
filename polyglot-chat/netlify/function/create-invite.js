// POST /.netlify/functions/create-invite
// Body: { userId } -> unique cryptographically random invite token + URL.
// Each call creates a NEW token — tokens are never reused across invitees.
const { ok, fail, readJson, getIp, genId, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('invite:' + getIp(event), 15, 60 * 1000)) return fail('Too many requests', 429);

  const { userId } = readJson(event);
  if (!isValidUserId(userId)) return fail('Invalid User ID');

  const user = await store.find('user', (u) => u.id === userId);
  if (!user) return fail('User not found', 404);

  const token = genId(16).toLowerCase();
  const invite = { id: token, token, fromId: userId, status: 'pending', joinedBy: null, conversationId: null, createdAt: Date.now() };
  await store.save('invite', invite);

  const host = event.headers.host || 'localhost:8888';
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return ok({
    invite: {
      token,
      url: `${proto}://${host}/join/${token}`,
      from: { id: user.id, name: user.name, language: user.language },
    },
  });
};
