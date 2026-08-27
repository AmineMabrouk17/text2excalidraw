<p align="center">
  <img src="public/logo.svg" alt="Text2Excalidraw logo" width="420" style="background:#1f2430; border-radius:16px; padding:16px" />
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

### 2. Add a free AI key (one time)

The app uses a free AI to turn your words into a diagram. Pick a provider from
the dropdown at the top and paste a **free** key:

| Provider | Free key from | Notes |
| --- | --- | --- |
| **Google Gemini** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Recommended. Fast and reliable. |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | Very fast. |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | Many free open-source models. |
| **Ollama** (local) | — none needed | Runs AI on your own computer. 100% offline & private. |

Your key is saved **only in your browser** (local storage). It is never uploaded
to any server except the AI provider you chose.

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

- This is a **client-side app** — there is no backend server collecting your data.
- Your API key lives in your browser's local storage.
- Your prompts go straight to the AI provider you selected.

---

## ❓ FAQ

**Do I have to pay?** No. Every provider above has a free tier.

**Can I use it without an API key?** Yes — choose **Ollama (local)** and run a
model on your machine with `ollama run llama3`.

**Is the diagram editable?** Yes. It's a normal Excalidraw drawing — move, recolor,
rename, delete, export.

**It says "Mermaid parse error".** The AI returned slightly broken diagram code.
Just re-run with a clearer description.

---

## 📄 License

Free to use under the [MIT License](https://opensource.org/licenses/MIT).
