// ═══ Lite Validator — heuristic QA without API calls ═══
// Detects truncation, bracket imbalance, source-language leakage,
// missing functions, and placeholder code. Runs for ALL tiers.

// ── Source-language exclusive keyword patterns (regex strings) ──
// Only patterns unlikely to appear in valid target code are listed.
var LANG_KEYWORDS = {
  python:     ["\\bdef\\b", "\\belif\\b", "\\bself\\.", "__init__", "__name__", "\\bNone\\b", "\\bTrue\\b", "\\bFalse\\b", "\\blambda\\b"],
  javascript: ["\\bvar\\b ", "\\blet\\b ", "\\bconst\\b ", "===", "!==", "\\bundefined\\b", "console\\.log", "\\brequire\\(", "module\\.exports"],
  typescript: ["\\binterface\\b ", ":\\s*string\\b", ":\\s*number\\b", ":\\s*boolean\\b", "\\bas\\s+any\\b", "\\breadonly\\b "],
  java:       ["\\bpublic\\s+class\\b", "\\bstatic\\s+void\\b", "System\\.out", "\\bthrows\\b ", "\\bimplements\\b ", "@Override"],
  csharp:     ["\\bnamespace\\b ", "using\\s+System", "Console\\.Write", "\\basync\\s+Task\\b", "get;\\s*set;"],
  go:         ["\\bfunc\\b ", "fmt\\.", "\\bpackage\\b ", ":=", "\\bdefer\\b ", "\\bchan\\b "],
  rust:       ["\\bfn\\b ", "\\blet\\s+mut\\b", "\\bimpl\\b ", "\\bunwrap\\(\\)", "Vec<", "Option<", "Result<", "println!"],
  php:        ["<\\?php", "\\$this->", "\\becho\\b "],
  ruby:       ["\\bputs\\b ", "require_relative", "attr_accessor", "\\.each\\s+do"],
  kotlin:     ["\\bfun\\b ", "\\bval\\b ", "companion\\s+object", "data\\s+class", "suspend\\s+fun", "sealed\\s+class"]
};

