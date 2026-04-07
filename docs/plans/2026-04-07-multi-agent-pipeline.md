# Plan: Sistema Multi-Agente en Pipeline de Migracion

**Fecha:** 2026-04-07
**Feature:** Inline QA + Security Audit en Phase B/B2
**Branch:** `dev`
**Estado:** Implementado — pendiente de hardening, tests, y merge

---

## 1. Contexto y Objetivo

MigraOps tiene 6 agentes virtuales pero cada fase usa 1-2 agentes en aislamiento. No hay colaboracion intra-fase donde un agente valide el trabajo de otro.

**Objetivo:** Agregar orquestacion multi-agente DENTRO de las fases:
- Phase B: QA agent valida cada archivo migrado, Developer corrige si falla
- Phase B2: Security agent audita el codebase migrado antes de consolidacion

**Budget-aware:** Solo para tier "full" (Claude). Standard/Free no se ven afectados.

---

## 2. Estado Actual (Post-Implementacion)

### Archivos creados (3):
| Archivo | LOC | Funcion |
|---------|-----|---------|
| `frontend/src/services/budgetTier.js` | 42 | `getBudgetTier()`, `shouldRunInlineQA()`, `shouldRunSecurityAudit()` |
| `frontend/src/services/inlineQA.js` | 83 | `doInlineQA()`, `formatQAFeedback()` |
| `frontend/src/services/securityAuditPhase.js` | 63 | `doSecurityAudit()` |

### Archivos modificados (4):
| Archivo | Cambios | Detalle |
|---------|---------|---------|
| `pipeline.js` | +70 LOC | Inline QA loop en Phase B + Security audit en B2 |
| `migrationPhases.js` | +5 LOC | qaFeedback block en doMigrate |
| `agents.js` | +2 phases | QA: `inlineQA`, Security: `securityAudit` |
| `MigratingView.jsx` | +13 LOC | Estados: qa-validating/passed/failed, re-migrating, security |

### Build: PASSING (vite build OK)

---

## 3. Issues Detectados por Arquitecto (Pre-Hardening)

| # | Issue | Severidad | Impacto |
|---|-------|-----------|---------|
| I1 | Triple duplicacion de `isFreeProvider` (pipeline.js, budgetTier.js, claudeClient.js) | HIGH | Bug si se agrega nuevo free provider |
| I2 | `inlineQA.js` retorna `score: 80` en JSON parse failure — score fabricado | MEDIUM | Metricas enganiosas en audit trail |
| I3 | `inlineQA.js` retorna `{ok: true, pass: true, score: 0}` en API error — contradictorio | MEDIUM | Datos inconsistentes |
| I4 | Security audit prompt escala mal con N archivos (N * 2000 chars) | MEDIUM | Review incompleto en migraciones >10 files |
| I5 | Security audit failure silenciosa (no emite log) | LOW | Usuario no sabe que fallo |
| I6 | Nuevas fases no contribuyen a `_tks` token tracking | LOW | Costo subestimado |

---

## 4. Plan de Ejecucion — Steps Ordenados

### Step 1: Hardening — Fix Issues Arquitectonicos
**Skill:** Manual / `@developer`
**Tiempo estimado:** 15-20 min
**Archivos:** 4

#### 1a. Centralizar `isFreeProvider` (I1)
- `pipeline.js`: Eliminar funcion local `isFreeProvider`, importar de `budgetTier.js`
- `budgetTier.js`: Ya exporta `isFreeProvider()` — no cambios
- Verificar que `claudeClient.js` no necesita la misma funcion (es inline, no exportada)

#### 1b. Fix error handling en `inlineQA.js` (I2, I3)
- JSON parse failure: cambiar `score: 80` a `score: -1` (sentinel), mantener `pass: true`
- API error: cambiar `score: 0` a `score: -1`, agregar `skipped: true`
- Pipeline.js ya maneja `qaResult.skipped` — verificar

#### 1c. Security audit logging (I5)
- En `pipeline.js`, despues del bloque security audit, agregar log entry si `!secResult.ok`:
  ```js
  if (!secResult || !secResult.ok) {
    emit.setLogs(function(p) { return p.concat([{ type: "phase", phase: "consolidation", subPhase: "security", st: "error", ts: Date.now() }]); });
  }
  ```

#### 1d. Security audit file cap (I4)
- En `securityAuditPhase.js`: limitar a primeros 8 archivos, agregar nota al prompt
- Reducir truncation de 2000 a 1500 chars/file para mantener presupuesto

---

### Step 2: Tests Unitarios
**Skill:** `@qa` o manual
**Tiempo estimado:** 20-30 min
**Archivos nuevos:** 2-3

#### 2a. `frontend/src/__tests__/budgetTier.test.js`
```
- getBudgetTier("claude-sonnet-4-6") === "full"
- getBudgetTier("deepseek-chat") === "standard"
- getBudgetTier("gemini-2.5-flash") === "free"
- getBudgetTier("llama-3.3-70b") === "free"
- getBudgetTier(null) === "free"
- getBudgetTier("unknown-model") === "standard"
- shouldRunInlineQA("claude-sonnet-4-6") === true
- shouldRunInlineQA("gemini-2.5-flash") === false
- shouldRunSecurityAudit("claude-sonnet-4-6") === true
- shouldRunSecurityAudit("deepseek-chat") === false
```

