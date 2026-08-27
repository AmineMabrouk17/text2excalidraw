import React, { useState, useCallback, useMemo } from "react";
import { Excalidraw, convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { generateMermaid, PROVIDERS } from "./aiProviders";
import LoadingCanvas from "./LoadingCanvas";
import "./index.css";

// localStorage keys — keys stay in the browser only (per README). The active
// provider + model are also persisted so the UI restores the last selection.
const LS = {
  keys: "t2e.keys", // { gemini, groq, openrouter, ollamaBase }
  provider: "t2e.provider",
  model: "t2e.model",
};

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Repair Mermaid that free LLMs often emit wrongly. Mermaid v10's flowchart
// parser rejects class-diagram syntax (A:::cls, classDef, `class A cls`)
// and certain punctuation. We strip those out and normalize separators so a
// usable diagram still renders instead of hard-failing.
function sanitizeMermaid(src) {
  if (!src) return "";
  const lines = src.split("\n");
  const out = [];
  for (let raw of lines) {
    let line = raw;
    // drop class-definition + class-application statements (flowchart-only safe)
    if (/^\s*classDef\s/i.test(line)) continue;
    if (/^\s*class\s+\w+\s+[\w\s,]*;?\s*$/i.test(line) && !/-->/.test(line)) continue;
    // remove inline ":::className" style markers attached to nodes
    line = line.replace(/:::[A-Za-z0-9_-]+/g, "");
    // remove standalone style/class directives that may appear mid-body
    if (/^\s*(style|click)\s+\w+/i.test(line)) continue;
    out.push(line);
  }
  let text = out.join("\n");
  // normalize ambiguous unicode separators / full-width chars
  text = text.replace(/；/g, ";").replace(/：/g, ":").replace(/　/g, " ");
  // collapse stray "::" that is not part of a valid link
  text = text.replace(/(:){3,}/g, ":");
  return text.trim();
}

export default function App() {
  const excalidrawRef = React.useRef(null);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState(
    () => localStorage.getItem(LS.provider) || "gemini"
  );
  const [model, setModel] = useState(() => localStorage.getItem(LS.model) || "");
  const [keys, setKeys] = useState(() => {
    // Stored per-user keys win; Vite env vars (from a local .env) provide
    // optional defaults so a developer can ship a pre-filled key without
    // committing secrets. Keys never leave the browser except to the chosen
    // provider.
    const env = {
      gemini: import.meta.env.VITE_GEMINI_API_KEY || "",
      groq: import.meta.env.VITE_GROQ_API_KEY || "",
      openrouter: import.meta.env.VITE_OPENROUTER_API_KEY || "",
      ollamaBase: import.meta.env.VITE_OLLAMA_BASE_URL || "",
    };
    return { ...env, ...loadJSON(LS.keys, {}) };
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: "idle", msg: "" });

  const needsKey = PROVIDERS[provider]?.needsKey;
  const apiKey = keys[provider] || "";
  const currentModel =
    model || PROVIDERS[provider]?.defaultModel || "";

  const updateKeys = useCallback(
    (patch) => {
      setKeys((prev) => {
        const next = { ...prev, ...patch };
        saveJSON(LS.keys, next);
        return next;
      });
    },
    []
  );

  const onProviderChange = (e) => {
    const p = e.target.value;
    setProvider(p);
    setModel(""); // reset to that provider's default
    localStorage.setItem(LS.provider, p);
  };
  const onModelChange = (e) => {
    setModel(e.target.value);
    localStorage.setItem(LS.model, e.target.value);
  };

  // Core: prompt -> LLM -> Mermaid -> Excalidraw -> canvas
  const handleGenerate = useCallback(async () => {
    if (busy) return;
    if (!prompt.trim()) {
      setStatus({ type: "error", msg: "Please describe the diagram you want." });
      return;
    }
    setBusy(true);
    setStatus({ type: "info", msg: "Asking the model for a Mermaid diagram…" });

    let gen;
    try {
      gen = await generateMermaid({
        provider,
        apiKey,
        model: currentModel,
        baseUrl: keys.ollamaBase,
        prompt: prompt.trim(),
      });
    } catch (err) {
      setBusy(false);
      setStatus({ type: "error", msg: `LLM error: ${err.message}` });
      return;
    }

    if (!gen.mermaid) {
      setBusy(false);
      setStatus({
        type: "error",
        msg: "The model didn't return usable Mermaid code.",
      });
      return;
    }

    setStatus({ type: "info", msg: "Rendering Mermaid to Excalidraw…" });

    try {
    // Try the raw model output first; if Mermaid rejects it (LLMs frequently
    // emit invalid syntax), fall back to a sanitized version so the user still
    // gets a diagram instead of a hard error.
    const candidates = [gen.mermaid, sanitizeMermaid(gen.mermaid)].filter(Boolean);
    let rendered = false;
    let lastErr = null;
    for (const mermaidSrc of candidates) {
      try {
        const { elements, files } = await parseMermaidToExcalidraw(mermaidSrc, {
          themeVariables: { fontFamily: "20px" },
        });
        const exElements = convertToExcalidrawElements(elements);
        excalidrawRef.current?.updateScene({
          elements: exElements,
          files,
          appState: {
            ...excalidrawRef.current.getAppState(),
            scrollToContent: true,
          },
        });
        rendered = true;
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (rendered) {
      setStatus({
        type: "success",
        msg: `✓ Rendered via ${PROVIDERS[gen.provider]?.label} (${gen.model}). Edit it freely!`,
      });
    } else {
      setStatus({
        type: "error",
        msg: `Mermaid parse error: ${lastErr?.message}. Try a clearer description.`,
      });
    }
  } finally {
    setBusy(false);
  }
}, [busy, prompt, provider, apiKey, currentModel, keys.ollamaBase]);

  const statusClass = useMemo(() => {
    switch (status.type) {
      case "error":
        return "status status-error";
      case "success":
        return "status status-success";
      case "info":
        return "status status-info";
      default:
        return "status";
    }
  }, [status]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          <span className="title">Text2Excalidraw</span>
        </div>
        <div className="controls">
          <select
            value={provider}
            onChange={onProviderChange}
            aria-label="LLM provider"
          >
            {Object.entries(PROVIDERS).map(([id, p]) => (
              <option key={id} value={id}>
                {p.label}
                {p.offline ? " (offline)" : ""}
              </option>
            ))}
          </select>

          {(PROVIDERS[provider]?.models?.length > 0 || provider === "ollama") && (
            <input
              className="model-input"
              list={`${provider}-models`}
              placeholder={PROVIDERS[provider]?.defaultModel}
              value={currentModel}
              onChange={onModelChange}
              aria-label="Model name"
            />
          )}
          <datalist id={`${provider}-models`}>
            {PROVIDERS[provider]?.models?.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          {needsKey ? (
            <input
              className="key-input"
              type="password"
              placeholder={`${PROVIDERS[provider].label} API key`}
              value={apiKey}
              onChange={(e) => updateKeys({ [provider]: e.target.value })}
              aria-label="API key"
            />
          ) : (
            <input
              className="key-input"
              placeholder="Ollama base URL (optional)"
              value={keys.ollamaBase || ""}
              onChange={(e) => updateKeys({ ollamaBase: e.target.value })}
              aria-label="Ollama base URL"
            />
          )}
        </div>
      </header>

      <div className="promptbar">
        <input
          className="prompt-input"
          placeholder='e.g. "Architecture of Uber with Auth and PostgreSQL"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          aria-label="Diagram description"
        />
        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={busy}
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </div>

      {status.msg && (
        <div className={statusClass} role="status">
          {status.msg}
        </div>
      )}

      <div className="canvas-wrap">
        <Excalidraw
          excalidrawAPI={(api) => (excalidrawRef.current = api)}
          initialData={{ appState: { viewBackgroundColor: "#ffffff" } }}
        />
        {busy && (
          <LoadingCanvas label="Sketching your diagram with AI…" />
        )}
      </div>
    </div>
  );
}
