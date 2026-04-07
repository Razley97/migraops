# MigraOps v5.0 — AI-Powered Code Migration Platform

![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Version](https://img.shields.io/badge/version-5.0.0-blue)
![Tests](https://img.shields.io/badge/tests-60%20passing-brightgreen)

> **SII Group Chile** · AI-assisted code migration between languages and versions

## Features

- **AI Migration Engine** — Powered by Anthropic Claude with 8 virtual agents (Architect, Developer, QA, Security, Reviewer, Android, FullStack, DevOps)
- **Multi-agent Pipeline** — Chain pattern for codebase analysis, migration, consolidation, and review
- **Visual QA** — Playwright-based screenshot capture, DOM diff, and pixel matching
- **GitHub Integration** — Import repos, browse branches, select files
- **Multi-turn Chat** — Conversational migration with SSE streaming
- **i18n** — Spanish, English, Portuguese
- **Dark/Light Theme** — Persistent user preference
- **PDF Reports** — Exportable migration results

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | 18.3.1 / 5.4.x |
| Backend | Express + Node.js | 4.19.x / 22.x |
| AI Engine | Anthropic Claude API | Sonnet 4 |
| Testing | Vitest | 4.1.x |
| Visual QA | Playwright | 1.49.x |
| Containers | Docker Compose | 3.8 |

## Prerequisites

- **Node.js** >= 22.0.0 (see `.nvmrc`)
- **Anthropic API Key** — [console.anthropic.com](https://console.anthropic.com)
- **GitHub Token** (optional) — for repo imports

## Quick Start

```bash
# Clone
git clone https://github.com/Razley97/migraops.git
cd migraops

# Use correct Node version
nvm use

# Install all dependencies
npm run install:all

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Start development
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional
GITHUB_TOKEN=ghp_xxxxx
PORT=3001
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=30
```

## Project Structure

```
migraops/
├── frontend/                    # React 18 SPA
│   ├── src/
│   │   ├── App.jsx              # Root component
│   │   ├── components/          # UI components
│   │   │   ├── chat/            #   Chat interface (ChatView, ChatMessage, ChatInput)
│   │   │   ├── github/          #   GitHub panel (repo import)
│   │   │   ├── ConfigureView    #   Migration config
│   │   │   ├── DashboardView    #   Stats dashboard
│   │   │   ├── HistoryView      #   Migration history
│   │   │   ├── MigratingView    #   Live migration progress
│   │   │   ├── ResultsView      #   Migration results + diff
│   │   │   ├── UploadView       #   File upload
│   │   │   └── Sidebar          #   Navigation
│   │   ├── config/              # Languages, models, themes, paradigm maps
│   │   ├── data/                # Agent registry (8 agents)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── i18n/                # Translations (ES/EN/PT)
│   │   ├── lib/                 # Visual QA store
│   │   ├── services/            # Business logic
│   │   │   ├── pipeline.js      #   Migration orchestration
│   │   │   ├── migrationPhases  #   Pipeline phase definitions
│   │   │   ├── claudeClient     #   Anthropic API wrapper
│   │   │   ├── agentClient      #   Agent middleware
│   │   │   ├── qaSandbox        #   QA code execution
│   │   │   └── ...              #   Reports, utils, Playwright
│   │   └── __tests__/           # Unit tests (60 tests)
│   └── vite.config.js           # Vite + proxy config
│
├── backend/                     # Express API server
│   ├── server.js                # Entry point
│   ├── routes/
│   │   ├── migrate.js           # POST /api/migrate (Claude proxy)
│   │   ├── conversation.js      # Multi-turn chat (SSE)
│   │   ├── github.js            # GitHub API proxy
│   │   ├── health.js            # GET /api/health
│   │   └── playwright.js        # Visual capture + compare
│   ├── services/
│   │   ├── claudeStream.js      # SSE streaming
│   │   ├── sessionStore.js      # In-memory sessions (2h TTL)
│   │   └── playwrightCapture.js # Browser automation
│   └── middleware/
│       └── rateLimit.js         # 30 req/min
│
├── docker/                      # Container config
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
│
├── docs/                        # Documentation
│   ├── MIGRATION_KNOWLEDGE_BASE.md
│   └── plans/
│
├── .env.example                 # Environment template
├── .nvmrc                       # Node 22
├── .editorconfig                # Editor consistency
├── CONTRIBUTING.md              # Contribution guide
├── CHANGELOG.md                 # Version history
└── LICENSE                      # Proprietary (SII Group Chile)
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend in parallel |
| `npm run dev:frontend` | Frontend only (Vite, port 5173) |
| `npm run dev:backend` | Backend only (Express, port 3001) |
| `npm run build` | Production build (frontend) |
| `npm start` | Start backend in production |
| `npm run install:all` | Install all dependencies |
| `cd frontend && npm test` | Run unit tests (Vitest) |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│   Backend    │────▶│  Anthropic API  │
│  React SPA   │     │   Express    │     │  Claude Sonnet   │
│  :5173       │     │   :3001      │     │                  │
└─────────────┘     ├──────────────┤     └─────────────────┘
                    │  /api/migrate │
                    │  /api/convo   │────▶ SSE Streaming
                    │  /api/github  │────▶ GitHub API
                    │  /api/health  │
                    │  /api/pw      │────▶ Playwright
                    └──────────────┘
```

### Virtual Agent System

| Agent | Role | Pipeline Phases |
|-------|------|----------------|
| Architect | Dependency analysis, migration ordering | codebaseAnalysis, filePlan |
| Developer | Code translation, API mapping | migrate, consolidation, fixPlan |
| QA | Correctness, integration testing | integrationCheck, deepAnalysis, review |
| Security | Vulnerability detection, OWASP | securityReview |
| Reviewer | Best practices, consistency | dependencyAudit |
| Android | Android SDK, Jetpack migration | androidReport |

## Docker

```bash
cd docker
docker compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ANTHROPIC_API_KEY missing` | Copy `.env.example` to `.env` and add your key |
| Frontend can't reach backend | Check Vite proxy in `vite.config.js` (target: localhost:3001) |
| Port 3001 already in use | Change `PORT` in `.env` or kill the process |
| `npm run dev` fails | Run `npm run install:all` first |
| Tests fail | Run `cd frontend && npm install` then `npm test` |
| Rate limited (429) | Wait 60s or increase `RATE_LIMIT_MAX_REQUESTS` in `.env` |

## GitFlow

```
main          ← Production (protected, tagged releases)
  └── dev     ← Integration (default branch)
        └── feature/*   ← Development
        └── hotfix/*    ← Urgent fixes
        └── release/*   ← Release candidates
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Proprietary. Copyright (c) 2026 SII Group Chile. All Rights Reserved.
See [LICENSE](LICENSE) for details.
