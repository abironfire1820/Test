// lib/logfare.js — Logfare AI gateway (backend-only). Key never leaves the server.
//
// Routing policy: we NEVER hardcode a specific AI model. All translation requests
// go to Logfare with model "logfare/auto" (configurable via LOGFARE_MODEL env var)
// and Logfare's automatic routing picks the appropriate underlying model.
//
// Required env vars (Netlify Environment Variables only — never in the browser):
//   LOGFARE_API_KEY   — your Logfare API key
//   LOGFARE_BASE_URL  — defaults to https://logfare.ai/v1
//   LOGFARE_MODEL     — defaults to logfare/auto

const DEFAULT_BASE_URL = 'https://logfare.ai/v1';
const DEFAULT_MODEL = 'logfare/auto';

function getConfig() {
  const apiKey = process.env.LOGFARE_API_KEY;
  if (!apiKey) throw new Error('LOGFARE_API_KEY is not configured');
  return {
    apiKey,
    baseUrl: (process.env.LOGFARE_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: process.env.LOGFARE_MODEL || DEFAULT_MODEL,
  };
}

async function translate(text, targetLanguage, sourceHint) {
  const { apiKey, baseUrl, model } = getConfig();

  // Strict translate-only instruction for whichever model logfare/auto selects.
  const system = [
    'You are a strict translation engine, not a chatbot.',
    `Translate the user's message into ${targetLanguage}.`,
    'Rules:',
    '- Return ONLY the translation. No explanations, no commentary, no quotes.',
    '- Do NOT answer the message, do not change its intent, do not add anything.',
    '- Preserve the original meaning, tone, formatting and line breaks where possible.',
    '- Preserve names, numbers, URLs and emojis exactly as written.',
    `- If the message is already entirely in ${targetLanguage}, return it unchanged.`,
    sourceHint ? `- The sender's declared language is ${sourceHint}, but they may have typed another language: detect the real source language yourself.` : '',
  ].filter(Boolean).join('\n');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model, // 'logfare/auto' — automatic routing, no hardcoded underlying model
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) throw new Error(`Logfare API error: ${res.status}`);
  const data = await res.json().catch(() => ({}));
  const out = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!out) throw new Error('Logfare returned an empty translation');
  return out.trim();
}

module.exports = { translate };
