# Plan: Free-Tier Adaptive Resilience Layer

**Fecha:** 2026-04-07
**Feature:** Mejora integral de integración de modelos free-tier
**Branch:** `feature/free-tier-resilience`
**Autor:** Juan Ramírez + Claude Opus 4.6

---

## Resumen Ejecutivo

Los modelos gratuitos (Gemini, Groq/Llama, Gemma, Mixtral) tienen rate limits agresivos (15-30 RPM, TPM limitado). La integración actual funciona pero es frágil: retry cuadrático sin coordinación, compresión por truncamiento que pierde contratos cross-file, y cero validación de calidad para output de modelos free.

Este plan introduce un **Adaptive Resilience Layer** con 6 componentes nuevos organizados en 3 fases incrementales.

---

## Problema

1. **Retry cuadrático**: `callClaude(999 retries) × wrapPhase(infinite)` = bloqueo potencialmente infinito
2. **Compresión ciega**: `compressContent(maxLines)` trunca las primeras N líneas, perdiendo exports/signatures al final del archivo
3. **QA all-or-nothing**: `shouldRunInlineQA()` retorna `false` para free-tier — los modelos más débiles no reciben ninguna validación
4. **Token estimation incorrecta**: `Math.ceil(len/4)` subestima para código con mucha puntuación
5. **Rate limit backend global**: 120 RPM compartido entre todos los providers, no protege API keys individuales
6. **0 tests** para componentes free-tier (retry, chunking, compresión, throttle)

---

## Arquitectura Propuesta

```
                    providerProfiles.js (DATA)
                   /        |          \
          tokenBucket    circuitBreaker.js  contractExtractor.js
          (future)       /                         |
                claudeClient.js              migrationPhases.js
                        \                    /
                         pipeline.js
                             |
                      liteValidator.js
```

---

## Fase 1 — Fundamentos (P0)

### 1.1 Provider Profiles Registry

**Archivo nuevo:** `frontend/src/config/providerProfiles.js`

Registry centralizado de capacidades y límites por provider:

```
ProviderProfile {
  id: "gemini" | "groq" | "deepseek" | "anthropic"
  rpm: number           // requests per minute
  tpm: number           // tokens per minute (0 = unlimited)
  maxInputTokens: number
  maxOutputTokens: number
  tokenEstimatorFactor: number  // chars per token (reemplaza el 4 fijo)
  throttleMs: number    // min gap entre requests
  retryConfig: { maxRetries, baseBackoff, maxBackoff }
  circuitBreaker: { failureThreshold, openDuration }
}
```

**Profiles:**

| Provider | RPM | TPM | maxInput | tokenFactor | throttle | maxRetries |
|----------|-----|-----|----------|-------------|----------|------------|
| gemini | 15 | 4M | 1M | 3.5 | 4500ms | 10 |
| groq | 30 | 15K | 32K | 3.8 | 2200ms | 10 |
| deepseek | 60 | — | 64K | 4.0 | 500ms | 5 |
| anthropic | 1000 | — | 200K | 4.0 | 0ms | 1 |

**Impacto:** Reemplaza `PROVIDER_THROTTLE` hardcoded en `claudeClient.js`, `maxRetries` ternarios, y `maxLines` dispersos.

### 1.2 Circuit Breaker

**Archivo nuevo:** `frontend/src/services/circuitBreaker.js`

Tres estados clásicos: CLOSED → OPEN → HALF_OPEN → CLOSED

```
canCall(provider) → boolean
recordSuccess(provider)
recordFailure(provider, statusCode)
getState(provider) → { state, failCount, nextRetryAt }
```

**Reglas:**
- Solo errores 5xx y timeouts abren circuito (429 NO — es rate limiting esperado)
- `failureThreshold`: 5 fallos consecutivos 5xx
- `openDuration`: 120s, crece con cada ciclo (120s → 240s → 480s, max 600s)
- HALF_OPEN: permite 1 request de prueba

