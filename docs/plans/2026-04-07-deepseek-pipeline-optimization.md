# Plan: DeepSeek Pipeline Optimization — Speed & Quality Fix

## Context

La migración con DeepSeek presenta dos problemas críticos:
1. **Resultado incorrecto** — el código migrado no es correcto
2. **Pipeline demasiado lento** — Phase A tarda ~6 min, timeout a 20 min sin completar

### Root Cause Analysis

| Causa | Impacto Velocidad | Impacto Calidad |
|-------|-------------------|-----------------|
| Full code context enviado (sin compresión para "standard" tier) | HIGH — llena 50-80% del contexto 65K | HIGH — menos espacio para razonamiento |
| 10-12 API calls por archivo | HIGH — 3-12 min total | LOW |
| max_tokens escalado a 16K pero DeepSeek soporta max 8192 | MEDIUM — retries silenciosos inútiles | HIGH — output truncado |
| Agent chain (security) agrega 2-4 calls extra | MEDIUM — duplica fases A y C | LOW |
| C/D loop 2 iteraciones sin importar modelo | MEDIUM — duplica validación | LOW |
| Phase E (Virtual QA) para non-Claude | MEDIUM — 2 calls extra | LOW |

### Métricas Actuales vs Target

| Métrica | Actual (DeepSeek) | Target |
|---------|-------------------|--------|
| API calls (1 archivo) | 10-12 | 5-7 |
| Phase A duration | ~6 min | ~2 min |
| Total pipeline (1 archivo) | >20 min (timeout) | <10 min |
| Output correctness | Truncado/incorrecto | Score >= 70 |

---

## Stories

### Story 1: Respetar maxOutputTokens del provider profile
**Prioridad**: P0 (fix crítico de correctness)
**Archivos**: `frontend/src/services/claudeClient.js`
**LOC**: ~5

**Problema**: El retry loop escala `max_tokens` hasta 16000 pero DeepSeek solo soporta 8192. Esto causa retries inútiles que desperdician tiempo y producen output truncado idéntico.

**Cambios**:
- Línea 42: `defaultMt` usa `profile.maxOutputTokens` en vez de hard-coded
- Línea 60: Cap retry a `profile.maxOutputTokens` en vez de 16000
- Early break cuando `mt` ya está al máximo (retry sería inútil)

```javascript
// ANTES (línea 42):
var defaultMt = mid && (mid.startsWith("deepseek") || mid.startsWith("gemini")) ? 8000 : 4000;

// DESPUÉS:
var defaultMt = Math.min(profile.maxOutputTokens || 8192,
  mid && (mid.startsWith("deepseek") || mid.startsWith("gemini")) ? 8000 : 4000);

// ANTES (línea 60):
mt = Math.min(16000, Math.round((mt || 4000) * 1.5));

// DESPUÉS:
var maxOut = profile.maxOutputTokens || 8192;
var newMt = Math.min(maxOut, Math.round((mt || defaultMt) * 1.5));
if (newMt <= (mt || defaultMt)) break; // ya en el máximo, retry inútil
mt = newMt;
```

**Gherkin**:
```gherkin
Scenario: max_tokens no excede el límite del provider
  Given modelo "deepseek-chat" con maxOutputTokens 8192
  When callClaude recibe stop_reason "max_tokens" y reintenta
  Then max_tokens nunca excede 8192
  And si ya está en 8192, no reintenta (early break)

Scenario: Claude mantiene escalación existente
  Given modelo "claude-sonnet-4-20250514"
  When callClaude recibe stop_reason "max_tokens"
  Then max_tokens puede escalar hasta profile.maxOutputTokens
```

---

### Story 2: Compresión adaptativa para standard tier
**Prioridad**: P0 (fix crítico de correctness + speed)
**Archivos**: `frontend/src/services/migrationPhases.js`
**LOC**: ~20

**Problema**: DeepSeek es tier "standard" pero recibe código completo sin compresión. Con archivos grandes, el 50-80% del contexto de 65K se llena de código, dejando poco espacio para razonamiento.

