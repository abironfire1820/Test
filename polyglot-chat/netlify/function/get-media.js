// GET /.netlify/functions/get-media?userId=...&conversationId=...&messageId=...
// Membership-checked media proxy: verifies the file belongs to the caller's
// conversation BEFORE asking Telegram for it. Token never reaches the browser.
const { ok, fail, getIp, isValidUserId, isValidConversationId } = require('../../lib/common');
const { rateLimit } = require('../../lib/ratelimit');
const store = require('../../lib/storage');
const conv = require('../../lib/conversations');
const { downloadFile } = require('../../lib/telegram');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return fail('Method not allowed', 405);
  if (!rateLimit('media-get:' + getIp(event), 120, 60 * 1000)) return fail('Too many requests', 429);

  const { userId, conversationId, messageId } = event.queryStringParameters || {};
  if (!isValidUserId(userId)) return fail('Invalid sender', 403);
  if (!isValidConversationId(conversationId)) return fail('Invalid conversation', 403);

  const conversation = await conv.get(conversationId);
  if (!conversation || !conv.isParticipant(conversation, userId)) return fail('Not authorized', 403);

  const message = await store.find('message', (m) => m.id === messageId && m.conversationId === conversationId);
  if (!message || !message.fileId) return fail('Media not found', 404);

  let file;
  try { file = await downloadFile(message.fileId); }
  catch (e) { console.error('media download failed:', e.message); return fail('Media unavailable', 502); }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, max-age=3600',
    },
    body: file.body.toString('base64'),
    isBase64Encoded: true,
  };
};
