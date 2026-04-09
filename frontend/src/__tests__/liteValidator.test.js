import { describe, it, expect } from "vitest";
import { validateLite } from "../services/liteValidator.js";

// Helper: generate N lines of code
function makeCode(n, prefix) {
  var lines = [];
  for (var i = 0; i < n; i++) lines.push((prefix || "line") + " " + i);
  return lines.join("\n");
}

describe("liteValidator", function() {

  it("well-migrated code passes validation (score >= 60)", function() {
    var original = "function hello() {\n  console.log('hi');\n}\nfunction bye() {\n  console.log('bye');\n}";
    var migrated = "def hello():\n    print('hi')\n\ndef bye():\n    print('bye')\n";
    var result = validateLite(original, migrated, "javascript", "python");
    expect(result.ok).toBe(true);
    expect(result.pass).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.lite).toBe(true);
  });

  it("truncated code detects truncation issue", function() {
    var original = makeCode(100, "const x =");
    var migrated = makeCode(10, "x =");
    var result = validateLite(original, migrated, "javascript", "python");
    var hasTruncation = result.issues.some(function(i) { return i.msg.toLowerCase().includes("truncat"); });
    expect(hasTruncation).toBe(true);
    expect(result.structural).toBeLessThanOrEqual(15); // Penalized in structural dimension
  });

  it("empty output fails with critical", function() {
    var result = validateLite("function foo() {}", "", "javascript", "python");
    expect(result.pass).toBe(false);
    expect(result.score).toBe(0);
    expect(result.issues[0].severity).toBe("critical");
    expect(result.issues[0].msg).toContain("empty");
  });

  it("unbalanced brackets detected", function() {
    var migrated = "def foo():\n" + makeCode(20, "  x =") + "\n{{{{{";
    var original = makeCode(25, "x =");
    var result = validateLite(original, migrated, "javascript", "python");
    var hasBracket = result.issues.some(function(i) { return i.msg.toLowerCase().includes("bracket"); });
    expect(hasBracket).toBe(true);
  });

  it("source language keywords detected in cross-language migration", function() {
    var original = "const x = 5;\nlet y = 10;\nconsole.log(x + y);";
    var migrated = "const x = 5\nlet y = 10\nconsole.log(x + y)\n" + makeCode(5, "#");
    var result = validateLite(original, migrated, "javascript", "python");
    var hasKeyword = result.issues.some(function(i) { return i.dimension === "language"; });
    expect(hasKeyword).toBe(true);
  });

  it("placeholders detected", function() {
    var original = "function process() {\n  doWork();\n  validate();\n}";
    var migrated = "def process():\n    # TODO implement\n    # FIXME\n    pass # STUB\n    raise NotImplementedError\n";
    var result = validateLite(original, migrated, "javascript", "python");
    var hasPlaceholder = result.issues.some(function(i) { return i.msg.toLowerCase().includes("placeholder"); });
    expect(hasPlaceholder).toBe(true);
  });

  it("missing functions detected", function() {
    var original = "function a() {}\nfunction b() {}\nfunction c() {}\nfunction d() {}\nfunction e() {}";
    var migrated = "def a():\n    pass\n";
    var result = validateLite(original, migrated, "javascript", "python");
    var hasMissing = result.issues.some(function(i) { return i.msg.toLowerCase().includes("missing") || i.msg.toLowerCase().includes("function"); });
    expect(hasMissing).toBe(true);
  });

  it("result is compatible with formatQAFeedback", function() {
    var result = validateLite("x = 1", "x = 1", "python", "python");
    // formatQAFeedback expects { score, issues, summary }
    expect(typeof result.score).toBe("number");
    expect(Array.isArray(result.issues)).toBe(true);
    expect(typeof result.summary).toBe("string");
    expect(result.ok).toBe(true);
    // Each issue should have severity and msg
    result.issues.forEach(function(i) {
      expect(typeof i.severity).toBe("string");
      expect(typeof i.msg).toBe("string");
    });
  });

  it("same-language migration skips keyword check", function() {
    // Version upgrade: JS to JS — "const", "let" are valid in target too
    var original = "const x = 5;\nlet y = 10;";
    var migrated = "const x = 5;\nlet y = 10;";
    var result = validateLite(original, migrated, "javascript", "javascript");
    expect(result.language).toBe(30); // Full score, no keyword penalty
  });

  it("scores break down into structural + semantic + language = total", function() {
    var original = "def hello():\n    print('hello')\n";
    var migrated = "function hello() {\n    console.log('hello');\n}\n";
    var result = validateLite(original, migrated, "python", "javascript");
    expect(result.score).toBe(result.structural + result.semantic + result.language);
    expect(result.structural).toBeLessThanOrEqual(30);
    expect(result.semantic).toBeLessThanOrEqual(40);
    expect(result.language).toBeLessThanOrEqual(30);
  });

  it("null/undefined migrated returns score 0", function() {
    var result = validateLite("code", null, "js", "py");
    expect(result.score).toBe(0);
    expect(result.pass).toBe(false);
    var result2 = validateLite("code", undefined, "js", "py");
    expect(result2.score).toBe(0);
  });
});
