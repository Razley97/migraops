# Plan: Neo4j Knowledge Graph Integration for MigraOps

## Context

MigraOps actualmente infiere dependencias cross-file usando LLM calls (Phase B2a: `doDependencyAudit`). Esto tiene limitaciones:
- **Imprecisión**: El LLM puede inventar dependencias o perder relaciones sutiles
- **Costo**: 1 API call adicional por migración solo para análisis de dependencias
- **Sin persistencia**: El conocimiento de dependencias se pierde entre fases del pipeline
- **Sin contexto global**: Cada fase reconstruye su entendimiento del codebase independientemente

### Propuesta

Integrar Neo4j como **knowledge graph efímero** que mapea relaciones del codebase (imports, calls, extends, implements) y provee contexto determinístico a cada fase del pipeline de migración.

### RADAR Score: 6.8/10

| Dimensión | Score | Justificación |
|-----------|-------|---------------|
| Readiness | 7/10 | Stack compatible, neo4j-driver maduro, Docker ya en uso |
| Architecture | 8/10 | Encaja como servicio efímero, reemplaza LLM calls |
| Dependencies | 6/10 | neo4j-driver stable, tree-sitter experimental (Phase 2) |
| Acceptance | 8/10 | Alto valor para precisión cross-file |
| Risk | 5/10 | 2 CRITICAL security issues requieren mitigación previa |

---

## Arquitectura

### Graph Schema

**Nodes:**
| Label | Properties | Descripción |
|-------|-----------|-------------|
| `File` | path, language, lineCount, complexity | Archivo del codebase |
| `Function` | name, async, exported, params, returnType | Función/método |
| `Class` | name, abstract, exported | Clase o interface |
| `Type` | name, kind (interface/enum/type/struct) | Definición de tipo |
| `Module` | name, packageName | Módulo/paquete externo |
| `Contract` | name, methods[], properties[] | Contrato de API (REST endpoint, etc.) |

**Edges:**
| Type | From → To | Properties |
|------|-----------|-----------|
| `IMPORTS` | File → File/Module | names[], isDefault, isDynamic |
| `EXPORTS` | File → Function/Class/Type | isDefault, isReExport |
| `CALLS` | Function → Function | count, isAsync |
| `EXTENDS` | Class → Class | |
| `IMPLEMENTS` | Class → Type | |
| `DEPENDS_ON` | File → File | weight (computed) |
| `CONTAINS` | File → Function/Class/Type | lineStart, lineEnd |
| `USES_TYPE` | Function → Type | paramOrReturn |

### Deployment: Docker Compose Sidecar

```yaml
# docker-compose.yml (addition)
neo4j:
  image: neo4j:5-community
  environment:
    NEO4J_AUTH: neo4j/migraops-ephemeral
    NEO4J_PLUGINS: '[]'
    NEO4J_dbms_memory_heap_max__size: 512m
    NEO4J_dbms_security_procedures_unrestricted: ''
  networks:
    - internal
  # NO port mapping to host — internal only
  healthcheck:
    test: ["CMD", "neo4j", "status"]
    interval: 10s
    retries: 3
```

- Red interna Docker only — no puerto 7474/7687 expuesto al host
- Auth con password fija (entorno local dev, no producción)
- Memoria limitada a 512MB
- Sin plugins adicionales

### Integration Points in Pipeline

```
Phase A (Analysis)
  └─ PRE: Build graph from uploaded files
  └─ QUERY: Get file dependency order for analysis prioritization

Phase B2a (Dependency Audit)  ← HIGHEST VALUE REPLACEMENT
  └─ REPLACE: doDependencyAudit() LLM call → Cypher query
  └─ QUERY: MATCH (f:File)-[:IMPORTS|DEPENDS_ON*1..3]->(dep) WHERE f.path = $path RETURN dep

Phase B2b (Consistency Check)
  └─ ENRICH: Add graph-derived cross-file context to consistency prompt
  └─ QUERY: Get all files that IMPORT the file being migrated

Phase C (Integration Check)
  └─ ENRICH: Inject affected consumers list from graph
  └─ QUERY: MATCH (consumer)-[:IMPORTS]->(f) WHERE f.path = $migratedFile RETURN consumer

Phase D (Fix)
  └─ ENRICH: When fixing import errors, provide exact dependency paths
```