**Cambios**:
- Nueva función `shouldCompress(files, migFiles, profile)` que evalúa si tokens estimados > 70% del `maxInputTokens` del provider
- Actualizar 7 call sites donde `isFree` gatillaba compresión para también activar con `shouldCompress`
- Escalar chunk budget según `maxInputTokens` del profile (no hard-coded 3000)

```javascript
// Nueva helper (~8 LOC):
function shouldCompress(origFiles, migFiles, profile) {
  var factor = profile.tokenEstimatorFactor || 4.0;
  var totalTokens = (origFiles || []).reduce(function(s, f) {
    return s + estimateTokens(f.content || f.migrated || "", factor);
  }, 0) + (migFiles || []).reduce(function(s, f) {
    return s + estimateTokens(f.migrated || f.content || "", factor);
  }, 0);
  return totalTokens > (profile.maxInputTokens || 65536) * 0.7;
}
```

**7 call sites a actualizar** (líneas 181, 507, 536, 588, 659, 701, 738):
```javascript
// ANTES:
var origManifest = buildManifest(origFiles, isFree ? { mode: "contracts", lang: sl } : {});

// DESPUÉS:
var needsCompression = isFree || shouldCompress(origFiles, migratedResults, profile);
var origManifest = buildManifest(origFiles, needsCompression ? { mode: "contracts", lang: sl } : {});
```

**Gherkin**:
```gherkin
Scenario: DeepSeek con codebase grande activa compresión
  Given modelo "deepseek-chat" con maxInputTokens 65536
  And codebase de 5 archivos totalizando 180KB (~45K tokens)
  When Phase A construye el manifest
  Then usa mode "contracts" (compresión semántica)

Scenario: DeepSeek con codebase pequeño no comprime
  Given modelo "deepseek-chat"
  And codebase de 2 archivos totalizando 40KB (~10K tokens)
  When Phase A construye el manifest
  Then usa código completo sin compresión

Scenario: Claude nunca activa compresión adaptativa
  Given modelo "claude-sonnet-4-20250514" con maxInputTokens 200000
  And codebase de 5 archivos totalizando 180KB
  When Phase A construye el manifest
  Then usa código completo (180KB << 70% de 200K)
```

---

### Story 3: Skip agent chain para non-Claude
**Prioridad**: P1 (speed optimization)
**Archivos**: `frontend/src/services/pipeline.js`
**LOC**: ~4

**Problema**: Phase A y Phase C usan `callAgentChain` con 2 agentes (architect→security, qa→security). El segundo agente (security) duplica las API calls sin agregar valor proporcional para DeepSeek.

**Cambios**:
- Línea 204: `useChain: getBudgetTier(mod) === "full"` (Phase A)
- Línea 548: `useChain: getBudgetTier(mod) === "full"` (Phase C)
- Agregar import de `getBudgetTier` de budgetTier.js

```javascript
// ANTES (línea 204):
{ useChain: true, onAgentChange: ... }

// DESPUÉS:
{ useChain: getBudgetTier(mod) === "full", onAgentChange: ... }
```

**Ahorro**: 2-4 API calls eliminados (1 en Phase A + 1 por iteración de Phase C)

**Gherkin**:
```gherkin
Scenario: DeepSeek Phase A ejecuta solo 1 agente
  Given modelo "deepseek-chat" (tier "standard")
  When Phase A ejecuta
  Then solo el agente "architect" es llamado (1 API call)
  And el agente "security" es omitido

Scenario: Claude mantiene chain completo
  Given modelo "claude-sonnet-4-20250514" (tier "full")
  When Phase A ejecuta
  Then ambos agentes se ejecutan (architect → security = 2 calls)
```

---

### Story 4: Reducir iteraciones C/D y skip Phase E
**Prioridad**: P1 (speed optimization)
**Archivos**: `frontend/src/services/pipeline.js`
**LOC**: ~3

**Problema**: El loop C/D ejecuta 2 iteraciones y Phase E (Virtual QA) corre para todos los tiers. Para DeepSeek esto agrega 4-6 API calls innecesarios.

**Cambios**:
- Línea 528: `INT_MAX = getBudgetTier(mod) === "full" ? 2 : 1`
- Línea 648: Gate Phase E con `getBudgetTier(mod) === "full"`

