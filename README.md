# Isaac Shop — AI-Powered Voice Commerce

An interactive e-commerce storefront powered by **Gemini 3.1 Flash Live** for real-time voice-first shopping experiences. Built for the [Generative UI Global Hackathon](https://github.com/CopilotKit/Generative-UI-Global-Hackathon-Starter-Kit).

## ✨ Features

- **Voice Assistant (Gemini Live)** — Talk to a virtual shop assistant that searches products, opens details, and adds items to your cart in real time.
- **Wake-Word Activation** — The microphone listens continuously and only triggers when the user says a configured wake word (e.g. "Isaac").
- **Product Catalog with Live Search** — Categories, filters, and a search bar that auto-fills when the AI performs a product lookup.
- **Shopping Cart** — Full add/remove/view cart flow driven by voice or click.
- **Product Detail Modal** — Specs, pricing, and one-click purchase powered by Gemini tool calls.
- **CopilotKit Integration** — Agent-backed CRM and lead management on the `/leads` route.
- **MCP Server** — Model Context Protocol server for extended tool capabilities.

## 🏗️ Architecture

```
apps/
├── frontend/   → Next.js 15 (Turbopack) — storefront UI + Gemini Live client
├── bff/        → Hono backend-for-frontend — CopilotKit runtime proxy
├── agent/      → LangGraph agent (Python, optional)
└── mcp/        → MCP server (mcp-use)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- A **Google Gemini API Key** ([Get one here](https://aistudio.google.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/isaacsaless/isaac-shop.git
cd isaac-shop

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start development servers
npm run dev
```

The frontend will be available at `http://localhost:3010` and the BFF at `http://localhost:4000`.

### Routes

| Route    | Description                           |
| -------- | ------------------------------------- |
| `/shop`  | Voice-enabled product store           |
| `/leads` | CopilotKit-powered CRM dashboard     |

## 🎙️ Voice Commands

Once connected via the **"Conectar Voz"** button, say the wake word followed by your request:

- *"Isaac, show me smartphones"*
- *"Isaac, I want to see the Aura Pro Max"*
- *"Isaac, add this to my cart"*
- *"Isaac, open my cart"*

## 🔧 Environment Variables

See [`.env.example`](.env.example) for a full list of configurable variables. The minimum required variable is:

| Variable              | Required | Description                     |
| --------------------- | -------- | ------------------------------- |
| `GEMINI_API_KEY`      | ✅       | Google Gemini API key           |
| `GOOGLE_GEMINI_API_KEY` | ✅     | Same key, used by Live token route |

## 📦 Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, Sonner
- **AI:** Google Gemini 3.1 Flash Live (WebSocket), Web Speech API
- **Backend:** Hono (BFF), CopilotKit v2
- **Tooling:** Turbopack, TypeScript, Concurrently

## 📄 License

MIT