---

## Stories

### Story 1: Neo4j Service Setup & Health Check
**Prioridad**: P0
**Archivos**: `docker-compose.yml`, `backend/services/neo4jClient.js`
**LOC**: ~60

Agregar Neo4j al Docker Compose y crear cliente con:
- Connection pool (max 50 sessions)
- Health check endpoint (`GET /api/neo4j/health`)
- Auto-reconnect con backoff
- Graceful shutdown (close driver on SIGTERM)

```javascript
// backend/services/neo4jClient.js
const neo4j = require("neo4j-driver");

let driver = null;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI || "bolt://neo4j:7687",
      neo4j.auth.basic("neo4j", process.env.NEO4J_PASSWORD || "migraops-ephemeral"),
      { maxConnectionPoolSize: 50, connectionAcquisitionTimeout: 10000 }
    );
  }
  return driver;
}

async function healthCheck() {
  const session = getDriver().session();
  try {
    await session.run("RETURN 1");
    return { status: "ok" };
  } finally {
    await session.close();
  }
}

async function closeDriver() {
  if (driver) { await driver.close(); driver = null; }
}
```

**Gherkin**:
```gherkin
Scenario: Neo4j service is reachable
  Given docker-compose up has been run
  When GET /api/neo4j/health is called
  Then response is { status: "ok" }

Scenario: Neo4j service is down
  Given neo4j container is stopped
  When GET /api/neo4j/health is called
  Then response is { status: "error", message: "..." }
  And pipeline proceeds without graph context (graceful degradation)
```

---

### Story 2: Graph Builder — LLM-Powered Code Analysis
**Prioridad**: P0
**Archivos**: `backend/services/graphBuilder.js`
**LOC**: ~120

Crear servicio que recibe archivos del codebase y construye el grafo:

1. Para cada archivo, enviar al LLM un prompt compacto pidiendo extraer:
   - Imports (qué importa de dónde)
   - Exports (qué exporta)
   - Functions/Classes definidas
   - Types definidos
2. Parsear respuesta JSON estructurada
3. Crear nodos y edges via Cypher parametrizado

```javascript
// Prompt template para extracción
const EXTRACT_PROMPT = `Analyze this source file and extract its structure as JSON:
{
  "imports": [{"from": "path", "names": ["x"], "isDefault": false}],
  "exports": [{"name": "x", "kind": "function|class|type", "isDefault": false}],
  "functions": [{"name": "x", "async": false, "params": ["a","b"], "calls": ["y"]}],
  "classes": [{"name": "X", "extends": "Y", "implements": ["I"], "methods": ["m"]}],
  "types": [{"name": "T", "kind": "interface|enum|type"}]
}
Only output the JSON, no explanation.`;

async function buildGraphForFiles(files, modelId) {
  const session = getDriver().session();
  try {
    // Clear previous graph
    await session.run("MATCH (n) DETACH DELETE n");

    for (const file of files) {
      // 1. Extract structure via LLM
      const structure = await extractStructure(file, modelId);

      // 2. Create File node
      await session.run(
        "CREATE (f:File {path: $path, language: $lang, lineCount: $lines})",
        { path: file.path, lang: file.language, lines: file.lineCount }
      );

      // 3. Create contained entities + edges (all parameterized)
      await createEntities(session, file.path, structure);
    }

    // 4. Resolve inter-file edges (IMPORTS → actual File nodes)
    await resolveImportEdges(session);

  } finally {
    await session.close();
  }
}
```

