# MigraOps v5.0 — AI-Powered Code Migration Platform

> **SII Group Chile** · Code Intelligence Platform

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js + Express 4 |
| AI Engine | Anthropic Claude API (Sonnet/Opus) |
| Gráficos | SVG nativo + d3-force |

## Requisitos

- **Node.js** >= 18.0.0
- **API Key de Anthropic** (https://console.anthropic.com)
- **GitHub Token** (opcional, para importar repos)

## Instalación

```bash
git clone https://github.com/tu-org/migraops.git
cd migraops
npm run install:all
cp .env.example .env    # Editar con tu ANTHROPIC_API_KEY
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## Variables de Entorno (.env)

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx        # REQUERIDO
GITHUB_TOKEN=ghp_xxxxx               # Opcional
FRONTEND_URL=http://localhost:5173    # Opcional
PORT=3001                             # Opcional
```

## Estructura

```
migraops/
├── frontend/src/
│   ├── App.jsx         # Componente principal
│   ├── main.jsx        # Entry point
│   └── index.css       # Reset CSS
├── backend/
│   ├── server.js       # Entry point servidor
│   ├── routes/
│   │   ├── migrate.js  # Proxy Anthropic Claude API
│   │   ├── github.js   # Proxy GitHub API
│   │   └── health.js   # Health check
│   └── middleware/
│       └── rateLimit.js
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
├── .env.example
└── package.json        # Root scripts
```

## Scripts

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Frontend + backend en paralelo |
| `npm run dev:frontend` | Solo frontend (Vite) |
| `npm run dev:backend` | Solo backend (Express) |
| `npm run build` | Build producción |
| `npm run install:all` | Instala todo |

## Flujo con Claude Code

```bash
# 1. Subir a GitHub
git init && git add . && git commit -m "MigraOps v5.0"
git remote add origin https://github.com/tu-org/migraops.git
git push -u origin main

# 2. Instalar Claude Code
npm install -g @anthropic-ai/claude-code
claude auth login

# 3. Trabajar
cd migraops
claude
> "Refactoriza App.jsx en componentes separados"
> "Agrega tests con Vitest"
```

## Modularización sugerida con Claude Code

```bash
> "Extrae el sidebar a frontend/src/components/Sidebar.jsx"
> "Mueve THEMES a frontend/src/config/themes.js"
> "Separa i18n en frontend/src/i18n/{es,en,pt}.json"
> "Crea useAuditTrail hook en frontend/src/hooks/"
> "Extrae migrationService a frontend/src/services/"
```

## Docker

```bash
cd docker
docker compose up --build
```

## Arquitectura

```
Frontend (React)  ──▶  Backend (Express)  ──▶  Anthropic Claude API
localhost:5173         localhost:3001           api.anthropic.com
                       /api/migrate
                       /api/github     ──▶  GitHub API
                       /api/health
```

## Licencia

Propiedad de SII Group Chile. Uso interno.
