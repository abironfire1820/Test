// GET  /.netlify/functions/join-invite?token=...   -> invite preview (does NOT join)
// POST /.netlify/functions/join-invite { token, userId } -> explicit join creates 1-to-1 conversation
const { ok, fail, readJson, getIp, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const { token } = event.queryStringParameters || {};
    const invite = await store.find('invite', (i) => i.token === token);
    if (!invite) return fail('Invalid invitation link', 404);
    const inviter = await store.find('user', (u) => u.id === invite.fromId);
    return ok({
      invite: {
        token: invite.token,
        status: invite.status,
        from: inviter ? { id: inviter.id, name: inviter.name, language: inviter.language } : null,
      },
    });
  }

  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('join:' + getIp(event), 20, 60 * 1000)) return fail('Too many requests', 429);

  const { token, userId } = readJson(event);
  if (!isValidUserId(userId)) return fail('Create your identity first');

  const invite = await store.find('invite', (i) => i.token === token);
  if (!invite) return fail('Invalid invitation link', 404);
  if (invite.status === 'used') {
    return ok({ conversationId: invite.conversationId, alreadyJoined: true });
  }
  if (invite.fromId === userId) return fail('You cannot join your own invitation');

  const joiner = await store.find('user', (u) => u.id === userId);
  if (!joiner) return fail('Create your identity first', 400);

  const conversation = await conv.create(invite.fromId, userId);
  invite.status = 'used';
  invite.joinedBy = userId;
  invite.conversationId = conversation.id;
  await store.save('invite', invite);
  return ok({ conversationId: conversation.id });
};
