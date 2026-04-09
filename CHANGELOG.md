# Changelog

All notable changes to MigraOps will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [5.0.0] - 2026-03-19

### Added
- AI-powered code migration platform with React 18 + Express 4
- Virtual agent system (8 agents: Architect, Developer, QA, Security, Reviewer, Android, FullStack, DevOps)
- Multi-agent chain pattern for codebase analysis
- Visual QA system with Playwright (screenshot capture, DOM diff, pixel matching)
- Multi-turn conversation with SSE streaming
- GitHub integration (repo import, branch browsing, file content)
- Internationalization support (ES/EN/PT)
- Dark/Light theme with persistence
- Migration pipeline: upload → configure → migrate → results
- PDF report export
- Dashboard with migration history and statistics
- Keyboard shortcuts (D: dark mode, 1-4: views, Escape: close)
- Docker support (docker-compose.yml, Dockerfiles)
- Rate limiting (30 req/min global, 10 req/min Playwright)
- Security: CORS, body limit 2MB, anti-injection in Playwright

### Technical Stack
- Frontend: React 18.3.1, Vite 5.4, Vitest 4.1
- Backend: Express 4.19, Node.js 22
- AI: Anthropic Claude Sonnet 4
- Testing: 60 unit tests passing
