<p align="center">
  <img src="public/logo.svg?raw=1&v=3" alt="Text2Excalidraw logo" width="500" />
</p>

<h1 align="center">Text2Excalidraw</h1>

<p align="center">
  <b>Prompts in. Editable diagrams out.</b><br/>
  Turn a sentence into a real, editable diagram — using free AI.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"/></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black" alt="React 18+"/></a>
  <a href="https://excalidraw.com"><img src="https://img.shields.io/badge/Powered%20by-Excalidraw-6965db" alt="Powered by Excalidraw"/></a>
</p>

---

## ✨ What is this?

**Text2Excalidraw** is a simple web app that draws diagrams for you from plain
words. You type something like:

> *"Architecture of Uber with Auth and PostgreSQL"*

…and it instantly draws a clean, editable diagram on a whiteboard. You can then
move the boxes, change the colors, rename things, and export the picture as
PNG or SVG — exactly like in [Excalidraw](https://excalidraw.com).

No drawing skills needed. No design software. Just describe what you want.

<p align="center"><i>Type a sentence → the AI draws it → you edit the Excalidraw diagram.</i></p>

## ✨ Features

- 🗣️ **Natural language → diagram.** Describe what you want in plain English (or any language) and get an editable Excalidraw diagram.
- ⚡ **Multi-provider, free.** Gemini, Groq, OpenRouter, or 100% offline Ollama.
- ✏️ **Fully editable.** Move, recolor, rename, and export as PNG/SVG on a real Excalidraw canvas.
- 🌀 **Beautiful loading state.** While the AI sketches your diagram, a hand-drawn-style constellation of moving dots animates over the canvas (Excalidraw aesthetic), so you always know it's working.
- 🔒 **Private.** Client-side only; your API key lives in your browser's `localStorage`.

---

## 🚀 How to use it (in 3 steps)

You only need to do this once. After that, just open the app and type.

### 1. Get it running

If someone gave you the project folder, open a terminal in that folder and run:

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

> The dev server uses port 3000 by default. If that port is busy it picks the
> next free one (3001, 3002, …). You can force a port with
> `npx vite --port 4000`.

> 💡 Don't have Node.js? Install it from
> [nodejs.org](https://nodejs.org) (choose the "LTS" version) — that's the only
> thing you need on your computer.

### 2. Pick a provider (optional — it works without doing this)

Every provider works out of the box:

- By default the site uses its **built-in shared key** (hidden server-side —
  visitors can use it freely but can never see or retrieve it).
- Ticking **"Use my own key"** pastes in your own key for higher limits /
  full privacy; it's saved only in your browser and sent straight to that
  provider, never through our server.
- **Ollama** is 100% local, so it always uses *your* machine — no key at all.

| Provider | Free key from | Notes |
| --- | --- | --- |
| **Google Gemini** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Recommended. Fast and reliable. |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | Very fast. |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | Many free open-source models. |
| **Ollama** (local) | — none needed | Runs AI on your own computer. 100% offline & private. |

A key you paste is saved **only in your browser** (local storage). It is never
uploaded to any server except the AI provider you chose.

### 3. Type and generate

Type your description in the box, hit **Generate**, and watch the diagram appear.
Edit it however you like, then use Excalidraw's export menu to save a PNG/SVG.

---

## 💡 Example prompts

- *"Login flow with email, password and two-factor auth"*
- *"Online shop: cart, payments, inventory and shipping"*
- *"How a search engine works: crawler, index, ranking"*
- *"Class diagram for a library: Book, Member, Loan"*

The clearer your sentence, the better the diagram.

---

## 🔒 Privacy

- **Shared-key mode:** prompts go to our Vercel function (`/api/generate`),
  which holds the site's API keys as server-side secrets and relays your
  prompt to the provider. The keys are **never sent to your browser**, so
  visitors can use them but can never see or retrieve them. A per-IP rate
  limit protects the shared keys from abuse.
- **Your own key:** with **"Use my own key"** ticked, your key lives only in
  your browser's local storage and your prompts go **directly** from your
  browser to the AI provider you chose — they don't transit our server.
- **Ollama:** fully offline on your own machine.

---

## ❓ FAQ

**Do I have to pay?** No. The built-in shared key is free to use, and every
provider above also has a personal free tier.

**Why can't I see the built-in key?** It's stored as a secret on our server and
only ever used server-side. It's deliberately impossible for a visitor to
retrieve — that's what keeps it from being leaked or stolen.

**Can I use it without an API key?** Yes. The shared key works with
Gemini/Groq/OpenRouter, and **Ollama (local)** needs no key at all — just run
a model with `ollama run llama3`.

**Is the diagram editable?** Yes. It's a normal Excalidraw drawing — move, recolor,
rename, delete, export.

**It says "Mermaid parse error".** The AI returned slightly broken diagram code.
Just re-run with a clearer description.

**The shared key hit its rate limit?** Cool down for a minute, or tick
**"Use my own key"** and paste a free personal key — no limits.

---

## 🧑‍💻 Self-hosting (for the owner)

Set your shared keys as Vercel-env secrets (never in the repo, never `VITE_*`):

```bash
vercel env add SERVER_GEMINI_API_KEY production
vercel env add SERVER_GROQ_API_KEY production
vercel env add SERVER_OPENROUTER_API_KEY production
vercel deploy --prod
```

For local development of the shared-key flow, run the serverless function
alongside Vite (Vite proxies `/api` → port 3001):

```bash
npm start            # terminal 1: the app on http://localhost:3000
vercel dev -l 3001   # terminal 2: /api/generate locally
```

---

## 📄 License

Free to use under the [MIT License](https://opensource.org/licenses/MIT).
