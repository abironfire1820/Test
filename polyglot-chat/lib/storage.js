// lib/storage.js — replaceable storage adapter backed by Telegram (TEST persistence layer).
//
// ⚠️ TELEGRAM IS NOT A REAL DATABASE. Honest strategy:
//   - Every record (user / request / conversation / message / invite) is a JSON line
//     posted to a PRIVATE Telegram CHANNEL of which the bot is an administrator.
//   - Records are read back via getUpdates (channel_post updates).
//   - Limitations: Telegram only keeps updates ~24h; getUpdates returns max 100 per call;
//     a cold function instance starts with an empty cache. So "history" is best-effort,
//     recent-only, and NEVER fabricated. Swap this adapter for a real DB later without
//     touching the frontend — see README "Future database migration".
//
// IMPORTANT SETUP: use a CHANNEL (not a group chat) as TELEGRAM_STORAGE_CHAT_ID, add the
// bot as admin, and make sure no webhook is set (deleteWebhook) or getUpdates will fail.

const { tgCall, sendRecordMessage } = require('./telegram');

const PREFIX = 'PCHAT|REC|v1|';
const memory = new Map();   // "type:id" -> { v, type, id, ts, data }  (warm-instance cache)
let updateOffset = 0;       // per warm instance
let hydrated = false;

async function hydrate() {
  if (hydrated) return;
  const updates = await tgCall('getUpdates', { offset: updateOffset, limit: 100, timeout: 0 });
  for (const u of updates) {
    updateOffset = Math.max(updateOffset, u.update_id + 1);
    const msg = u.channel_post || u.message;
    if (!msg || !msg.text || !msg.text.startsWith(PREFIX)) continue;
    try {
      const rec = JSON.parse(msg.text.slice(PREFIX.length));
      if (rec && rec.type && rec.id) memory.set(rec.type + ':' + rec.id, rec);
    } catch (_) { /* skip malformed record */ }
  }
  hydrated = true;
}

async function save(type, data) {
  const rec = { v: 1, type, id: data.id, ts: Date.now(), data };
  await sendRecordMessage(PREFIX + JSON.stringify(rec));
  memory.set(type + ':' + data.id, rec);
  return data;
}

async function all(type) {
  try { await hydrate(); } catch (e) { console.error('storage hydrate failed:', e.message); }
  return [...memory.values()].filter((r) => r.type === type).map((r) => r.data);
}

async function find(type, predicate) {
  return (await all(type)).find(predicate) || null;
}

module.exports = { save, all, find };