**Seguridad**: Todos los queries usan parámetros (`$path`, `$name`) — nunca string concatenation.

**Gherkin**:
```gherkin
Scenario: Build graph from 3 JS files
  Given 3 files: utils.js (exports formatDate), app.js (imports formatDate from utils), index.js (imports app)
  When buildGraphForFiles is called
  Then graph contains 3 File nodes, 1 Function node, 2 IMPORTS edges
  And DEPENDS_ON edge exists: app.js → utils.js

Scenario: LLM extraction fails for 1 file
  Given 3 files where 1 has syntax errors
  When buildGraphForFiles is called
  Then 2 files are graphed successfully
  And 1 file has File node with error flag
  And pipeline continues with partial graph
```

---

### Story 3: Query Service — Dependency Queries for Pipeline
**Prioridad**: P0
**Archivos**: `backend/services/graphQueries.js`, `backend/routes/migrate.js`
**LOC**: ~80

API de queries que el pipeline consume:

```javascript
// Get all dependencies of a file (direct + transitive up to 3 hops)
async function getDependencies(filePath, maxDepth = 3) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (f:File {path: $path})-[:IMPORTS|DEPENDS_ON*1..${maxDepth}]->(dep:File)
       RETURN DISTINCT dep.path AS path, dep.language AS language`,
      { path: filePath }
    );
    return result.records.map(r => ({ path: r.get("path"), language: r.get("language") }));
  } finally {
    await session.close();
  }
}

// Get all consumers of a file (who imports it)
async function getConsumers(filePath) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (consumer:File)-[:IMPORTS]->(f:File {path: $path})
       RETURN consumer.path AS path`,
      { path: filePath }
    );
    return result.records.map(r => r.get("path"));
  } finally {
    await session.close();
  }
}

// Get optimal migration order (topological sort by dependency depth)
async function getMigrationOrder() {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (f:File)
       OPTIONAL MATCH (f)-[:IMPORTS]->(dep:File)
       WITH f, count(dep) AS depCount
       RETURN f.path AS path, depCount
       ORDER BY depCount ASC`
    );
    return result.records.map(r => ({ path: r.get("path"), depCount: r.get("depCount").toNumber() }));
  } finally {
    await session.close();
  }
}

// Get cross-file context for a specific file
async function getCrossFileContext(filePath) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (f:File {path: $path})-[:CONTAINS]->(entity)
       OPTIONAL MATCH (entity)-[:CALLS]->(called)
       OPTIONAL MATCH (f)-[:IMPORTS]->(imported:File)
       RETURN entity, collect(DISTINCT called) AS calls, collect(DISTINCT imported) AS imports`,
      { path: filePath }
    );
    // Format as structured context for LLM prompt injection
    return formatContextForPrompt(result.records);
  } finally {
    await session.close();
  }
}
```

**Endpoint nuevo**: `POST /api/graph/query` — recibe `{ type: "dependencies"|"consumers"|"order"|"context", filePath }`.

**Gherkin**:
```gherkin
Scenario: Get dependencies for a file
  Given graph with app.js → utils.js → constants.js
  When getDependencies("app.js", 3) is called
  Then returns ["utils.js", "constants.js"]

Scenario: Get migration order
  Given graph with 3 files where constants.js has 0 deps, utils.js has 1, app.js has 2
  When getMigrationOrder() is called
  Then returns [constants.js, utils.js, app.js] (leaves first)
```

---

### Story 4: Pipeline Integration — Phase B2a Replacement
**Prioridad**: P1
**Archivos**: `frontend/src/services/migrationPhases.js`, `backend/routes/migrate.js`
**LOC**: ~40

Reemplazar `doDependencyAudit()` LLM call con graph query cuando Neo4j está disponible:

