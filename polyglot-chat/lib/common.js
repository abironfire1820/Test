// lib/common.js — shared helpers for every Netlify Function
const crypto = require('crypto');

function ok(data = {}, statusCode = 200) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ success: true, ...data }),
  };
}

function fail(error, statusCode = 400) {
  // Safe error: never leaks stack traces or credentials.
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ success: false, error }),
  };
}

function readJson(event) {
  try { return JSON.parse(event.body || '{}'); } catch (_) { return {}; }
}

function getIp(event) {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['client-ip'] ||
    (event.headers['x-forwarded-for'] || '').split(',')[0] ||
    'unknown'
  ).trim();
}

// Cryptographically secure, URL-safe, non-sequential ID.
function genId(length = 8) {
  return crypto
    .randomBytes(Math.ceil(length * 0.75))
    .toString('base64url')
    .replace(/[-_]/g, 'X')
    .toUpperCase()
    .slice(0, length);
}

function isValidUserId(id) {
  return typeof id === 'string' && /^[A-Z0-9]{6,16}$/.test(id);
}

function isValidConversationId(id) {
  return typeof id === 'string' && /^C[A-Z0-9]{6,16}$/.test(id);
}

module.exports = { ok, fail, readJson, getIp, genId, isValidUserId, isValidConversationId };
