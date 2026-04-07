import { LANGS } from "../config/languages.js";

function escHTML(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function doAnalyze(code, lang, tv) {
  var lg = [], lines = code.split("\n"), lc = lines.length;
  lines.forEach(function(l,i) {
    var n = i+1;
    if (lang==="python") {
      if (/^\s*print\s+[^\x28]/.test(l) && !/^\s*#/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": print sin paréntesis"});
      if (/\.iteritems/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": .iteritems() usar .items()"});
      if (/\.has_key/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": .has_key() usar in"});
      if (/\bimport\s+urllib2/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": urllib2 usar urllib.request"});
      if (/\bimport\s+ConfigParser/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": ConfigParser usar configparser"});
      if (/\bbasestring\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": basestring usar str"});
    }
    if (lang==="javascript") {
      if (/\bvar\s+\w+/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": var usar const/let"});
      if (/\.prototype\./.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": prototype usar class"});
    }
    if (lang==="java") {
      if (/Collections\.sort/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": Collections.sort usar list.sort()"});
      if (/new\s+SimpleDateFormat/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": SimpleDateFormat usar java.time"});
      if (/new\s+Comparator/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": Comparator usar lambda"});
    }
    if (lang==="csharp") {
      var nc = tv && (tv.indexOf(".NET 6")>=0||tv.indexOf(".NET 8")>=0||tv.indexOf("Core")>=0);
      if (/System\.Web/.test(l) && nc) lg.push({tp:"error",tx:"Ln "+n+": System.Web no existe en .NET Core"});
      if (/ConfigurationManager/.test(l) && nc) lg.push({tp:"error",tx:"Ln "+n+": ConfigManager usar IConfiguration"});
      if (/BeginInvoke/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": BeginInvoke usar async/await"});
      if (/log4net/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": log4net usar ILogger"});
    }
    if (lang==="kotlin"||lang==="java") {
      if (/\bAsyncTask\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": AsyncTask deprecated → Coroutines + viewModelScope"});
      if (/\bLocalBroadcastManager\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": LocalBroadcastManager deprecated → SharedFlow/LiveData"});
      if (/\bstartActivityForResult\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": startActivityForResult deprecated → ActivityResultContracts"});
      if (/\bonActivityResult\b/.test(l)&&!/super/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": onActivityResult deprecated → registerForActivityResult"});
      if (/\bIntentService\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": IntentService deprecated → WorkManager"});
      if (/android\.support\./.test(l)) lg.push({tp:"error",tx:"Ln "+n+": android.support.* → AndroidX (androidx.*)"});
      if (/\bfindViewById\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": findViewById → ViewBinding o Compose"});
      if (/\bButterKnife\b|\bBindView\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": ButterKnife deprecated → ViewBinding"});
      if (/new\s+Thread\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": new Thread() → Coroutines o ExecutorService"});
      if (/\bHandler\s*\x28/.test(l)&&/Looper/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": Handler+Looper → withContext(Dispatchers.Main)"});
      if (/\bArrayAdapter\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": ArrayAdapter/ListView → RecyclerView+ListAdapter o LazyColumn"});
      if (/\bSharedPreferences\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": SharedPreferences → DataStore (Jetpack)"});
      if (/\bEventBus\b/.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": EventBus → SharedFlow/StateFlow"});
      if (lang==="kotlin") {
        if (/\.subscribe\s*\x28/.test(l)&&!/\/\//.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": RxJava .subscribe() → Flow .collect { }"});
        if (/\bGlobalScope\b/.test(l)) lg.push({tp:"error",tx:"Ln "+n+": GlobalScope → viewModelScope/lifecycleScope (structured concurrency)"});
        if (/\brunBlocking\b/.test(l)&&!/test/i.test(l)) lg.push({tp:"warn",tx:"Ln "+n+": runBlocking en producción → suspend fun"});
      }
    }
  });
  var e = lg.filter(function(x){return x.tp==="error"}).length;
  var w = lg.filter(function(x){return x.tp==="warn"}).length;
  return {ok:e===0,logs:lg,stats:{e:e,w:w,l:lc}};
}