#### 2b. `frontend/src/__tests__/inlineQA.test.js`
```
- doInlineQA con mock de callAgentById que retorna JSON valido → pass/fail correcto
- doInlineQA con JSON invalido → retorna pass:true, score:-1
- doInlineQA con API error → retorna pass:true, skipped:true
- formatQAFeedback con issues → string formateado correcto
- formatQAFeedback con array vacio → string vacio
- PASS_THRESHOLD es 70: score 70 + 0 critical → pass, score 69 → fail
- Score 80 con 1 critical → fail (critical override)
```

#### 2c. `frontend/src/__tests__/securityAuditPhase.test.js`
```
- doSecurityAudit con mock que retorna findings → ok:true, findings array
- doSecurityAudit con JSON invalido → ok:true, findings:[]
- doSecurityAudit con API error → ok:false, findings:[]
- File truncation: archivos >2000 chars se truncan
- File cap: maximo 8 archivos procesados
```

#### 2d. Actualizar `agents.test.js`
```
- getAgentForPhase("inlineQA") retorna qa agent
- getAgentForPhase("securityAudit") retorna security agent
```

---

### Step 3: Run Tests + Build Verification
**Skill:** `/qa-standard`
**Tiempo estimado:** 5 min

```bash
cd frontend && npm test          # Vitest — todos deben pasar
cd frontend && npm run build     # Vite build — sin errores
```

**Criterios:**
- 0 test failures
- Build sin errores ni warnings nuevos (el chunk size warning pre-existente es OK)
- Cobertura de los 3 nuevos modulos > 80%

---

### Step 4: Code Review
**Skill:** `/code-review`
**Tiempo estimado:** 10 min

**Focus areas:**
- [ ] Dependency direction: nuevos modulos no importan de UI
- [ ] Error handling: consistente entre inlineQA y securityAuditPhase
- [ ] Token budget: no hay leaks ni prompts sin truncation
- [ ] `isFreeProvider` centralizado (post-hardening)
- [ ] UI states: todos los `st` values tienen rendering en MigratingView
- [ ] No secrets, no hardcoded API keys
- [ ] Consistent coding style (`var`, no `const/let` en services)

---

### Step 5: Commit
**Skill:** `/commit`
**Tipo:** `feat(pipeline)`

```
feat(pipeline): multi-agent inline QA and security audit in Phase B/B2

Add budget-aware multi-agent collaboration within migration phases:
- Inline QA validation after each file migration (full tier only)
- Security audit before consolidation (full tier only)
- QA feedback injection for developer retry on failed validation
- New UI states for agent handoff visualization

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Archivos a staged:**
```
frontend/src/services/budgetTier.js          (NEW)
frontend/src/services/inlineQA.js            (NEW)
frontend/src/services/securityAuditPhase.js  (NEW)
frontend/src/services/pipeline.js            (MODIFIED)
frontend/src/services/migrationPhases.js     (MODIFIED)
frontend/src/data/agents.js                  (MODIFIED)
frontend/src/components/MigratingView.jsx    (MODIFIED)
frontend/src/__tests__/budgetTier.test.js    (NEW)
frontend/src/__tests__/inlineQA.test.js      (NEW)
frontend/src/__tests__/securityAuditPhase.test.js (NEW)
```

---

### Step 6: Pull Request
**Skill:** `/pr`

**Title:** `feat(pipeline): multi-agent inline QA + security audit`

**Body:**
```markdown
## Summary
- Budget tier detection (full/standard/free) para controlar features por modelo
- Inline QA validation per-file en Phase B con retry automatico
- Security audit cross-file en Phase B2 antes de consolidacion
- UI states para visualizar handoff entre agentes

## Token Budget Impact
| Tier | Extra calls | Impact |
|------|------------|--------|
| Full (Claude) | +2-4/file + 1 security | +15-20% |
| Standard/Free | 0 | unchanged |

## Test Plan
- [ ] Build passing (`npm run build`)
- [ ] Unit tests passing (budgetTier, inlineQA, securityAudit)
- [ ] Full tier: migrar 2 archivos JS→TS con Claude, verificar QA inline aparece
- [ ] Free tier: migrar con Gemini, verificar que NO aparecen fases QA/security
- [ ] Cancelacion mid-QA funciona correctamente
- [ ] QA retorna JSON invalido → pipeline continua sin retry
```

---

## 5. Orden de Skills del Framework

```
/plan-feature  ← ESTAMOS AQUI (generando este documento)
     ↓
  Hardening manual (Step 1)
     ↓
  Tests manuales (Step 2)
     ↓
  /qa-standard   (Step 3 — validacion)
     ↓
  /code-review   (Step 4 — revision)
     ↓
  /commit        (Step 5 — commit)
     ↓
  /pr            (Step 6 — pull request)
```

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| QA inline agrega latencia perceptible | Media | Solo full tier; QA timeout 45s; no bloquea en error |
| Security audit incompleto en proyectos grandes | Baja | File cap de 8; truncation a 1500 chars |
| Free tier futuro quiere QA inline | Baja | `shouldRunInlineQA()` es el unico gate — facil de relajar |
| Token cost increase > 20% | Baja | QA inline atrapa errores que reducirian Phase C/D iterations |

---

## 7. Acceptance Criteria

- [ ] `npm run build` sin errores
- [ ] `npm test` — 0 failures, tests nuevos incluidos
- [ ] Migracion con Claude muestra badge de agente cambiando: developer → qa → developer
- [ ] Migracion con Gemini NO muestra fases QA inline ni security audit
- [ ] Audit trail muestra fases `B-inlineQA-*` y `B2-sec`
- [ ] `apiCalls` para full tier es 3-4 per file (plan + migrate + qa [+ retry])
- [ ] Gates siguen funcionando post-QA
- [ ] Cancelacion funciona mid-QA validation
