# Plan: Visual Migration Evidence & QA Report System

## Context

MigraOps ya cuenta con un sistema Playwright maduro para captura visual (pre/post screenshots, pixel diff, DOM similarity, interactive QA tests) y generacion de reportes HTML. Sin embargo, la experiencia de usuario para **comparar visualmente el antes/despues** y **descargar evidencia** es basica:

- El diff de codigo es line-level sin granularidad word-level
- Las regiones sin cambios no son colapsables
- La comparacion de screenshots es un grid estatico sin interactividad
- No hay un boton prominente para descargar evidencia combinada
- El reporte descargable no integra codigo + visual + audit trail

## Objetivo

Mejorar la experiencia de evidencia visual de migracion con:
1. Diff de codigo con word-level highlighting y regiones colapsables
2. Comparador de screenshots interactivo (slider drag)
3. Boton de descarga de evidencia combinada (codigo + visual + audit)
4. Cards de evidencia rediseñadas con glassmorphism
5. Score visual integrado al puntaje final

## Arquitectura

### Decision: Client-side download (no backend)
- El `generateVisualQAHTML()` ya existe y produce HTML self-contained
- Backend es BFF/proxy only — no agregar generacion server-side
- Screenshots se resuelven desde IndexedDB via `resolveScreenshots()`
- Download via Blob URL + anchor click

### Decision: Custom diff enhancement (no libreria externa)
- Enhance `mkDiff()` con word-level LCS
- Collapsible regions con threshold configurable
- Synced scroll en split mode
- Alinea con filosofia zero-dependencies del proyecto

### Composite Score Formula (ya existente)
```
finalScore = integrationScore * 0.70 + visualFidelityScore * 0.30
```
Visual fidelity se calcula con 5 dimensiones: Visual Match 40%, DOM Similarity 25%, Functional Parity 20%, Performance Delta 10%, Accessibility Delta 5%.

---

## Stories

### Story 1: Word-Level Diff Highlighting
**Archivo**: `frontend/src/services/utils.js`, `frontend/src/components/ResultsView.jsx`

Extender `mkDiff()` con funcion `wordDiff(oldLine, newLine)` que:
- Tokeniza por palabras/operadores
- Aplica LCS para encontrar segmentos cambiados
- Retorna spans con `{type: "add"|"del"|"same", text}`
- Threshold: lineas >5000 chars caen a line-level diff
- Aplicar en `CodeLine` component para entries tipo "mod"

**AC**:
- [x] Mod lines muestran word-level granularity con colores distintos
- [x] Funciona en split y unified mode
- [x] Fallback a line-level para lineas >5000 chars
- [x] Performance: 1000 lineas en <200ms

**LOC estimado**: ~60

---

### Story 2: Collapsible Unchanged Regions
**Archivo**: `frontend/src/components/ResultsView.jsx`

Agrupar entries consecutivas tipo "same" y colapsar cuando >8 lineas:
- Mostrar 3 lineas de contexto arriba y abajo
- Click expande/colapsa
- Numeros de linea se mantienen correctos
- Funciona en split y unified mode
- Scroll sincronizado en split mode (refs + onScroll mirror)

**AC**:
- [x] >8 lineas consecutivas sin cambios se colapsan
- [x] 3 lineas de contexto visible
- [x] Expand/collapse con click
- [x] Line numbers correctos post-expand
- [x] Synced scroll en split mode

**LOC estimado**: ~80

---

### Story 3: Interactive Screenshot Slider
**Archivo**: `frontend/src/components/ResultsView.jsx`

Reemplazar grid estatico en sub-tab "Side-by-Side" con slider interactivo:
- Clip-path based: `inset(0 ${100-pct}% 0 0)` en imagen pre
- Handle draggable con pointer events (mouse + touch)
- Labels "PRE" / "POST" con fade segun posicion
- Default: 50% (centro)
- Keyboard: flechas izquierda/derecha
- `touch-action: none` para evitar conflicto scroll
- Fallback: si solo hay 1 screenshot, mostrar a full width con placeholder

**Modos adicionales** (toggle):
- Slider (default)
- Side-by-Side (grid actual mejorado)
- Onion Skin (opacity slider)

**AC**:
- [x] Drag handle se mueve fluido con mouse/touch
- [x] Default en 50%
- [x] Fallback si falta screenshot
- [x] Accesible: role="slider", aria-label, aria-valuemin/max/now
- [x] 3 modos toggle: Slider, Side-by-Side, Onion Skin

**LOC estimado**: ~120

---

### Story 4: Evidence Download Button
**Archivo**: `frontend/src/components/ResultsView.jsx`, `frontend/src/services/visualQAReport.js`

Agregar boton prominente "Download Evidence" con:
- Resuelve screenshots desde IndexedDB via `resolveScreenshots()`
- Genera HTML via `generateVisualQAHTML()` (ya existe)
- Trigger download via Blob URL + anchor
- `URL.revokeObjectURL()` despues de download
- Loading state con shimmer animation
- Success state con checkmark animado
- Disabled cuando no hay visual data

**AC**:
- [x] Click produce archivo `.html` self-contained
- [x] Funciona offline
- [x] Boton disabled sin visual data
- [x] Memory cleanup con revokeObjectURL

**LOC estimado**: ~50

---

### Story 5: Combined Evidence Package
**Archivos**: `frontend/src/services/visualQAReport.js`, `frontend/src/services/reportGenerators.js`

