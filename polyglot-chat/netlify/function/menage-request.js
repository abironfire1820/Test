// POST /.netlify/functions/manage-request
// Body: { userId, requestId, action: 'accept' | 'reject' }
// Only the intended receiver can act; accepting creates the 1-to-1 conversation.
const { ok, fail, readJson, getIp, isValidUserId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);
  if (!rateLimit('req-manage:' + getIp(event), 30, 60 * 1000)) return fail('Too many requests', 429);

  const { userId, requestId, action } = readJson(event);
  if (!isValidUserId(userId)) return fail('Invalid User ID');

  const request = await store.find('request', (r) => r.id === requestId);
  if (!request) return fail('Request not found', 404);
  if (request.toId !== userId) return fail('Not authorized', 403);
  if (request.status !== 'pending') return fail('Request already handled');

  if (action === 'reject') {
    request.status = 'rejected';
    await store.save('request', request);
    return ok({ status: 'rejected' });
  }
  if (action !== 'accept') return fail('Invalid action');

  const conversation = await conv.create(request.fromId, request.toId);
  request.status = 'accepted';
  request.conversationId = conversation.id;
  await store.save('request', request);
  return ok({ status: 'accepted', conversationId: conversation.id });
};
