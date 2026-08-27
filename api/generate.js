// api/generate.js
// Vercel serverless function. Receives a generation request from the browser
// and relays it to the chosen AI provider using a SHARED, server-side key.
//
// The shared keys live in Vercel env vars (SERVER_GEMINI_API_KEY,
// SERVER_GROQ_API_KEY, SERVER_OPENROUTER_API_KEY) and are read ONLY here on the
// server — they are never shipped to the browser, so users can't see or
// retrieve them.
//
// If a caller passes their own `apiKey`, the function uses that one instead,
// so people who want to bring their own key get a lower shared-usage footprint
// (the browser normally calls providers directly in that case, see App.jsx).
//
// The renderer (Mermaid -> Excalidraw elements) is browser-side only; this
// function stops at returning { provider, model, mermaid, raw }.

import { generateMermaid } from "../src/aiProviders.js";

const SERVER_KEYS = {
  gemini: process.env.SERVER_GEMINI_API_KEY || "",
  groq: process.env.SERVER_GROQ_API_KEY || "",
  openrouter: process.env.SERVER_OPENROUTER_API_KEY || "",
};

// Only cloud providers can use a shared key. Ollama is local — the browser
// must talk to the user's machine directly, never through us.
const CLOUD_PROVIDERS = ["gemini", "groq", "openrouter"];

// Best-effort per-IP rate limit to stop the shared keys being farmed as a
// free API. In-memory (per function instance) — not bulletproof across the
// whole Vercel fleet, but it stops casual abuse.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const hits = new Map();

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim() || "unknown";
  return req.headers["x-real-ip"] || "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  const { provider, model, prompt, apiKey } = body;

  if (!CLOUD_PROVIDERS.includes(provider)) {
    return res
      .status(400)
      .json({ error: "This provider can't use a shared key." });
  }
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "Please enter a description." });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    return res
      .status(429)
      .json({ error: `Rate limit reached (${RATE_MAX}/min). Wait and retry.` });
  }
  recent.push(now);
  hits.set(ip, recent);

  const sharedKey = SERVER_KEYS[provider] || "";
  const finalKey = apiKey || sharedKey;

  if (!finalKey) {
    return res.status(400).json({
      error: `No API key configured for ${provider} on the server. Use your own key instead.`,
    });
  }

  try {
    const result = await generateMermaid({
      provider,
      model,
      prompt: prompt.trim(),
      apiKey: finalKey,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}