```javascript
// En migrationPhases.js — Phase B2a
async function doDependencyAuditV2(file, allFiles, mid, emit) {
  // Try graph-based audit first
  try {
    const graphCtx = await fetch("/api/graph/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "dependencies", filePath: file.path })
    });
    if (graphCtx.ok) {
      const deps = await graphCtx.json();
      // Format as dependency audit result (same shape as LLM output)
      return formatGraphDepsAsAudit(deps, file, allFiles);
    }
  } catch (e) {
    // Graph unavailable — fall through to LLM
    console.log("[Graph] Fallback to LLM for dependency audit:", e.message);
  }

  // Fallback: existing LLM-based audit
  return doDependencyAudit(file, allFiles, mid, emit);
}
```

**Degradación graceful**: Si Neo4j no está disponible, el pipeline funciona exactamente como antes.

**Gherkin**:
```gherkin
Scenario: Graph available — skip LLM call
  Given Neo4j is running with populated graph
  When Phase B2a runs for file "app.js"
  Then dependency audit comes from graph query (0 LLM calls)
  And result has same shape as LLM-based audit

Scenario: Graph unavailable — fallback to LLM
  Given Neo4j is not running
  When Phase B2a runs for file "app.js"
  Then dependency audit uses existing LLM call
  And pipeline completes normally
```

---

### Story 5: Pipeline Integration — Context Enrichment for Phases B2b, C
**Prioridad**: P1
**Archivos**: `frontend/src/services/migrationPhases.js`
**LOC**: ~30

Enriquecer prompts de Phase B2b (Consistency Check) y Phase C (Integration Check) con contexto del grafo:

```javascript
// Inject graph context into system prompt
async function getGraphEnrichment(filePath) {
  try {
    const r = await fetch("/api/graph/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "context", filePath })
    });
    if (r.ok) {
      const ctx = await r.json();
      return "\n\n## Cross-File Context (from dependency graph)\n" + ctx.summary;
    }
  } catch (e) { /* silent fallback */ }
  return "";
}

// Usage in Phase B2b:
var graphContext = await getGraphEnrichment(file.path);
var systemPrompt = basePrompt + graphContext;
```

---

### Story 6: Graph Lifecycle Management
**Prioridad**: P1
**Archivos**: `backend/services/graphBuilder.js`, `backend/routes/migrate.js`
**LOC**: ~40

Gestionar el ciclo de vida del grafo por migración:

- **Pre-migration**: Build graph cuando usuario sube archivos
- **During migration**: Queries enriquecen cada fase
- **Post-migration**: Clear graph (efímero)
- **Timeout**: Auto-clear después de 30 min de inactividad

```javascript
// Lifecycle hooks
async function initGraph(migrationId, files, modelId) {
  await buildGraphForFiles(files, modelId);
  scheduleCleanup(migrationId, 30 * 60 * 1000); // 30 min TTL
}

async function clearGraph(migrationId) {
  const session = getDriver().session();
  try {
    await session.run("MATCH (n) DETACH DELETE n");
  } finally {
    await session.close();
  }
}
```

---

### Story 7: Security Hardening
**Prioridad**: P0 (debe implementarse ANTES de Story 2)
**Archivos**: `docker-compose.yml`, `backend/services/neo4jClient.js`, `backend/services/graphBuilder.js`
**LOC**: ~30

Mitigaciones obligatorias de seguridad:

| Vulnerabilidad | Severidad | Mitigación |
|---------------|-----------|-----------|
| Port exposure (7474, 7687) | CRITICAL | Docker internal network only, no port mapping |
| Cypher injection | CRITICAL | ALL queries use parameterized `$variables`, never string concat |
| Credential hardcoding | HIGH | Password via `NEO4J_PASSWORD` env var |
| Unrestricted procedures | MEDIUM | `dbms.security.procedures.unrestricted: ''` (empty) |
| Graph data leakage | MEDIUM | Auto-clear after migration, 30 min TTL |
| DoS via large graphs | LOW | Limit to 500 files max, timeout on graph build |

