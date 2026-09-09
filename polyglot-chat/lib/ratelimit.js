// lib/ratelimit.js — lightweight in-memory fixed-window rate limiting (per warm instance).
// No paid third-party service; good enough abuse damping for a prototype.
const buckets = new Map();

function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  return b.count <= limit;
}

module.exports = { rateLimit };
