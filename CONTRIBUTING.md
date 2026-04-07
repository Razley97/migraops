# Contributing to MigraOps

## GitFlow

We follow GitFlow with two permanent branches:

- `main` — Production-ready code (protected, requires PR)
- `dev` — Integration branch (default, requires PR from feature/*)

### Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<name>` | `feature/security-hardening` |
| Hotfix | `hotfix/<description>` | `hotfix/fix-api-timeout` |
| Release | `release/v<semver>` | `release/v5.1.0` |

### Workflow

```bash
# 1. Create feature branch from dev
git checkout dev && git pull
git checkout -b feature/my-feature

# 2. Work on feature, commit often
git commit -m "feat: add new feature"

# 3. Push and create PR to dev
git push -u origin feature/my-feature
gh pr create --base dev

# 4. After review and merge, delete feature branch
git branch -d feature/my-feature
```

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, deps |

### Examples

```
feat(backend): add rate limiting to GitHub proxy
fix(frontend): resolve dark mode toggle persistence
docs: update API endpoint documentation
chore(deps): upgrade Express to v5
```

## Development Setup

```bash
# Prerequisites: Node.js 22+ (see .nvmrc)
nvm use

# Install all dependencies
npm run install:all

# Start development servers
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001

# Run tests
cd frontend && npm test
```

## Code Review Checklist

- [ ] Code follows existing patterns in the codebase
- [ ] No console.log left in production code
- [ ] No hardcoded secrets or API keys
- [ ] Error handling is appropriate
- [ ] Tests added/updated for new functionality
- [ ] i18n keys added for user-facing strings