**Integración con `callClaude`:** Antes de cada fetch, consulta `canCall(provider)`. Si OPEN, lanza error inmediato con tiempo restante.

### 1.3 Unificar Retry

**Archivos modificados:** `claudeClient.js`, `pipeline.js`

**Antes:**
- `callClaude`: 999 retries, backoff 8s→600s
- `wrapPhase`: while(true), backoff 30s→60s
- Total teórico: infinito × infinito

**Después:**
- `callClaude`: maxRetries desde ProviderProfile (5-10), backoff 8s→120s
- `wrapPhase`: máximo 5 retries, backoff 30s→60s
- Circuit breaker corta si hay fallos 5xx sostenidos
- Total máximo por fase: ~15 min worst case

**Coordinación:** callClaude maneja retry de transporte (429, 503, timeout). wrapPhase maneja retry de lógica (JSON inválido, respuesta incompleta). No se solapan.

---

## Fase 2 — Calidad (P1)

### 2.1 Contract Extractor

**Archivo nuevo:** `frontend/src/services/contractExtractor.js`

Reemplaza `compressContent(content, maxLines)` para fases cross-file.

```
extractContracts(code, lang) → {
  imports: string[]     // todas las líneas de import/require/using
  exports: string[]     // export declarations, module.exports, public class
  signatures: string[]  // function/method signatures (sin cuerpo)
  types: string[]       // interface, type, struct, enum declarations
  raw: string           // primeras 20 líneas como contexto adicional
}
```

**Regex patterns por familia de lenguaje:**
- JS/TS: `import`, `export`, `function`, `class`, `interface`, `type`
- Python: `import`, `from`, `def`, `class`
- Java/Kotlin/C#: `import`, `using`, `public`, `private`, `class`, `interface`
- Go: `import`, `func`, `type`, `struct`

**Uso en `buildManifest`:** Nuevo modo `{ mode: "contracts" }` que usa `extractContracts` en vez de `compressContent`. Fases B2a, B2b, C, D usan este modo para free-tier.

**Fallback:** Si el extractor no reconoce el lenguaje, cae a `compressContent(content, 80)`.

### 2.2 Lite Validator (QA sin API)

**Archivo nuevo:** `frontend/src/services/liteValidator.js`

Validación heurística post-migración sin llamada API:

```
validateLite(original, migrated, sourceLang, targetLang) → {
  ok: boolean,
  pass: boolean,
  score: number,        // 0-100
  issues: Issue[],
  lite: true             // marca para distinguir de QA completo
}
```

**Verificaciones:**

1. **Structural** (30 puntos):
   - Balance de brackets/braces/parentesis
   - Ratio de líneas migrado/original (0.3-3.0 es razonable)
   - Detección de truncamiento (código termina en medio de función)

2. **Semantic** (40 puntos):
   - Conteo de funciones públicas: original vs migrado (±20% tolerable)
   - Presencia de imports (al menos 80% de los del original)
   - Ausencia de placeholders (`// TODO`, `// rest of code`, `pass`)

3. **Language** (30 puntos):
   - Keywords del source language NO deben aparecer en target
   - Keywords del target language DEBEN aparecer
   - Convenciones de naming (camelCase vs snake_case según target)

**Integración en pipeline:** Se ejecuta para TODOS los tiers como primer filtro después de `doMigrate`. Si `score < 40`, marca como `pass: false` y genera feedback para re-migración (reutiliza `formatQAFeedback`).

**Para full-tier:** Se ejecuta lite ANTES del inline QA API. Si lite pasa, inline QA confirma. Si lite falla, se re-migra sin gastar una llamada de QA.

---

## Fase 3 — Optimización (P2-P3)

### 3.1 Token Estimation Mejorada

**Archivo modificado:** `migrationPhases.js`

