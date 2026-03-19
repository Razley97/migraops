# MigraOps — Migration Knowledge Base

Base de conocimiento para migraciones entre lenguajes. Este documento define las reglas, mapeos y estrategias que el pipeline usa para garantizar migraciones correctas.

---

## Lenguajes Soportados

| ID | Nombre | Extensiones | Versiones Principales |
|---|---|---|---|
| python | Python | .py | 2.7, 3.6, 3.8, 3.9, 3.10, 3.11, 3.12 |
| javascript | JavaScript | .js, .mjs, .cjs | ES5, ES6/ES2015, ES2017, ES2020, ES2022 |
| typescript | TypeScript | .ts, .tsx | 4.x, 5.x |
| java | Java | .java | 8, 11, 17, 21 |
| csharp | C# | .cs | 8.0, 9.0, 10.0, 11.0, 12.0 |
| kotlin | Kotlin | .kt, .kts | 1.6, 1.7, 1.8, 1.9, 2.0 |
| go | Go | .go | 1.18, 1.19, 1.20, 1.21, 1.22 |
| rust | Rust | .rs | 2018, 2021 edition |
| php | PHP | .php | 7.4, 8.0, 8.1, 8.2, 8.3 |
| ruby | Ruby | .rb | 2.7, 3.0, 3.1, 3.2, 3.3 |

---

## Paradigm Maps Disponibles

Mapeos bidireccionales completos (stdlib, patterns, modules, async, types):

| Origen | Destino | Clave en PARADIGM_MAPS |
|---|---|---|
| Python | JavaScript | `python→javascript` |
| JavaScript | Python | `javascript→python` |
| Java | C# | `java→csharp` |
| C# | Java | `csharp→java` |
| Java | Python | `java→python` |
| Python | Java | `python→java` |
| JavaScript | TypeScript | `javascript→typescript` |
| TypeScript | JavaScript | `typescript→javascript` |
| Java | Kotlin | `java→kotlin` |
| Kotlin | Java | `kotlin→java` |
| Go | Rust | `go→rust` |
| Ruby | Python | `ruby→python` |
| PHP | Python | `php→python` |
| Python | TypeScript | `python→typescript` |
| Go | Python | `go→python` |
| Rust | Python | `rust→python` |

Para pares sin mapeo explícito, el pipeline usa el sistema de prompts con las reglas cross-language genéricas.

---

## Python: Guía de Migración por Versión

### Python 2.7 → Python 3.x
| Cambio | Python 2 | Python 3 |
|---|---|---|
| Print | `print "hello"` | `print("hello")` |
| División | `5/2 = 2` | `5/2 = 2.5`, usar `5//2` para entero |
| Unicode | `u"texto"` / `"bytes"` | `"texto"` es unicode, `b"bytes"` |
| Iteradores | `range()` retorna lista | `range()` retorna iterador |
| Dict views | `.keys()` retorna lista | `.keys()` retorna view |
| Exceptions | `except E, e:` | `except E as e:` |
| Import relativo | `import sibling` | `from . import sibling` |
| metaclass | `__metaclass__ = M` | `class Foo(metaclass=M):` |
| has_key | `d.has_key(k)` | `k in d` |
| raw_input | `raw_input()` | `input()` |
| xrange | `xrange(n)` | `range(n)` |

### Python 3.6 → 3.10+
| Feature | Desde | Ejemplo |
|---|---|---|
| f-strings | 3.6 | `f"hello {name}"` |
| dataclasses | 3.7 | `@dataclass class Point:` |
| walrus operator | 3.8 | `if (n := len(a)) > 10:` |
| dict union | 3.9 | `d1 \| d2` |
| builtin generics | 3.9 | `list[int]` en vez de `List[int]` |
| match/case | 3.10 | `match command: case "quit":` |
| ExceptionGroup | 3.11 | `except* ValueError as eg:` |
| type statement | 3.12 | `type Point = tuple[int, int]` |

### Python → JavaScript/TypeScript (Mapeos Clave)
| Python | JavaScript/TypeScript |
|---|---|
| `list` / `[]` | `Array` / `[]` |
| `dict` / `{}` | `Object` / `Map` / `Record<K,V>` |
| `tuple` | `readonly [A, B]` (TS) / `[a, b]` (JS) |
| `set` | `Set` |
| `None` | `null` / `undefined` |
| `True`/`False` | `true`/`false` |
| `len(x)` | `x.length` |
| `range(n)` | `Array.from({length:n}, (_,i) => i)` |
| `[x for x in arr]` | `arr.map(x => x)` |
| `{k:v for k,v in d}` | `Object.fromEntries(...)` |
| `lambda x: x*2` | `(x) => x*2` |
| `def func():` | `function func() {}` / `const func = () => {}` |
| `class Foo:` | `class Foo {}` |
| `@decorator` | No nativo (TS 5.x decorators, o wrapper functions) |
| `with open() as f:` | `const data = fs.readFileSync()` / `await fs.promises.readFile()` |
| `try: except:` | `try {} catch(e) {}` |
| `import module` | `import module from 'module'` |
| `from mod import x` | `import { x } from 'mod'` |
| `async def` / `await` | `async function` / `await` |
| `asyncio.gather()` | `Promise.all()` |
| `json.dumps()` | `JSON.stringify()` |
| `json.loads()` | `JSON.parse()` |

