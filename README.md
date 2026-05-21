# Generative UI Global Hackathon Monorepo

This repository now ships **two primary demos in one monorepo**:

- **`/leads`**: a CopilotKit-powered workshop leads canvas with dashboard, kanban, inline generative UI, and optional Notion-backed workflows.
- **`/shop`**: an Isaac Shop voice-commerce demo powered by **Gemini Live**, wake-word activation, live product search, and cart actions.

The default homepage redirects to **`/leads`**.

## Highlights

- **Workshop leads canvas** with quick stats, status donut, workshop demand chart, kanban pipeline, optimistic edits, and Copilot sidebar.
- **Controlled + open generative UI** for inline lead cards, HITL email drafts, and generic tool fallbacks in chat.
- **Voice storefront** with Gemini Live audio, browser speech recognition, configurable wake words, catalog search, product details, and cart flow.
- **Optional Python agent** for LangGraph / Deep Agents workflows and Notion integration.
- **Optional MCP app** built with `mcp-use`, including lead list, demand, pipeline, dashboard, and email draft widgets.
- **Hono BFF** that proxies CopilotKit requests and remaps known runtime failures into actionable UI hints.

## Architecture

```text
apps/
├── frontend/   Next.js 16 + React 19 app
│               Routes: /leads, /shop, /showcase, /about
├── bff/        Hono + CopilotKit runtime proxy on :4000
├── agent/      Optional Python LangGraph / Deep Agents backend
└── mcp/        Optional mcp-use server on :3011
```

## Routes

| Route | Purpose |
| --- | --- |
| `/leads` | Main workshop lead triage canvas backed by CopilotKit |
| `/shop` | Gemini Live voice shopping demo |
| `/showcase` | Frontend tool surface reference for the leads experience |
| `/about` | In-app overview and documentation hub |

## Quickstart

### Prerequisites

- **Node.js 18+**
- **npm**
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com)
- **Python 3.11+** only if you want to run the optional agent in `apps/agent`

### Install and Run

```bash
npm install
cp .env.example .env
```

Set at least one of these in `.env`:

- `GEMINI_API_KEY`
- `GOOGLE_GEMINI_API_KEY`

Then start the default development stack:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:3010`
- BFF on `http://localhost:4000`

If you also want the local MCP server:

```bash
npm run dev:full
```

That additionally starts:

- MCP server on `http://localhost:3011`

### Optional: Run the Python Agent

The root `npm run dev` flow does **not** boot the Python agent. To run the leads agent manually:

```bash
cd apps/agent
python -m venv .venv
. .venv/bin/activate
pip install -e .
langgraph dev --port 8133
```

On Windows PowerShell, activate the virtualenv with:

```powershell
.venv\Scripts\Activate.ps1
```

If you use a different port or host, update `LANGGRAPH_DEPLOYMENT_URL` in `.env`.

## Workspace Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts frontend + BFF |
| `npm run dev:full` | Starts frontend + BFF + MCP server |
| `npm run dev:ui` | Starts only the Next.js frontend |
| `npm run dev:bff` | Starts only the BFF |
| `npm run dev:mcp` | Starts only the MCP server |
| `npm run build` | Builds the frontend workspace |
| `npm run start` | Starts the built frontend |
| `npm run lint` | Runs frontend linting |

## Environment Variables

See [`.env.example`](.env.example) for the full list. The most relevant variables are:

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes* | frontend API routes, optional agent | Main Gemini key |
| `GOOGLE_GEMINI_API_KEY` | Yes* | frontend live-token route | Alternate key name accepted by the voice flow |
| `GEMINI_LIVE_MODEL` | No | `/shop` | Defaults to `gemini-3.1-flash-live-preview` |
| `NEXT_PUBLIC_GEMINI_LIVE_VOICE_NAME` | No | `/shop` | Defaults to `Puck` |
| `NEXT_PUBLIC_GEMINI_LIVE_LANGUAGE_CODE` | No | `/shop` | Defaults to `pt-BR` |
| `NEXT_PUBLIC_GEMINI_WAKE_WORDS` | No | `/shop` | Comma-separated wake words |
| `LANGGRAPH_DEPLOYMENT_URL` | Optional | BFF | Required when using the Python agent |
| `MCP_SERVER_URL` | Optional | BFF | Defaults to local MCP URL |
| `COPILOTKIT_LICENSE_TOKEN` | Optional | threads / intelligence | Needed for persistent CopilotKit thread features |
| `NOTION_TOKEN` | Optional | agent | Needed for live Notion-backed lead workflows |
| `NOTION_LEADS_DATABASE_ID` | Optional | agent | Leads database to query/update |

\* At least one Gemini key must be configured for the voice demo to work.

## Voice Demo Notes

The `/shop` demo supports:

- wake-word recognition using browser speech recognition
- Gemini Live audio responses via ephemeral tokens
- configurable voice, language, and wake words from `.env`
- tool-driven actions such as search, open details, add to cart, and view cart
- a built-in troubleshoot panel for inspecting the live voice conversation

Example prompts:

- `"Isaac, show me Samsung phones"`
- `"Isaac, open the details for this product"`
- `"Isaac, add this to my cart"`
- `"Isaac, open my cart"`

## MCP App

The `apps/mcp` workspace exposes demo tools and widgets for the leads experience, including:

- `show-lead-list`
- `show-lead-demand`
- `show-lead-pipeline`
- `show-canvas-dashboard`
- `show-email-draft`
- `post-email-comment`

Run it locally with:

```bash
npm run dev:mcp
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Sonner
- **Voice / AI:** Google Gemini Live, `@google/genai`, Web Speech API
- **Lead canvas:** CopilotKit v2, custom frontend tools, generative UI patterns
- **BFF:** Hono + `@copilotkit/runtime`
- **Agent:** LangGraph, Deep Agents, Python 3.11+
- **MCP:** `mcp-use` with widget-based UI resources

## Additional Docs

- [`dev-docs/README.md`](dev-docs/README.md)
- [`apps/agent/README.md`](apps/agent/README.md)
- [`data/notion-leads-sample/README.md`](data/notion-leads-sample/README.md)

## License

MIT