```
// ANTES:
estimateTokens(text) = Math.ceil(text.length / 4)

// DESPUÉS:
estimateTokens(text, provider) {
  var factor = getProfile(provider).tokenEstimatorFactor || 4;
  var margin = 1.15; // 15% safety margin
  return Math.ceil(text.length / factor * margin);
}
```

### 3.2 Rate Limit Backend Per-Provider

**Archivo nuevo:** `backend/middleware/providerRateLimit.js`

Token bucket per-provider que retorna `429 + Retry-After` cuando el bucket está vacío:

| Provider | RPM permitido | Burst |
|----------|--------------|-------|
| gemini | 12 (80% de 15) | 3 |
| groq | 25 (83% de 30) | 5 |
| deepseek | 50 | 10 |
| anthropic | 100 | 20 |

Se aplica ANTES del proxy al provider externo.

### 3.3 Tests Unitarios Free-Tier

**~40 tests nuevos:**

| Módulo | Tests | Prioridad |
|--------|-------|-----------|
| `providerProfiles` | 5 — profiles existen, campos válidos | P0 |
| `circuitBreaker` | 8 — estados, transiciones, reset, per-provider | P0 |
| `callClaude` retry | 10 — backoff, cancel, circuit breaker, retry-after | P0 |
| `contractExtractor` | 8 — JS/Python/Java, fallback, edge cases | P1 |
| `liteValidator` | 10 — score, brackets, truncation, keywords | P1 |
| `wrapPhase` | 5 — retry, cancel, error propagation | P1 |

**Prerequisito:** Exportar `estimateTokens`, `chunkFilesByTokens`, `compressContent`, `buildManifest` desde `migrationPhases.js` (o extraer a `freeTierHelpers.js`).

---

## Archivos Summary

### Nuevos (5)

| Archivo | Responsabilidad | LOC est. |
|---------|----------------|----------|
| `frontend/src/config/providerProfiles.js` | Registry de límites por provider | ~50 |
| `frontend/src/services/circuitBreaker.js` | Circuit breaker per-provider | ~60 |
| `frontend/src/services/contractExtractor.js` | Extrae imports/exports/signatures | ~80 |
| `frontend/src/services/liteValidator.js` | QA heurístico sin API | ~100 |
| `backend/middleware/providerRateLimit.js` | Rate limit per-provider | ~40 |

### Modificados (4)

| Archivo | Cambio |
|---------|--------|
| `claudeClient.js` | Usa providerProfiles, circuit breaker, retry acotado |
| `pipeline.js` | wrapPhase con retry limitado, integra liteValidator |
| `migrationPhases.js` | buildManifest con modo "contracts", estimateTokens mejorado |
| `budgetTier.js` | Nuevo `shouldRunLiteQA()` (retorna true para todos los tiers) |

---

## Orden de Implementación

```
Fase 1 (P0):  providerProfiles → circuitBreaker → unificar retry
Fase 2 (P1):  contractExtractor → liteValidator → integrar en pipeline
Fase 3 (P2):  token estimation → backend rate limit → tests
```

Cada fase es deployable independientemente con fallback al comportamiento actual.

---

## Riesgos y Mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Provider cambia límites sin aviso | Alta | Medio | Profiles configurables via env vars |
| Contract extractor falla para lenguaje raro | Media | Bajo | Fallback a compressContent |
| Lite QA genera falsos positivos | Media | Medio | Marcar como "heuristic", threshold conservador (40) |
| Circuit breaker bloquea sin alternativa | Baja | Alto | UI sugiere cambiar de provider |

---

## Métricas de Éxito

1. **Tasa de fases saltadas** con free-tier: de ~30% actual → <5%
2. **Score promedio** de migraciones free-tier: de ~50 → >65
3. **Tiempo máximo por fase**: de infinito → <15 min
4. **Cobertura de tests** free-tier: de 0% → >80%

---

*Plan generado por análisis multi-agente: @architect + @developer + @security + @qa*
*Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>*
