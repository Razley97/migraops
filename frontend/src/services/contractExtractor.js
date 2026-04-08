// ═══ Contract Extractor — semantic compression for free-tier ═══
// Extracts imports, exports, signatures, and types from source code.
// Replaces blind line truncation with contract-aware compression.

var EXTRACTORS = {
  js: extractJS,
  ts: extractJS,
  jsx: extractJS,
  tsx: extractJS,
  py: extractPython,
  java: extractJava,
  kotlin: extractJava,
  cs: extractCSharp,
  csharp: extractCSharp,
  go: extractGo
};

// ─── JavaScript / TypeScript ───
function extractJS(lines) {
  var imports = [];
  var exports = [];
  var signatures = [];
  var types = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var t = l.trim();
    if (t.startsWith("import ") || t.startsWith("import{") || t.match(/^(var|let|const)\s+\w+\s*=\s*require\(/)) {
      imports.push(l);
    } else if (t.startsWith("export ")) {
      exports.push(l);
      if (t.match(/^export\s+(default\s+)?(function|class|const|var|let|async\s+function)\s/)) {
        signatures.push(l);
      }
    } else if (t.match(/^(export\s+)?(interface|type|enum)\s/)) {
      types.push(l);
    } else if (t.match(/^(async\s+)?function\s+\w+/) || t.match(/^(const|var|let)\s+\w+\s*=\s*(async\s+)?\(/) || t.match(/^(const|var|let)\s+\w+\s*=\s*(async\s+)?function/)) {
      signatures.push(l);
    } else if (t.match(/^class\s+\w+/)) {
      signatures.push(l);
    } else if (t.startsWith("module.exports")) {
      exports.push(l);
    }
  }
  return { imports: imports, exports: exports, signatures: signatures, types: types };
}

// ─── Python ───
function extractPython(lines) {
  var imports = [];
  var exports = [];
  var signatures = [];
  var types = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var t = l.trim();
    if (t.startsWith("import ") || t.startsWith("from ")) {
      imports.push(l);
    } else if (t.match(/^def\s+\w+/) || t.match(/^async\s+def\s+\w+/)) {
      signatures.push(l);
    } else if (t.match(/^class\s+\w+/)) {
      types.push(l);
    } else if (t.startsWith("__all__")) {
      exports.push(l);
    }
  }
  return { imports: imports, exports: exports, signatures: signatures, types: types };
}

// ─── Java / Kotlin ───
function extractJava(lines) {
  var imports = [];
  var exports = [];
  var signatures = [];
  var types = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var t = l.trim();
    if (t.startsWith("import ") || t.startsWith("package ")) {
      imports.push(l);
    } else if (t.match(/^(public|protected|private|internal|open|data|sealed|abstract)\s+(class|interface|enum|object|annotation)\s/)) {
      types.push(l);
      if (t.match(/^public\s/)) exports.push(l);
    } else if (t.match(/^(public|protected|private|internal|open|override|abstract|suspend|static|final)\s+.*\(/) && !t.match(/^\s*\/\//)) {
      signatures.push(l);
    } else if (t.startsWith("fun ") || t.match(/^(suspend\s+)?fun\s/)) {
      signatures.push(l);
    }
  }
  return { imports: imports, exports: exports, signatures: signatures, types: types };
}

// ─── C# ───
function extractCSharp(lines) {
  var imports = [];
  var exports = [];
  var signatures = [];
  var types = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var t = l.trim();
    if (t.startsWith("using ") || t.startsWith("namespace ")) {
      imports.push(l);
    } else if (t.match(/^(public|internal|protected|private|abstract|sealed|static|partial)\s+(class|interface|enum|struct|record|delegate)\s/)) {
      types.push(l);
      if (t.match(/^public\s/)) exports.push(l);
    } else if (t.match(/^(public|internal|protected|private|abstract|virtual|override|static|async)\s+.*\(/) && !t.match(/^\s*\/\//)) {
      signatures.push(l);
    }
  }
  return { imports: imports, exports: exports, signatures: signatures, types: types };
}

// ─── Go ───
function extractGo(lines) {
  var imports = [];
  var exports = [];
  var signatures = [];
  var types = [];
  var inImportBlock = false;
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    var t = l.trim();
    if (t.startsWith("package ")) {
      imports.push(l);
    } else if (t === "import (") {
      inImportBlock = true;
      imports.push(l);
    } else if (inImportBlock) {
      imports.push(l);
      if (t === ")") inImportBlock = false;
    } else if (t.startsWith("import \"") || t.startsWith("import '")) {
      imports.push(l);
    } else if (t.startsWith("func ")) {
      signatures.push(l);
      // Exported = starts with uppercase after "func " or "func (receiver) "
      var funcName = t.match(/^func\s+(?:\([^)]*\)\s+)?([A-Z]\w*)/);
      if (funcName) exports.push(l);
    } else if (t.startsWith("type ")) {
      types.push(l);
      var typeName = t.match(/^type\s+([A-Z]\w*)/);
      if (typeName) exports.push(l);
    } else if (t.startsWith("var ") || t.startsWith("const ")) {
      var varName = t.match(/^(var|const)\s+([A-Z]\w*)/);
      if (varName) exports.push(l);
    }
  }
  return { imports: imports, exports: exports, signatures: signatures, types: types };
}

// ─── Public API ───

export function extractContracts(code, lang) {
  if (!code) return { imports: [], exports: [], signatures: [], types: [], raw: "" };
  var lines = code.split("\n");
  // Short files: return as-is
  if (lines.length <= 40) {
    return { imports: [], exports: [], signatures: [], types: [], raw: code };
  }
  var extractor = EXTRACTORS[lang];
  if (!extractor) {
    // Fallback: return first 80 lines
    return { imports: [], exports: [], signatures: [], types: [], raw: lines.slice(0, 80).join("\n") + "\n// ... (" + (lines.length - 80) + " more lines)" };
  }
  var result = extractor(lines);
  // Build compact representation
  var sections = [];
  if (result.imports.length) sections.push("// --- imports ---\n" + result.imports.join("\n"));
  if (result.types.length) sections.push("// --- types ---\n" + result.types.join("\n"));
  // Merge exports and signatures, deduplicating identical lines
  var combined = result.exports.concat(result.signatures);
  var seen = {};
  var unique = [];
  for (var u = 0; u < combined.length; u++) {
    if (!seen[combined[u]]) { seen[combined[u]] = true; unique.push(combined[u]); }
  }
  if (unique.length) sections.push("// --- exports & signatures ---\n" + unique.join("\n"));
  var contracted = sections.join("\n\n");
  // If extraction yielded very little, fallback to first 80 lines
  if (contracted.length < 50) {
    return { imports: result.imports, exports: result.exports, signatures: result.signatures, types: result.types, raw: lines.slice(0, 80).join("\n") + "\n// ... (" + (lines.length - 80) + " more lines)" };
  }
  return { imports: result.imports, exports: result.exports, signatures: result.signatures, types: result.types, raw: contracted };
}

export function contractsToString(contracts) {
  return contracts.raw || "";
}