**Mandatory code review checklist**:
- [ ] Zero string concatenation in Cypher queries
- [ ] No port 7474/7687 in docker-compose ports
- [ ] NEO4J_PASSWORD from env var
- [ ] Graph auto-cleanup implemented
- [ ] File count limit enforced

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `neo4j-driver` | ^5.x | Official Neo4j JavaScript driver |
| `neo4j:5-community` | Docker image | Neo4j Community Edition |

**No se requiere** `web-tree-sitter` en Phase 1 — el parsing es via LLM. Tree-sitter es Phase 2 futuro.

---

## Files Summary

| Archivo | Cambio | Stories |
|---------|--------|---------|
| `docker-compose.yml` | Add neo4j service | S1, S7 |
| `backend/services/neo4jClient.js` | NEW — Driver, health, connection pool | S1 |
| `backend/services/graphBuilder.js` | NEW — LLM-powered graph construction | S2, S6 |
| `backend/services/graphQueries.js` | NEW — Dependency/consumer/order queries | S3 |
| `backend/routes/migrate.js` | Add graph endpoints + lifecycle hooks | S3, S4, S6 |
| `frontend/src/services/migrationPhases.js` | Phase B2a replacement + B2b/C enrichment | S4, S5 |
| `backend/.env` | Add NEO4J_URI, NEO4J_PASSWORD | S1 |
| Tests (3-4 new files) | Unit tests for graph builder, queries | S2, S3 |
| **Total** | ~400 LOC across 7 stories | |

---

## Orden de Implementación

```
S7 (Security Hardening) → S1 (Service Setup) → S2 (Graph Builder) → S3 (Query Service)
                                                                          ↓
                                                              S4 (Phase B2a) → S5 (Enrichment) → S6 (Lifecycle)
```

Security first. Service setup. Graph builder + queries en paralelo. Pipeline integration último.

---

## Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Dependency accuracy | ~70% (LLM-inferred) | ~95% (graph-deterministic) | +25% |
| Phase B2a API calls | 1 per file | 0 (graph query) | -100% |
| Cross-file context | None in prompts | Injected per-file | New capability |
| Migration order | Random/upload order | Topological (leaves first) | Smarter ordering |
| Total API calls saved | 0 | 1 per file × N files | Significant for large codebases |

---

## Verificación

1. **Docker**: `docker-compose up` levanta neo4j + backend sin errores
2. **Health**: `GET /api/neo4j/health` retorna `{ status: "ok" }`
3. **Graph Build**: Upload 5 archivos JS → grafo tiene 5 File nodes + edges correctos
4. **Query**: `getDependencies("app.js")` retorna dependencias correctas
5. **Pipeline**: Migración completa con graph context → verificar que Phase B2a no hace LLM call
6. **Fallback**: Detener neo4j → pipeline funciona sin graph (degradación graceful)
7. **Security**: No hay puertos expuestos, no hay Cypher injection, graph se limpia post-migración
8. **Tests**: Todos existentes + nuevos pasan

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM extraction imprecisa (Phase 1) | HIGH | Validate with known codebases; Phase 2 uses AST |
| Neo4j adds startup time | MEDIUM | Lazy init — only start when migration begins |
| Docker not installed on user machine | MEDIUM | Graceful degradation — pipeline works without graph |
| Graph build adds latency | MEDIUM | Parallelize with Phase A analysis |
| Large codebases overflow Neo4j memory | LOW | 512MB heap + 500 file limit |

---

## Phase 2 (Future): AST-Based Graph Construction

Replace LLM-powered extraction with `web-tree-sitter` for deterministic, zero-cost parsing:
- Supports JS/TS/Python/Java/Go/C# grammars
- No API calls needed for graph construction
- 100% accurate import/export extraction
- Sub-second parsing for most files

This would make the knowledge graph entirely free to build, regardless of model tier.