### Python → Java (Mapeos Clave)
| Python | Java |
|---|---|
| `list` | `ArrayList<T>` / `List<T>` |
| `dict` | `HashMap<K,V>` / `Map<K,V>` |
| `set` | `HashSet<T>` / `Set<T>` |
| `tuple` | `record` (17+) o clase custom |
| `None` | `null` |
| `def func(a, b):` | `ReturnType func(ParamType a, ParamType b)` |
| `class Foo:` | `public class Foo {}` |
| `self.x` | `this.x` |
| `@property` | getter/setter methods |
| `__init__` | constructor |
| `raise Exception` | `throw new Exception()` |
| `try/except` | `try/catch` |
| `with` (context manager) | `try-with-resources` |
| `print()` | `System.out.println()` |
| `f"hello {x}"` | `"hello " + x` o `String.format()` |
| `[x for x in arr if cond]` | `arr.stream().filter().map().collect()` |
| `lambda x: x*2` | `x -> x*2` |
| `**kwargs` | `Map<String, Object> kwargs` |

---

## JavaScript/TypeScript: Guía de Migración por Versión

### ES5 → ES6+
| ES5 | ES6+ |
|---|---|
| `var x = 1` | `const x = 1` / `let x = 1` |
| `function(x) {}` | `(x) => {}` |
| `"hello " + name` | `` `hello ${name}` `` |
| `obj.key || default` | `obj.key ?? default` (ES2020) |
| `obj && obj.key` | `obj?.key` (ES2020) |
| `arguments` | `...args` rest params |
| Prototypes | `class` syntax |
| `require()` | `import/export` |
| Callbacks | `Promise` / `async/await` |
| `for (var i=0;...)` | `for (const x of arr)` |
| `Object.keys(o).forEach` | `Object.entries(o)` |
| `arr.indexOf(x) !== -1` | `arr.includes(x)` |

### JavaScript → TypeScript
| JS | TypeScript |
|---|---|
| `function f(a, b)` | `function f(a: string, b: number): boolean` |
| `const obj = {}` | `const obj: Record<string, unknown> = {}` |
| `/** @type {X} */` | `: X` type annotation |
| No interfaces | `interface Foo { prop: Type }` |
| `module.exports` | `export default` / `export { }` |
| Dynamic typing | `unknown`, generics, union types |
| `any` implicit | `strict: true` en tsconfig |

---

## Java: Guía de Migración por Versión

### Java 8 → Java 11
- `var` para variables locales
- `HttpClient` nativo (reemplaza Apache HttpClient)
- `String.strip()`, `isBlank()`, `lines()`, `repeat()`
- `Optional.isEmpty()`
- `Files.readString()`, `Files.writeString()`

### Java 11 → Java 17
- `record` types (inmutables, reemplaza POJOs simples)
- `sealed` classes/interfaces
- Pattern matching `instanceof`: `if (obj instanceof String s)`
- Text blocks: `""" multi-line """`
- Switch expressions: `var x = switch(y) { case A -> 1; };`

### Java 17 → Java 21
- Virtual threads: `Thread.ofVirtual().start()`
- Record patterns en switch
- Sequenced collections
- String templates (preview)

---

## Go: Guía de Migración

### Go → Rust (Mapeos Clave)
| Go | Rust |
|---|---|
| `func f(a int) string` | `fn f(a: i32) -> String` |
| `type S struct {}` | `struct S {}` |
| `(s *S) Method()` | `impl S { fn method(&mut self) }` |
| `interface {}` | `trait T {}` |
| `error` return | `Result<T, E>` |
| `if err != nil` | `?` operator |
| `defer` | `Drop` trait / scope guards |
| `go func(){}()` | `tokio::spawn(async {})` |
| `chan T` | `mpsc::channel()` |
| `select {}` | `tokio::select!{}` |
| `sync.Mutex` | `std::sync::Mutex<T>` |
| `[]T` (slice) | `Vec<T>` |
| `map[K]V` | `HashMap<K,V>` |
| `nil` | `None` (Option) |

---

## PHP: Guía de Migración

### PHP → Python (Mapeos Clave)
| PHP | Python |
|---|---|
| `$variable` | `variable` (sin $) |
| `echo $x` | `print(x)` |
| `strlen($s)` | `len(s)` |
| `array()` / `[]` | `list` o `dict` según uso |
| `foreach ($arr as $v)` | `for v in arr:` |
| `foreach ($arr as $k => $v)` | `for k, v in arr.items():` |
| `=>` (en arrays) | `:` (en dicts) |
| `null` | `None` |
| `true`/`false` | `True`/`False` |
| `class Foo extends Bar` | `class Foo(Bar):` |
| `public function` | `def method(self):` |
| `->` (object access) | `.` (dot notation) |
| `::` (static) | `Cls.method()` |
| `namespace App\Models` | package directory |
| `use App\Models\User` | `from app.models import User` |
| `?? null` coalescing | `or None` / `if x is not None` |