```javascript
// ANTES (línea 528):
var INT_PASS = 90, INT_MAX = 2;

// DESPUÉS:
var INT_PASS = 90;
var INT_MAX = getBudgetTier(mod) === "full" ? 2 : 1;

// ANTES (línea 648):
if (!emit.cancelRef.current) {

// DESPUÉS:
if (!emit.cancelRef.current && getBudgetTier(mod) === "full") {
```

**Ahorro**: 2-4 API calls (1 iteration C/D + 2 Phase E)

**Gherkin**:
```gherkin
Scenario: DeepSeek ejecuta máximo 1 iteración C/D
  Given modelo "deepseek-chat"
  When Phase C/D loop comienza
  Then INT_MAX es 1
  And máximo 1 check + 1 fix se ejecuta

Scenario: DeepSeek omite Phase E (Virtual QA)
  Given modelo "deepseek-chat"
  When el pipeline llega a Phase E
  Then Phase E es omitida
  And 2 API calls son ahorrados
```

---

### Story 5: Tests de optimización DeepSeek
**Prioridad**: P1
**Archivos**: `frontend/src/__tests__/deepseekOptimization.test.js`
**LOC**: ~80

**Tests**:
- `callClaude` max_tokens cap respeta profile.maxOutputTokens (~3 tests)
- `callClaude` early break cuando mt ya está al máximo (~1 test)
- `shouldCompress()` activa para standard tier con input grande (~3 tests)
- `shouldCompress()` no activa para Claude con mismo input (~1 test)
- `useChain` es false para non-full tier (~2 tests)
- `INT_MAX` es 1 para standard tier (~1 test)
- Phase E gated por full tier (~1 test)
- Existing tests siguen pasando (regresión check)

---

## Files Summary

| Archivo | Cambio | Story | LOC |
|---------|--------|-------|-----|
| `frontend/src/services/claudeClient.js` | maxOutputTokens cap + early break | S1 | ~5 |
| `frontend/src/services/migrationPhases.js` | shouldCompress() + 7 call sites | S2 | ~20 |
| `frontend/src/services/pipeline.js` | useChain gate + INT_MAX + Phase E gate | S3,S4 | ~7 |
| `frontend/src/__tests__/deepseekOptimization.test.js` | Tests nuevos | S5 | ~80 |
| **Total** | 4 archivos | 5 stories | **~112 LOC** |

---

## Orden de Implementación

```
S1 (maxOutputTokens cap) → S2 (compresión adaptativa) → S3 (skip chain) → S4 (C/D + Phase E) → S5 (tests)
```

S1 primero porque es la causa directa de output truncado (correctness). S2 en paralelo porque ataca la otra causa de calidad. S3 y S4 son optimizaciones de velocidad. S5 al final para verificar todo.

---

## Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| API calls (1 archivo) | 10-12 | 5-7 | -40-45% |
| Phase A (1 archivo) | ~6 min | ~2 min | -66% |
| Total pipeline (1 archivo) | >20 min | ~8-10 min | -50% |
| Output correctness | Truncado | Score >= 70 | Fix |
| max_tokens waste (retries inútiles) | 2-3 calls | 0 | -100% |

---

## Verificación

1. **Build**: `npm run build` sin errores
2. **Tests**: 152 existentes + ~12 nuevos pasan
3. **Manual con DeepSeek**: Migrar REST API test project (JS→Python)
   - Verificar Phase A < 3 min
   - Verificar total pipeline < 12 min
   - Verificar score >= 70
   - Verificar no hay truncaciones (no `stop_reason: max_tokens` loops inútiles)
4. **Manual con Claude**: Comportamiento sin cambios
5. **Manual con Gemini**: Comportamiento sin cambios (ya es free tier)

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Contract extraction pierde lógica compleja en bodies | HIGH | Retry con full source si score < 60 |
| Cap 8192 trunca archivos grandes | HIGH | Log warning cuando mt = maxOutputTokens; considerar file splitting |
| Skip security chain pierde findings | MEDIUM | Campos opcionales con fallback; ya no se asume securityNotes existe |
| INT_MAX=1 produce scores más bajos | MEDIUM | Aceptar 1 iteración si score >= 80 o sin critical/major issues |
