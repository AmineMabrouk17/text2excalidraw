// aiProviders.js
// Multi-provider LLM callers: generate a Mermaid.js diagram from a natural
// language prompt. Every provider returns a normalized result:
//   { provider, model, mermaid, raw }
// where `mermaid` is the cleaned Mermaid source (no ``` fences) and `raw` is
// the untouched model output (useful for debugging).
//
// Supported providers:
//   - gemini     (Google AI Studio, free tier)
//   - groq       (Groq Cloud, free tier)
//   - openrouter (OpenRouter, free open-source models)
//   - ollama     (local, 100% offline — no API key needed)

const MERMAID_SYSTEM_PROMPT = `You are a diagram-generation engine. Given a natural language description, output a single valid Mermaid.js diagram and NOTHING else.

Rules:
- Reply with ONLY the Mermaid code. No explanations, no markdown code fences, no \`\`\`mermaid wrappers.
- Choose the most appropriate diagram type (flowchart, sequenceDiagram, classDiagram, ER, etc.).
- Make node/label text concise and unique. Avoid characters that break Mermaid parsing (&, <, >, quotes) — use spaces or hyphens instead.
- Ensure the diagram is syntactically valid Mermaid that mermaid@10 can parse.`;

export const PROVIDERS = {
  gemini: {
    label: "Google Gemini",
    needsKey: true,
    // gemini-3.6-flash is the current free Flash model; gemini-flash-latest
    // aliases the latest Flash but is frequently rate-limited under load.
    defaultModel: "gemini-3.6-flash",
    models: ["gemini-3.6-flash", "gemini-3-flash-preview", "gemini-flash-latest"],
    docs: "https://aistudio.google.com/app/apikey",
    free: true,
  },
  groq: {
    label: "Groq",
    needsKey: true,
    defaultModel: "openai/gpt-oss-120b",
    models: ["openai/gpt-oss-120b", "llama-3.2-11b-vision-preview"],
    docs: "https://console.groq.com/keys",
    free: true,
  },
  openrouter: {
    label: "OpenRouter",
    needsKey: true,
    defaultModel: "deepseek/deepseek-r1-distill-llama-70b:free",
    models: [
      "deepseek/deepseek-r1-distill-llama-70b:free",
      "qwen/qwen2.5-coder-32b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free",
    ],
    docs: "https://openrouter.ai/keys",
    free: true,
  },
  ollama: {
    label: "Ollama (local)",
    needsKey: false,
    defaultModel: "llama3",
    models: [], // user supplies; we can't enumerate reliably cross-machine
    docs: "https://ollama.com",
    free: true,
    offline: true,
  },
};

// Strip ```mermaid / ``` wrappers and trim.
function cleanMermaid(text) {
  if (!text) return "";
  let out = text.trim();
  // remove leading ```mermaid or ```lang fences
  out = out.replace(/^```[a-zA-Z]*\n?/g, "");
  out = out.replace(/```$/g, "");
  return out.trim();
}

function pickMermaidFromText(text) {
  // If the model wrapped mermaid in fences, prefer the fenced block.
  const fenceMatch = text.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/i);
  if (fenceMatch) return cleanMermaid(fenceMatch[1]);
  return cleanMermaid(text);
}

async function postJSON(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = JSON.stringify(j?.error || j?.message || j);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${detail}`.slice(0, 500));
  }
  return res.json();
}

// ----- Gemini -----
async function callGemini({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const body = {
    systemInstruction: { parts: [{ text: MERMAID_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4 },
  };
  const data = await postJSON(url, { "Content-Type": "application/json" }, body);
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!raw) throw new Error("Gemini returned an empty response.");
  return { provider: "gemini", model, raw, mermaid: pickMermaidFromText(raw) };
}

// ----- Groq / OpenAI-compatible -----
async function callOpenAICompat({ baseUrl, apiKey, model, prompt, providerId }) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const body = {
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: MERMAID_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  };
  const data = await postJSON(`${baseUrl}/chat/completions`, headers, body);
  const raw = data?.choices?.[0]?.message?.content || "";
  if (!raw) throw new Error(`${providerId} returned an empty response.`);
  return { provider: providerId, model, raw, mermaid: pickMermaidFromText(raw) };
}

// ----- Groq -----
function callGroq(cfg) {
  return callOpenAICompat({
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt: cfg.prompt,
    providerId: "groq",
  });
}

// ----- OpenRouter -----
function callOpenRouter(cfg) {
  return callOpenAICompat({
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: cfg.apiKey,
    model: cfg.model,
    prompt: cfg.prompt,
    providerId: "openrouter",
  });
}

// ----- Ollama (local) -----
async function callOllama({ model, prompt, baseUrl }) {
  const url = `${baseUrl || "http://localhost:11434"}/api/chat`;
  const body = {
    model,
    stream: false,
    options: { temperature: 0.4 },
    messages: [
      { role: "system", content: MERMAID_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  };
  const data = await postJSON(url, { "Content-Type": "application/json" }, body);
  const raw = data?.message?.content || "";
  if (!raw) throw new Error("Ollama returned an empty response. Is the model pulled?");
  return { provider: "ollama", model, raw, mermaid: pickMermaidFromText(raw) };
}

/**
 * Generate a Mermaid diagram from a natural language prompt.
 * @param {Object} config
 * @param {string} config.provider  one of: gemini | groq | openrouter | ollama
 * @param {string} [config.apiKey]
 * @param {string} [config.model]
 * @param {string} [config.baseUrl]  Ollama base URL (optional)
 * @param {string} config.prompt
 * @returns {Promise<{provider, model, mermaid, raw}>}
 */
export async function generateMermaid(config) {
  const { provider, prompt } = config;
  if (!prompt || !prompt.trim()) throw new Error("Please enter a description.");

  const model = config.model || PROVIDERS[provider]?.defaultModel;
  const common = { prompt, model };

  switch (provider) {
    case "gemini":
      if (!config.apiKey) throw new Error("Gemini requires an API key.");
      return callGemini({ ...common, apiKey: config.apiKey });
    case "groq":
      if (!config.apiKey) throw new Error("Groq requires an API key.");
      return callGroq({ ...common, apiKey: config.apiKey });
    case "openrouter":
      if (!config.apiKey) throw new Error("OpenRouter requires an API key.");
      return callOpenRouter({ ...common, apiKey: config.apiKey });
    case "ollama":
      return callOllama({ ...common, baseUrl: config.baseUrl });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