export function generateReportHTML(report, files, sl, sv, tl, tv, t) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var r=report;
  var html="<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>MigraOps - "+t.andReport+"</title>";
  html+="<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;padding:40px}";
  html+=".container{max-width:900px;margin:0 auto}.header{background:linear-gradient(135deg,#0C1E3F,#2563EB);color:#fff;padding:30px;border-radius:12px;margin-bottom:24px}";
  html+="h1{font-size:24px;margin-bottom:8px}h2{font-size:18px;color:#0C1E3F;margin:20px 0 10px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}h3{font-size:14px;margin:12px 0 6px}";
  html+=".card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.04)}";
  html+=".badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}";
  html+=".badge-critical{background:#fef2f2;color:#dc2626}.badge-major{background:#fffbeb;color:#d97706}.badge-minor{background:#f0fdf4;color:#059669}";
  html+=".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}";
  html+=".score-circle{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff}";
  html+=".phase{border-left:3px solid #2563EB;padding-left:12px;margin-bottom:12px}";
  html+=".breach-row{padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px}";
  html+=".footer{text-align:center;margin-top:30px;font-size:11px;color:#94a3b8}";
  html+="table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;text-align:left;padding:6px 8px;font-weight:700}td{padding:6px 8px;border-bottom:1px solid #f1f5f9}";
  html+="</style></head><body><div class=\"container\">";
  html+="<div class=\"header\"><h1>\ud83d\udcf1 MigraOps — "+t.andReport+"</h1>";
  html+="<p>"+escHTML(sn)+" "+escHTML(sv)+" → "+escHTML(tn)+" "+escHTML(tv)+" | "+files.length+" archivos | "+(new Date()).toLocaleDateString()+"</p></div>";
  html+="<div class=\"grid\"><div class=\"card\"><h3>"+t.andBreach+" Risk Score</h3>";
  html+="<div class=\"score-circle\" style=\"background:"+(r.riskScore>70?"#dc2626":r.riskScore>40?"#d97706":"#059669")+"\">"+(r.riskScore||0)+"</div></div>";
  html+="<div class=\"card\"><h3>Readiness Score</h3>";
  html+="<div class=\"score-circle\" style=\"background:"+(r.readinessScore>=70?"#059669":r.readinessScore>=40?"#d97706":"#dc2626")+"\">"+(r.readinessScore||0)+"</div></div></div>";
  if(r.summary){html+="<div class=\"card\"><h2>"+t.summary+"</h2><p style=\"font-size:13px;line-height:1.6\">"+escHTML(r.summary)+"</p></div>";}
  if(r.architecture){html+="<div class=\"card\"><h2>"+t.andArch+"</h2><div class=\"grid\"><div><h3>"+t.andPattern+"</h3><p>"+escHTML(r.architecture.current)+"</p></div><div><h3>"+t.andTarget+"</h3><p>"+escHTML(r.architecture.target)+"</p></div></div></div>";}
  if(r.breaches&&r.breaches.length){
    html+="<div class=\"card\"><h2>"+t.andBreach+" ("+r.breaches.length+")</h2><table><tr><th>"+t.andPriority+"</th><th>Archivo</th><th>"+t.andPattern+"</th><th>"+t.andTarget+"</th><th>"+t.andImpact+"</th></tr>";
    r.breaches.forEach(function(b){
      html+="<tr><td><span class=\"badge badge-"+escHTML(b.impact)+"\">"+escHTML(b.impact)+"</span></td><td style=\"font-family:monospace\">"+escHTML(b.file)+(b.line?":"+escHTML(b.line):"")+"</td><td>"+escHTML(b.current)+"</td><td>"+escHTML(b.target)+"</td><td>"+escHTML(b.effort)+"</td></tr>";
    });
    html+="</table></div>";
  }
  if(r.refactorPlan&&r.refactorPlan.length){
    html+="<div class=\"card\"><h2>"+t.andRefactor+"</h2>";
    r.refactorPlan.forEach(function(p){
      html+="<div class=\"phase\"><h3>Fase "+p.phase+": "+escHTML(p.name)+"</h3><p style=\"font-size:12px;color:#475569\">"+escHTML(p.description)+"</p><ul style=\"font-size:12px;margin:6px 0 6px 16px\">";
      if(p.tasks)p.tasks.forEach(function(t2){html+="<li>"+escHTML(t2)+"</li>"});
      html+="</ul><p style=\"font-size:11px;color:#94a3b8\">"+t.andEffort+": "+escHTML(p.estimatedEffort)+"</p></div>";
    });
    html+="</div>";
  }
  if(r.libraryUpdates&&r.libraryUpdates.length){
    html+="<div class=\"card\"><h2>"+t.andLibs+"</h2><table><tr><th>Actual</th><th>Recomendado</th><th>Breaking</th></tr>";
    r.libraryUpdates.forEach(function(l){
      html+="<tr><td style=\"font-family:monospace\">"+escHTML(l.current)+"</td><td style=\"font-family:monospace\">"+escHTML(l.recommended)+"</td><td>"+(l.breaking?"\u26a0\ufe0f Si":"\u2705 No")+"</td></tr>";
    });
    html+="</table></div>";
  }
  if(r.modularization){
    html+="<div class=\"card\"><h2>"+t.andModular+"</h2>";
    html+="<h3>Actual: "+escHTML(r.modularization.current)+"</h3>";
    if(r.modularization.recommended){
      html+="<div class=\"grid\">";
      r.modularization.recommended.forEach(function(m){
        html+="<div style=\"padding:8px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0\"><b>"+escHTML(m.module)+"</b><ul style=\"font-size:11px;margin:4px 0 0 12px\">";
        if(m.contents)m.contents.forEach(function(c){html+="<li>"+escHTML(c)+"</li>"});
        html+="</ul></div>";
      });
      html+="</div>";
    }
    html+="</div>";
  }
  html+="<div class=\"footer\">MigraOps v4.4 — SII Group Chile | Generado: "+(new Date()).toISOString()+"</div>";
  html+="</div></body></html>";
  return html;
}

