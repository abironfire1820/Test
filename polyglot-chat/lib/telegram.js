// lib/telegram.js — the ONLY module allowed to talk to the Telegram Bot API.
// Secrets live exclusively in Netlify environment variables (never in the browser).

function botBase() {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
}

function assertConfigured() {
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!process.env.TELEGRAM_STORAGE_CHAT_ID) throw new Error('TELEGRAM_STORAGE_CHAT_ID is not configured');
}

async function tgCall(method, params = {}) {
  assertConfigured();
  const res = await fetch(`${botBase()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || res.status}`);
  }
  return data.result;
}

// Store one structured record in the private storage channel/chat.
async function sendRecordMessage(text) {
  return tgCall('sendMessage', { chat_id: process.env.TELEGRAM_STORAGE_CHAT_ID, text });
}

// Forward media (image/video) to Telegram; returns the Telegram message (contains file_id).
async function sendMedia(kind, fileBuffer, fileName, mimeType) {
  assertConfigured();
  const form = new FormData();
  form.append('chat_id', process.env.TELEGRAM_STORAGE_CHAT_ID);
  form.append(kind, new Blob([fileBuffer], { type: mimeType }), fileName);
  const method = kind === 'photo' ? 'sendPhoto' : 'sendVideo';
  const res = await fetch(`${botBase()}/${method}`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(`Telegram ${method} failed: ${data.description || res.status}`);
  }
  return data.result;
}

// Download a Telegram file server-side (token stays on the server).
async function downloadFile(fileId) {
  const f = await tgCall('getFile', { file_id: fileId });
  if (!f.file_path) throw new Error('Telegram file path unavailable');
  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${f.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Telegram file download failed');
  return {
    body: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
  };
}

module.exports = { tgCall, sendRecordMessage, sendMedia, downloadFile };