// ── Function definition patterns per language ──
var FUNC_PATTERNS = {
  python:     /^\s*(def |class )/gm,
  javascript: /\b(function\b|=>\s*[{(]|class\b)/g,
  typescript: /\b(function\b|=>\s*[{(]|class\b|interface\b)/g,
  java:       /\b(public|private|protected)\s+\S+\s+\w+\s*\(/g,
  csharp:     /\b(public|private|protected|internal)\s+\S+\s+\w+\s*\(/g,
  go:         /^func\b/gm,
  rust:       /\bfn\b/g,
  php:        /\bfunction\b/g,
  ruby:       /^\s*def\b/gm,
  kotlin:     /\bfun\b/g
};

// ── Placeholder patterns (universal) ──
var PLACEHOLDER_RX = /\b(TODO|FIXME|HACK|XXX|NOT\s*IMPLEMENTED|STUB)\b|pass\s*#|\.{3}\s*$|raise\s+NotImplementedError|throw\s+[^\n]{0,200}not\s*implemented/gim;

// ═══ Scoring Functions ═══

function scoreStructural(original, migrated) {
  var issues = [];
  var score = 0;

  // S1: Empty output
  if (!migrated || migrated.trim().length === 0) {
    issues.push({ severity: "critical", msg: "Output is empty", dimension: "structural" });
    return { score: 0, issues: issues };
  }
  score += 5;

  // S2: Truncation ratio
  var origLines = original.split("\n").length;
  var migLines = migrated.split("\n").length;
  var ratio = origLines > 0 ? migLines / origLines : 1;

  if (ratio < 0.15) {
    issues.push({ severity: "critical", msg: "Output severely truncated: " + migLines + " lines vs " + origLines + " original (" + Math.round(ratio * 100) + "%)", dimension: "structural" });
  } else if (ratio < 0.35) {
    issues.push({ severity: "major", msg: "Output may be truncated: " + migLines + " lines vs " + origLines + " original (" + Math.round(ratio * 100) + "%)", dimension: "structural" });
    score += 5;
  } else {
    score += 15;
  }

  // S3: Bracket balance
  var pairs = [["{", "}"], ["(", ")"], ["[", "]"]];
  var totalDelta = 0;
  for (var p = 0; p < pairs.length; p++) {
    var openRx = new RegExp("\\" + pairs[p][0], "g");
    var closeRx = new RegExp("\\" + pairs[p][1], "g");
    var opens = (migrated.match(openRx) || []).length;
    var closes = (migrated.match(closeRx) || []).length;
    totalDelta += Math.abs(opens - closes);
  }

  if (totalDelta > 5) {
    issues.push({ severity: "critical", msg: "Severely unbalanced brackets: delta " + totalDelta, dimension: "structural" });
  } else if (totalDelta > 2) {
    issues.push({ severity: "major", msg: "Unbalanced brackets: delta " + totalDelta, dimension: "structural" });
    score += 3;
  } else if (totalDelta > 0) {
    issues.push({ severity: "minor", msg: "Slightly unbalanced brackets: delta " + totalDelta, dimension: "structural" });
    score += 7;
  } else {
    score += 10;
  }

  return { score: Math.min(30, score), issues: issues };
}

function scoreSemantic(original, migrated, sourceLang, targetLang) {
  var issues = [];
  var score = 0;

  // M1: Function count preservation
  var srcPattern = FUNC_PATTERNS[sourceLang];
  var tgtPattern = FUNC_PATTERNS[targetLang];
  if (srcPattern && tgtPattern) {
    var srcCount = (original.match(new RegExp(srcPattern.source, srcPattern.flags)) || []).length;
    var tgtCount = (migrated.match(new RegExp(tgtPattern.source, tgtPattern.flags)) || []).length;
    if (srcCount > 0) {
      var funcRatio = tgtCount / srcCount;
      if (funcRatio < 0.4) {
        issues.push({ severity: "critical", msg: "Missing functions: " + tgtCount + " found vs " + srcCount + " in original (" + Math.round(funcRatio * 100) + "%)", dimension: "semantic" });
      } else if (funcRatio < 0.7) {
        issues.push({ severity: "major", msg: "Some functions may be missing: " + tgtCount + " vs " + srcCount + " original", dimension: "semantic" });
        score += 8;
      } else {
        score += 20;
      }
    } else {
      score += 20; // No functions in source — nothing to compare
    }
  } else {
    score += 20; // Unknown language — skip check
  }

  // M2: Placeholder detection
  var placeholders = migrated.match(PLACEHOLDER_RX) || [];
  if (placeholders.length > 3) {
    issues.push({ severity: "major", msg: "Placeholder code detected: " + placeholders.length + " instances (" + placeholders.slice(0, 3).join(", ") + "...)", dimension: "semantic" });
    score += 5;
  } else if (placeholders.length > 0) {
    issues.push({ severity: "minor", msg: "Placeholder code detected: " + placeholders.join(", "), dimension: "semantic" });
    score += 12;
  } else {
    score += 15;
  }

  // M3: Non-trivial content (at least some actual code, not just comments)
  var codeLines = migrated.split("\n").filter(function(l) {
    var t = l.trim();
    return t.length > 0 && !t.startsWith("//") && !t.startsWith("#") && !t.startsWith("*") && !t.startsWith("/*");
  });
  if (codeLines.length < 3) {
    issues.push({ severity: "major", msg: "Output contains mostly comments, only " + codeLines.length + " code lines", dimension: "semantic" });
  } else {
    score += 5;
  }

  return { score: Math.min(40, score), issues: issues };
}

function scoreLanguage(migrated, sourceLang, targetLang) {
  var issues = [];
  var score = 0;

  // Same-language migration (version upgrade) — skip keyword check
  if (sourceLang === targetLang) return { score: 30, issues: [] };

  var sourceKW = LANG_KEYWORDS[sourceLang] || [];
  var targetKW = LANG_KEYWORDS[targetLang] || [];

  // Exclude keywords shared between source and target
  var targetSet = {};
  for (var t = 0; t < targetKW.length; t++) targetSet[targetKW[t]] = true;
  var exclusive = sourceKW.filter(function(kw) { return !targetSet[kw]; });

  var totalHits = 0;
  var hitDetails = [];
  for (var k = 0; k < exclusive.length; k++) {
    try {
      var rx = new RegExp(exclusive[k], "g");
      var matches = migrated.match(rx) || [];
      if (matches.length > 0) {
        totalHits += matches.length;
        hitDetails.push(exclusive[k].replace(/\\/g, "") + " (" + matches.length + "x)");
      }
    } catch (e) { /* skip invalid regex */ }
  }

  if (totalHits > 5) {
    issues.push({ severity: "critical", msg: "Source language (" + sourceLang + ") keywords in output: " + hitDetails.slice(0, 5).join(", "), dimension: "language" });
    score = 0;
  } else if (totalHits > 2) {
    issues.push({ severity: "major", msg: "Source language leakage: " + hitDetails.join(", "), dimension: "language" });
    score = 10;
  } else if (totalHits > 0) {
    issues.push({ severity: "minor", msg: "Possible source remnants: " + hitDetails.join(", "), dimension: "language" });
    score = 20;
  } else {
    score = 30;
  }

  return { score: score, issues: issues };
}

// ═══ Public API ═══

export function validateLite(original, migrated, sourceLang, targetLang) {
  // Guard against very large inputs — cap to avoid blocking UI
  if (original && original.length > 500000) original = original.slice(0, 500000);
  if (migrated && migrated.length > 500000) migrated = migrated.slice(0, 500000);

  if (!migrated || !migrated.trim()) {
    return {
      ok: true, pass: false, score: 0,
      structural: 0, semantic: 0, language: 0,
      issues: [{ severity: "critical", msg: "Output is empty", dimension: "structural" }],
      summary: "Lite QA: 0/100 — empty output (FAIL)",
      lite: true
    };
  }

  var s = scoreStructural(original || "", migrated);
  var m = scoreSemantic(original || "", migrated, sourceLang, targetLang);
  var l = scoreLanguage(migrated, sourceLang, targetLang);

  var total = s.score + m.score + l.score;
  var allIssues = s.issues.concat(m.issues).concat(l.issues);
  var hasCritical = allIssues.some(function(i) { return i.severity === "critical"; });
  var pass = total >= 60 && !hasCritical;

  var critCount = allIssues.filter(function(i) { return i.severity === "critical"; }).length;
  var majorCount = allIssues.filter(function(i) { return i.severity === "major"; }).length;

  return {
    ok: true,
    pass: pass,
    score: total,
    structural: s.score,
    semantic: m.score,
    language: l.score,
    issues: allIssues,
    summary: "Lite QA: " + total + "/100" +
      (critCount ? " — " + critCount + " critical" : "") +
      (majorCount ? ", " + majorCount + " major" : "") +
      (pass ? " (PASS)" : " (FAIL)"),
    lite: true
  };
}