export function exportTestsAsCode(suite, lang, targetLang) {
  if(!suite||!suite.tests) return "";
  var tn=(LANGS[targetLang]||{}).n||targetLang;
  var safeName=function(s){return (s||"test").replace(/[^a-zA-Z0-9_]/g,"_")};
  var safeLabel=function(s){return (s||"case").replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()};

  if(targetLang==="javascript"||targetLang==="typescript") {
    var ext=targetLang==="typescript"?"ts":"js";
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: Jest"+(targetLang==="typescript"?" + ts-jest":"")+"\n// Run: npx jest tests/migraops.test."+ext+"\n// Install: npm install --save-dev jest"+(targetLang==="typescript"?" ts-jest @types/jest":"")+"\n\n";
    if(targetLang==="typescript") code+="// tsconfig.jest.json: { \"compilerOptions\": { \"module\": \"commonjs\", \"target\": \"es6\" } }\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      code+="// Source: "+test.file+" — "+test.name+"\n";
      code+="describe('"+test.name+"', () => {\n";
      (test.cases||[]).forEach(function(tc){
        code+="  test('"+tc.label+"', () => {\n";
        code+="    const input = "+JSON.stringify(typeof tc.input==='string'?JSON.parse(tc.input):tc.input)+";\n";
        code+="    const expected = "+JSON.stringify(typeof tc.expected==='string'?JSON.parse(tc.expected):tc.expected)+";\n";
        code+="    const result = "+fn+"(input);\n";
        code+="    expect(result).toEqual(expected);\n";
        code+="  });\n\n";
      });
      code+="  test('should not throw on undefined input', () => {\n";
      code+="    expect(() => "+fn+"(undefined)).not.toThrow();\n";
      code+="  });\n";
      code+="});\n\n";
    });
    return code;
  }

  if(targetLang==="python") {
    var code="# MigraOps v4.5 — Generated Test Suite\n# Framework: pytest\n# Run: pytest tests/test_migraops.py -v\n# Install: pip install pytest\n\nimport pytest\nimport json\n\n";
    suite.tests.forEach(function(test){
      var cls=safeName(test.function);
      cls=cls.charAt(0).toUpperCase()+cls.slice(1);
      code+="# Source: "+test.file+" — "+test.name+"\n";
      code+="class Test"+cls+":\n";
      code+="    \"\"\"Tests for "+test.function+" from "+test.file+"\"\"\"\n\n";
      (test.cases||[]).forEach(function(tc){
        var lbl=safeLabel(tc.label);
        code+="    def test_"+lbl+"(self):\n";
        code+="        \"\"\""+tc.label+"\"\"\"\n";
        code+="        input_data = "+JSON.stringify(typeof tc.input==='string'?JSON.parse(tc.input):tc.input)+"\n";
        code+="        expected = "+JSON.stringify(typeof tc.expected==='string'?JSON.parse(tc.expected):tc.expected)+"\n";
        code+="        result = "+test.function+"(input_data)\n";
        code+="        assert result == expected, f\"Expected {expected}, got {result}\"\n\n";
      });
      code+="    def test_none_input(self):\n";
      code+="        \"\"\"Should handle None input gracefully\"\"\"\n";
      code+="        try:\n";
      code+="            "+test.function+"(None)\n";
      code+="        except (TypeError, ValueError, AttributeError):\n";
      code+="            pass  # Expected for None input\n\n\n";
    });
    return code;
  }

  if(targetLang==="java") {
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: JUnit 5\n// Run: mvn test -Dtest=MigraOpsTest\n// Dependency: org.junit.jupiter:junit-jupiter:5.10+\n\npackage com.migraops.tests;\n\nimport org.junit.jupiter.api.Test;\nimport org.junit.jupiter.api.DisplayName;\nimport org.junit.jupiter.api.Nested;\nimport static org.junit.jupiter.api.Assertions.*;\n\n";
    code+="class MigraOpsTest {\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      code+="    @Nested\n";
      code+="    @DisplayName(\""+test.name+" ("+test.file+")\")\n";
      code+="    class "+fn.charAt(0).toUpperCase()+fn.slice(1)+"Tests {\n\n";
      (test.cases||[]).forEach(function(tc,i){
        code+="        @Test\n";
        code+="        @DisplayName(\""+tc.label+"\")\n";
        code+="        void test_"+safeLabel(tc.label)+"() {\n";
        code+="            // Input: "+JSON.stringify(tc.input)+"\n";
        code+="            // Expected: "+JSON.stringify(tc.expected)+"\n";
        code+="            // TODO: instantiate class and call "+test.function+"()\n";
        code+="            // var result = instance."+test.function+"(input);\n";
        code+="            // assertEquals(expected, result);\n";
        code+="        }\n\n";
      });
      code+="        @Test\n";
      code+="        @DisplayName(\"Should handle null input\")\n";
      code+="        void test_null_input() {\n";
      code+="            assertDoesNotThrow(() -> {\n";
      code+="                // TODO: instance."+test.function+"(null);\n";
      code+="            });\n";
      code+="        }\n";
      code+="    }\n\n";
    });
    code+="}\n";
    return code;
  }

  if(targetLang==="kotlin") {
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: kotlin.test + JUnit 5\n// Run: gradle test\n// Dependency: org.jetbrains.kotlin:kotlin-test-junit5\n\npackage com.migraops.tests\n\nimport kotlin.test.Test\nimport kotlin.test.assertEquals\nimport kotlin.test.assertNotNull\nimport kotlin.test.assertFailsWith\nimport org.junit.jupiter.api.DisplayName\nimport org.junit.jupiter.api.Nested\n\n";
    code+="class MigraOpsTest {\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      code+="    @Nested\n";
      code+="    @DisplayName(\""+test.name+" ("+test.file+")\")\n";
      code+="    inner class "+fn.charAt(0).toUpperCase()+fn.slice(1)+"Tests {\n\n";
      (test.cases||[]).forEach(function(tc){
        code+="        @Test\n";
        code+="        @DisplayName(\""+tc.label+"\")\n";
        code+="        fun `"+tc.label.replace(/`/g,"'")+"`() {\n";
        code+="            // Input: "+JSON.stringify(tc.input)+"\n";
        code+="            // Expected: "+JSON.stringify(tc.expected)+"\n";
        code+="            // TODO: val result = instance."+test.function+"(input)\n";
        code+="            // assertEquals(expected, result)\n";
        code+="        }\n\n";
      });
      code+="        @Test\n";
      code+="        @DisplayName(\"Should handle null input\")\n";
      code+="        fun `handle null gracefully`() {\n";
      code+="            // TODO: val result = instance."+test.function+"(null)\n";
      code+="            // assertNotNull(result) or assertFailsWith<IllegalArgumentException> { ... }\n";
      code+="        }\n";
      code+="    }\n\n";
    });
    code+="}\n";
    return code;
  }

  if(targetLang==="csharp") {
    var code="// MigraOps v4.5 — Generated Test Suite\n// Framework: xUnit\n// Run: dotnet test\n// Package: xunit 2.6+, xunit.runner.visualstudio\n\nusing Xunit;\nusing System;\n\nnamespace MigraOps.Tests;\n\n";
    suite.tests.forEach(function(test){
      var fn=safeName(test.function);
      var cls=fn.charAt(0).toUpperCase()+fn.slice(1);
      code+="/// <summary>Tests for "+test.function+" from "+test.file+"</summary>\n";
      code+="public class "+cls+"Tests\n{\n";
      (test.cases||[]).forEach(function(tc){
        var lbl=safeLabel(tc.label);
        var methodName=lbl.split("_").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join("");
        code+="    [Fact]\n";
        code+="    public void "+methodName+"()\n";
        code+="    {\n";
        code+="        // "+tc.label+"\n";
        code+="        // Input: "+JSON.stringify(tc.input)+"\n";
        code+="        // Expected: "+JSON.stringify(tc.expected)+"\n";
        code+="        // TODO: var result = sut."+test.function+"(input);\n";
        code+="        // Assert.Equal(expected, result);\n";
        code+="    }\n\n";
      });
      code+="    [Fact]\n";
      code+="    public void HandleNullInput()\n";
      code+="    {\n";
      code+="        // Should handle null gracefully\n";
      code+="        // var ex = Record.Exception(() => sut."+test.function+"(null));\n";
      code+="        // Assert.Null(ex); // or Assert.IsType<ArgumentNullException>(ex);\n";
      code+="    }\n";
      code+="}\n\n";
    });
    return code;
  }

  // Fallback for any other language
  var code="// MigraOps v4.5 — Generated Test Suite ("+tn+")\n// Adapt to your preferred testing framework\n\n";
  suite.tests.forEach(function(test){
    code+="// Test: "+test.name+" ("+test.file+"::"+test.function+")\n";
    (test.cases||[]).forEach(function(tc){
      code+="//   Case: "+tc.label+"\n";
      code+="//     Input:    "+JSON.stringify(tc.input)+"\n";
      code+="//     Expected: "+JSON.stringify(tc.expected)+"\n";
    });
    code+="\n";
  });
  return code;
}