Crear `generateCombinedEvidenceHTML(migrationData, visualQA, auditTrail)`:
- Section 1: Executive Summary (score, grade, duracion, tokens, costo)
- Section 2: Code Changes (diffs per file con syntax highlighting)
- Section 3: Visual QA (screenshots pre/post/diff, composite score)
- Section 4: Audit Trail (timeline de fases con KPIs)
- Section 5: Risk Assessment (issues por severidad)
- Navegacion interna con anchor links
- Print CSS con `break-inside: avoid`
- Todos los strings con `escHTML()` (anti-XSS)
- Warning banner: "Screenshots may contain sensitive content"

**AC**:
- [x] HTML unico con 5 secciones
- [x] Anchor links funcionan
- [x] `escHTML()` en todo user content
- [x] Funciona sin visual data (skip section 3)
- [x] Print-friendly

**LOC estimado**: ~150

---

### Story 6: Evidence Cards Redesign
**Archivo**: `frontend/src/components/ResultsView.jsx`, `frontend/src/components/MigratingView.jsx`

Rediseñar cards de screenshots con:
- Glassmorphism: `rgba(255,255,255,0.08)`, `backdropFilter: blur(12px)`
- Hover lift: `translateY(-2px)` + shadow increase
- Score badge overlay con color ring (green/yellow/red)
- Route label chip en bottom-left
- Expand icon animado
- Micro-interacciones en transiciones

**AC**:
- [x] Cards con glassmorphism y hover effect
- [x] Score badge con color segun threshold
- [x] Responsive a 375px
- [x] Dark mode compatible

**LOC estimado**: ~60

---

### Story 7: Security Hardening
**Archivos**: `backend/services/playwrightCapture.js`, `frontend/src/services/visualQAReport.js`, `frontend/src/lib/visualQAStore.js`

Mitigar hallazgos de security review:
- Expandir blocklist: `package.json`, `.npmrc`, `postcss.config.*`, `tailwind.config.*`
- `npm install --ignore-scripts` para prevenir lifecycle script RCE
- Vite `server.fs.strict: true` + `server.fs.allow: [tmpDir]`
- Base64 validation regex antes de embed en HTML
- `escHTML()` en footer r.id y r.migrationId
- IndexedDB eviction policy: auto-delete >30 dias o >100MB
- Warning banner en reports: "May contain sensitive content"

**AC**:
- [x] Config blocklist expandida
- [x] --ignore-scripts en npm install
- [x] Vite fs.strict habilitado
- [x] Base64 validada antes de embed
- [x] Eviction policy implementada
- [x] Warning en reports

**LOC estimado**: ~40

---

## Testing Strategy

### Unit Tests (Vitest)
- `wordDiff.test.js` — algoritmo word-level diff (~10 tests)
- `collapsibleDiff.test.js` — logica de agrupacion/colapso (~8 tests)
- `combinedEvidence.test.js` — generacion HTML combinada (~10 tests)
- Extend `visualQAReport.test.js` — download trigger, base64 validation

### Edge Cases Criticos
- Lineas >5000 chars → fallback a line-level
- Multi-byte UTF-8 (acentos ES/PT)
- IndexedDB unavailable (private browsing)
- Solo 1 screenshot disponible → fallback sin slider
- Codigo con `<script>` tags → XSS prevention
- Report >50MB → warning al usuario

---

## Security Mitigations (Pre-implementation)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Playwright sandbox incompleto | HIGH | Expandir blocklist + --ignore-scripts + fs.strict |
| Credential exposure en screenshots | HIGH | Warning banner + documentacion |
| IndexedDB sin eviction | MEDIUM | Auto-cleanup >30 dias o >100MB |
| XSS gaps en footer | LOW | escHTML() en r.id/r.migrationId |
| Blob URL memory leak | LOW | revokeObjectURL() post-download |

---

## Files Summary

| Archivo | Cambio | Stories |
|---------|--------|---------|
| `frontend/src/services/utils.js` | wordDiff() function | S1 |
| `frontend/src/components/ResultsView.jsx` | Diff, slider, cards, download buttons | S1,S2,S3,S4,S6 |
| `frontend/src/components/MigratingView.jsx` | Evidence cards redesign | S6 |
| `frontend/src/services/visualQAReport.js` | Combined evidence generator, base64 validation | S4,S5,S7 |
| `frontend/src/services/reportGenerators.js` | Combined evidence sections | S5 |
| `frontend/src/lib/visualQAStore.js` | Eviction policy | S7 |
| `backend/services/playwrightCapture.js` | Security hardening | S7 |
| Tests (5 nuevos) | Unit tests | S1,S2,S5 |
| **Total** | ~560 LOC across 7 stories | |

---

## Orden de Implementacion

```
S7 (Security Hardening) → S1 (Word Diff) → S2 (Collapsible) → S3 (Slider)
                                                                    ↓
                                                              S4 (Download) → S5 (Combined) → S6 (Cards)
```

Security primero para cerrar gaps antes de agregar mas superficie. Luego diff improvements (S1+S2 en paralelo), slider (S3), y finalmente download + combined + visual polish.

---

## Verificacion Final

1. **Build**: `npm run build` sin errores
2. **Tests**: Todos existentes + nuevos pasan
3. **Manual**: Migrar proyecto JS→Python con Gemini, verificar slider, download, combined report
4. **Security**: Re-scan post-hardening
5. **Performance**: Word diff de 1000 lineas en <200ms
6. **Mobile**: Slider y cards funcionan a 375px