---

## Ruby: Guía de Migración

### Ruby → Python (Mapeos Clave)
| Ruby | Python |
|---|---|
| `puts x` | `print(x)` |
| `x.to_s` / `x.to_i` | `str(x)` / `int(x)` |
| `arr.each { \|x\| }` | `for x in arr:` |
| `arr.map { \|x\| x*2 }` | `[x*2 for x in arr]` |
| `arr.select { \|x\| x>0 }` | `[x for x in arr if x>0]` |
| `nil` | `None` |
| `true`/`false` | `True`/`False` |
| `def method; end` | `def method(self):` |
| `class Foo; end` | `class Foo:` |
| `attr_accessor :name` | `self.name = name` en `__init__` |
| `begin; rescue; end` | `try: except:` |
| `require 'gem'` | `import module` |
| `symbol :name` | `string 'name'` |
| `block { }` / `do..end` | `lambda` / función callback |
| `unless cond` | `if not cond:` |
| `x \|\|= default` | `x = x or default` |

---

## Kotlin ↔ Java

### Kotlin → Java
| Kotlin | Java |
|---|---|
| `val x = 1` | `final var x = 1` |
| `var x = 1` | `var x = 1` |
| `data class` | class + equals/hashCode/toString |
| `fun f(a: Int): String` | `String f(int a)` |
| `?.` safe call | null check + access |
| `?:` elvis | ternary con null check |
| `when(x) { }` | `switch(x) { }` |
| `coroutines` | CompletableFuture / RxJava |
| `sealed class` | abstract class (Java 17: sealed) |
| `object Singleton` | singleton pattern |
| `companion object` | static methods/fields |
| `listOf()` | `List.of()` (Java 9+) |
| `it` (lambda param) | explicit lambda param |

---

## C# ↔ Java

### C# → Java
| C# | Java |
|---|---|
| `string` | `String` |
| `var` | `var` (Java 10+) |
| `List<T>` | `ArrayList<T>` |
| `Dictionary<K,V>` | `HashMap<K,V>` |
| LINQ `.Where()` | `.stream().filter()` |
| LINQ `.Select()` | `.stream().map()` |
| `async Task<T>` | `CompletableFuture<T>` |
| `await` | `.thenApply()` / `.get()` |
| `property { get; set; }` | getter/setter methods |
| `record` | `record` (Java 17+) |
| `namespace` | `package` |
| `using` | `import` |
| `?? null` coalescing | `Objects.requireNonNullElse()` |
| `?.` null conditional | null check chain |

---

## Pipeline de Migración: Flujo

```
Phase A: Codebase Analysis
  → Analiza todos los archivos, detecta arquitectura, dependencias, orden de migración
  → Genera processingHints por archivo (APIs deprecated, cambios async, etc.)
  → GATE: Humano aprueba análisis antes de continuar

Phase B: File Migration (por archivo, en orden de dependencia)
  → B.1: Per-file Plan (receta detallada de cambios línea por línea)
  → B.2: Migration (ejecuta la receta, genera código completo)
  → Pasa contexto de siblings ya migrados (solo exitosos)
  → GATE: Humano aprueba cada archivo

Phase B2: Consolidation (si >1 archivo)
  → B2a: Dependency Audit (mapea todas las conexiones cross-file)
  → B2b: Consolidation Fix (corrige imports, signatures, naming)
  → GATE: Humano revisa consolidación

Phase C+D: Integration Check + Fix (loop hasta score >= 90)
  → C: Valida integración con scoring de 8 capas
  → GATE: Humano decide si corregir o aceptar
  → D: Fix automático de issues críticos/mayores
  → Regression guard: rollback si score baja
  → Stall detection: para si no mejora
```

---

## Configuración de Robustez

| Feature | Valor | Descripción |
|---|---|---|
| Default retries | 1 | Cada llamada a Claude reintenta 1 vez |
| 429 backoff | Exponencial 3s-15s | Rate limit con backoff |
| Truncation detection | Auto-retry 1.5x tokens | Si `stop_reason: max_tokens`, reintenta |
| Backend timeout | 120s | Proxy a Anthropic con AbortController |
| Frontend timeout | 40-75s por archivo | Según complejidad (capacity system) |
| Global timeout | 10min + 90s/archivo | Cancela pipeline completo si se cuelga |
| Failed file isolation | Filter `failed:true` | Archivos fallidos no contaminan siblings |
| JSON recovery | Regex fallback | safeParseJSON extrae JSON de texto mixto |
| Regression guard | Rollback si score -2 | Revierte a mejor versión si fix empeora |
| Stall detection | Break si score +2 max | Para el loop si no mejora significativamente |
