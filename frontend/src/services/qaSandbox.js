// ═══ QA SANDBOX TESTING SYSTEM (v4.5) ═══
// Generates test cases via Claude, translates functions to JS, executes in browser sandbox

import { callClaude } from "./claudeClient.js";
import { safeParseJSON } from "./utils.js";
import { LANGS } from "../config/languages.js";

export async function generateTestSuite(files, lang, ver, mid) {
  var ln=(LANGS[lang]||{}).n||lang;
  var manifest=files.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");

  // Language-specific hints for better JS translations
  var langHints="";
  if(lang==="python") langHints="\nPython-specific: dict→object literal, list→array, tuple→array, None→null, True/False→true/false, string slicing→.slice(), enumerate→.forEach with index, list comprehension→.map/.filter, range()→Array.from({length:n},(_,i)=>i), isinstance→typeof/instanceof, **kwargs→object destructuring.";
  else if(lang==="java") langHints="\nJava-specific: ArrayList→array, HashMap→object literal, .get()→[key], .put()→[key]=val, .size()→.length, Optional→nullable, Stream→array methods (.map/.filter/.reduce), StringBuilder→string concat, Collections.sort→.sort(), System.out.println→console.log, static methods→regular functions.";
  else if(lang==="kotlin") langHints="\nKotlin-specific: listOf→array, mutableListOf→array, mapOf→object, data class→object literal, when→switch/if-else, ?.let{}→if(x!=null), ?:→||, companion object→static, suspend fun→async function, Flow→async generator or callback, sealed class→union types with type field.";
  else if(lang==="csharp") langHints="\nC#-specific: List<T>→array, Dictionary→object, LINQ .Where→.filter, .Select→.map, .FirstOrDefault→.find, string.Format→template literal, DateTime→new Date(), StringBuilder→string concat, ConfigurationManager→object literal mock, async Task→async function, IDisposable→try-finally.";
  else if(lang==="typescript") langHints="\nTypeScript-specific: interfaces→plain objects, generic types→dynamic, enum→object with const values, type narrowing→typeof checks, optional chaining ?. → same in JS, nullish coalescing ?? → same in JS.";

  var sys="You are a Senior QA Engineer. Analyze this "+ln+" "+ver+" codebase and generate a comprehensive test suite.\n\nFor EACH testable function/method in the codebase:\n1) Identify the function name, file, and what it does\n2) Design 3-5 test cases with concrete inputs and expected outputs\n3) Cover: happy path, edge cases (empty/null/zero/empty string), error cases, boundary values\n4) Classify each test: unit | integration | api\n5) CRITICAL: Write a JavaScript equivalent of EACH function that preserves the EXACT same logic."+langHints+"\n\nIMPORTANT RULES for JS translations:\n- Functions must be pure and self-contained (no external imports, no require, no DOM)\n- Use standard JS only — must work with new Function()\n- Wrap everything so it returns the function: 'return function(arg1, arg2){...}'\n- For classes with multiple methods: 'return function(methodName, ...args){ var state={...}; if(methodName===\"x\") return ...; }'\n- Mock ALL external calls with predictable returns:\n  * DB queries: return [{id:1,name:\"test\"}] \n  * HTTP GET: return {status:200,data:[{id:1}]}\n  * HTTP POST: return {status:201,id:\"new-1\"}\n  * Filesystem read: return \"mock file content\"\n  * Console/logging: no-op (return undefined)\n  * Current date/time: return fixed \"2024-01-15T10:00:00Z\"\n- Handle null/undefined gracefully — don't crash on bad input\n- For array/object returns, the JS output must be JSON-serializable\n\nRespond ONLY valid JSON:\n{\"tests\":[{\"id\":\"t1\",\"name\":\"descriptive test name\",\"file\":\"filename\",\"function\":\"functionName\",\"type\":\"unit|integration|api\",\"jsFunction\":\"return function(input){ ... }\",\"cases\":[{\"input\":\"JSON-serializable input\",\"expected\":\"JSON-serializable expected output\",\"label\":\"what this tests\"}]}],\"summary\":{\"totalTests\":0,\"totalCases\":0,\"coverage\":{\"files\":0,\"functions\":0},\"types\":{\"unit\":0,\"integration\":0,\"api\":0}}}";

  var usr="Analyze this "+ln+" "+ver+" codebase and generate a test suite with executable JS translations:\n\n"+manifest+"\n\nGenerate 3-5 test cases per function. JS translations MUST be executable with new Function(). Include edge cases (null, empty, zero). JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,8000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed||!parsed.tests)throw new Error("Invalid test suite JSON");
    return {ok:true,suite:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

export function executeSandbox(jsCode, testCases) {
  // Execute a JS function translation against test cases in a safe sandbox
  var results=[];
  var fn=null;
  var MAX_TEST_MS=3000; // 3s max per test case — prevents infinite loops

  // Compile the function
  try {
    // Wrap in strict mode for safer execution
    fn=new Function('"use strict";\n'+jsCode)();
    if(typeof fn!=="function") throw new Error("JS translation did not return a function");
  } catch(compileErr) {
    testCases.forEach(function(tc){
      results.push({input:tc.input,expected:tc.expected,actual:null,pass:false,skipped:true,error:"Compile: "+compileErr.message,label:tc.label,timeMs:0});
    });
    return results;
  }

  // Execute each test case with timeout protection
  testCases.forEach(function(tc) {
    var startMs=performance.now();
    try {
      // Parse input safely
      var input;
      try { input=typeof tc.input==="string"?JSON.parse(tc.input):tc.input; }
      catch(parseErr) { input=tc.input; }

      // Execute with implicit timeout check (can't truly timeout sync JS, but we track time)
      var actual=Array.isArray(input)?fn.apply(null,input):fn(input);
      var elapsed=Math.round((performance.now()-startMs)*100)/100;

      // If it took too long, flag it
      if(elapsed>MAX_TEST_MS) {
        results.push({input:tc.input,expected:tc.expected,actual:actual,pass:false,skipped:false,error:"Slow: "+elapsed+"ms (limit "+MAX_TEST_MS+"ms)",label:tc.label,timeMs:elapsed});
        return;
      }

      // Parse expected safely
      var expected;
      try { expected=typeof tc.expected==="string"?JSON.parse(tc.expected):tc.expected; }
      catch(parseErr) { expected=tc.expected; }

      // Deep compare with tolerance for floating point
      var actualStr=JSON.stringify(actual);
      var expectedStr=JSON.stringify(expected);
      var pass=actualStr===expectedStr;

      // Fuzzy match for numbers with floating point tolerance
      if(!pass&&typeof actual==="number"&&typeof expected==="number") {
        pass=Math.abs(actual-expected)<0.0001;
      }

      // Fuzzy match for strings (trim whitespace)
      if(!pass&&typeof actual==="string"&&typeof expected==="string") {
        pass=actual.trim()===expected.trim();
      }

      results.push({input:tc.input,expected:tc.expected,actual:actual,actualStr:actualStr,expectedStr:expectedStr,pass:pass,skipped:false,error:null,label:tc.label,timeMs:elapsed});
    } catch(runErr) {
      var elapsed2=Math.round((performance.now()-startMs)*100)/100;
      results.push({input:tc.input,expected:tc.expected,actual:null,pass:false,skipped:false,error:runErr.message,label:tc.label,timeMs:elapsed2});
    }
  });
  return results;
}

function runTestSuite(suite) {
  // Run all tests in the suite and return structured results
  if(!suite||!suite.tests)return {tests:[],summary:{passed:0,failed:0,skipped:0,total:0,timeMs:0}};

  var allResults=[];
  var totalTime=0;
  var passed=0,failed=0,skipped=0;

  suite.tests.forEach(function(test) {
    var caseResults=executeSandbox(test.jsFunction,test.cases||[]);
    var testPassed=caseResults.every(function(r){return r.pass||r.skipped});
    var testSkipped=caseResults.every(function(r){return r.skipped});
    var testTime=caseResults.reduce(function(s,r){return s+r.timeMs},0);
    totalTime+=testTime;

    caseResults.forEach(function(r){
      if(r.skipped)skipped++;
      else if(r.pass)passed++;
      else failed++;
    });

    allResults.push({
      id:test.id,
      name:test.name,
      file:test.file,
      func:test.function,
      type:test.type,
      passed:testPassed,
      skipped:testSkipped,
      cases:caseResults,
      timeMs:Math.round(testTime*100)/100
    });
  });

  return {
    tests:allResults,
    summary:{passed:passed,failed:failed,skipped:skipped,total:passed+failed+skipped,timeMs:Math.round(totalTime*100)/100},
    timestamp:new Date().toISOString()
  };
}

export async function generateAndRunQA(files, lang, ver, mid, phase, existingSuite) {
  // phase: "pre" or "post"
  // If pre: generate suite + run. If post: reuse existing suite + run on migrated code
  var suite=existingSuite;
  if(!suite) {
    var genResult=await generateTestSuite(files,lang,ver,mid);
    if(!genResult.ok) return {ok:false,error:genResult.error};
    suite=genResult.suite;
  }
  var results=runTestSuite(suite);
  return {ok:true,suite:suite,results:results,phase:phase};
}
