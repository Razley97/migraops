// ═══ Migration Phase Functions — extracted from App.jsx ═══
// Pipeline functions: mapTargetFile, detectVer, doDeepAnalysis, generateAndroidReport,
// doCodebaseAnalysis, doFilePlan, doMigrate, doDependencyAudit, doConsolidation,
// doIntegrationCheck, doIntegrationFix, doReview, doFixPlan

import { LANGS, TARGET_EXT, MODULE_CONVENTIONS } from "../config/languages.js";
import { getParadigmMap } from "../config/paradigmMaps.js";
import { callAgent, callAgentChain } from "./agentClient.js";
import { safeParseJSON } from "./utils.js";

// ═══ Unified scoring rubric (shared across all evaluators) ═══
export var SCORING_RUBRIC="MANDATORY SCORING PROTOCOL:\n1) Score EACH of the 8 layers independently 0-100\n2) Final score = WEIGHTED AVERAGE: imports\u00d710 + architecture\u00d715 + async\u00d715 + security\u00d720 + errors\u00d710 + types\u00d710 + dataflow\u00d710 + idiomatic\u00d710, divided by 100\n3) Show math: (layer1\u00d7weight + layer2\u00d7weight + ...) / 100 = final\n\nLAYER SCORING GUIDE \u2014 be honest, not generous OR harsh:\n- 90-100: Excellent. Production-ready. Zero critical issues, minor style issues at most.\n- 75-89: Good. Functional with some quality gaps (incomplete validation, some legacy patterns).\n- 55-74: Acceptable. Works but real problems exist (security gaps, mixed paradigms, weak error handling).\n- 30-54: Poor. Significant issues but code structure is recognizable and partially functional.\n- 10-29: Broken. Syntax errors, unresolved imports, fundamentally non-functional.\n- 0-9: Empty or completely unrelated code.\n\nCALIBRATION: Even a naive literal translation that compiles should score 30-50. A decent automated migration typically scores 60-80. 90+ requires genuinely excellent, production-quality code.";

export function mapTargetFile(origName,origPath,srcLang,tgtLang) {
  if (srcLang===tgtLang) return {name:origName,path:origPath}; // version upgrade: keep same
  var base=origName.replace(/\.[^.]+$/,"");
  var srcExt=TARGET_EXT[srcLang]||"";
  var tgtExt=TARGET_EXT[tgtLang]||"";
  // Apply target naming conventions
  var newBase=base;
  if (tgtLang==="java"||tgtLang==="csharp"||tgtLang==="kotlin") {
    // PascalCase
    newBase=base.replace(/(^|[_-])([a-z])/g,function(_,p,c){return c.toUpperCase()}).replace(/[_-]/g,"");
  } else if (tgtLang==="python"||tgtLang==="ruby"||tgtLang==="go"||tgtLang==="rust") {
    // snake_case
    newBase=base.replace(/([A-Z])/g,function(m,c,i){return (i>0?"_":"")+c.toLowerCase()}).replace(/[- ]/g,"_").replace(/__+/g,"_");
  }
  // camelCase for JS/TS (keep as-is if already camelCase or use lowercase)
  var newName=newBase+tgtExt;
  var newPath=origPath?origPath.replace(origName,newName).replace(/\.[^.]+$/,tgtExt):newName;
  return {name:newName,path:newPath};
}

export function detectVer(lang, code) {
  if (!code || !lang) return {v:null,c:0,s:[]};
  var sg = [], ct = 0;
  var tests = [];
  if (lang === "python") {
    tests = [[/\bprint\s+["']/m,"print stmt"],[/\.iteritems/m,".iteritems"],[/\.has_key/m,".has_key"],[/\bimport\s+urllib2/m,"urllib2"],[/\bimport\s+ConfigParser/m,"ConfigParser"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"2.7"}); } }
    if (ct>0) return {v:"2.7",c:Math.min(95,60+ct*8),s:sg};
    return {v:"3.6",c:30,s:[]};
  }
  if (lang === "javascript") {
    tests = [[/\bvar\s+\w+/m,"var"],[/\.prototype\./m,"prototype"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"ES5"}); } }
    if (ct>0) return {v:"ES5",c:Math.min(95,60+ct*10),s:sg};
    return {v:"ES6/ES2015",c:40,s:[]};
  }
  if (lang === "java") {
    tests = [[/Collections\.sort/m,"Collections.sort"],[/new\s+SimpleDateFormat/m,"SimpleDateFormat"],[/new\s+Comparator/m,"Comparator"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"8"}); } }
    // Android-specific signals
    var andSig = [[/\bAsyncTask\b/m,"AsyncTask"],[/\bAppCompatActivity\b/m,"AppCompat"],[/\bfindViewById\b/m,"findViewById"],[/android\.support\./m,"support lib"],[/\bLocalBroadcastManager\b/m,"LocalBroadcast"],[/\bstartActivityForResult\b/m,"startActivityForResult"]];
    var andCt = 0;
    for (var i=0;i<andSig.length;i++) { if (andSig[i][0].test(code)) { andCt++; sg.push({t:andSig[i][1],i:"Android"}); } }
    return {v:"8",c:ct||andCt?Math.min(95,55+(ct+andCt)*7):40,s:sg};
  }
  if (lang === "csharp") {
    tests = [[/System\.Web/m,"System.Web"],[/ConfigurationManager/m,"ConfigMgr"],[/\blog4net\b/m,"log4net"],[/BeginInvoke/m,"BeginInvoke"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:".NET FW"}); } }
    if (ct>0) return {v:".NET Framework 4.8",c:Math.min(95,60+ct*8),s:sg};
    return {v:".NET Framework 4.8",c:35,s:[]};
  }
  if (lang === "go") {
    tests = [[/\bgo\s+func/m,"goroutine"],[/\bchan\s/m,"channel"],[/\bany\b/m,"any type"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"1.18+"}); } }
    if (/\bgo\s+1\./m.test(code)) return {v:"1.18",c:50,s:sg};
    return {v:ct>0?"1.21":"1.18",c:ct?Math.min(80,50+ct*10):30,s:sg};
  }
  if (lang === "rust") {
    tests = [[/\basync\s+fn/m,"async fn"],[/\bimpl\b/m,"impl"],[/\blet\s+mut\b/m,"mut"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"2021"}); } }
    return {v:ct>0?"2021":"2018",c:ct?Math.min(80,50+ct*10):30,s:sg};
  }
  if (lang === "php") {
    tests = [[/\bfn\s*\(/m,"arrow fn"],[/\?\->/m,"nullsafe"],[/\bmatch\s*\(/m,"match"],[/\benum\s+/m,"enum"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"8.0+"}); } }
    if (ct>0) return {v:"8.0",c:Math.min(85,55+ct*8),s:sg};
    return {v:"7.4",c:40,s:[]};
  }
  if (lang === "ruby") {
    tests = [[/\bputs\b/m,"puts"],[/\battr_accessor\b/m,"attr"],[/\bdo\s*\|/m,"block"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"2.7+"}); } }
    return {v:ct?"3.0":"2.7",c:ct?Math.min(75,45+ct*10):30,s:sg};
  }
  if (lang === "kotlin") {
    // Kotlin 2.0+ signals (K2 compiler features)
    var k2tests = [[/\bvalue\s+class/m,"value class"],[/\bContext\s*Receivers?/m,"context receivers"],[/\.\.<\b/m,"rangeUntil ..<"]];
    for (var i=0;i<k2tests.length;i++) { if (k2tests[i][0].test(code)) { ct++; sg.push({t:k2tests[i][1],i:"2.0+"}); } }
    if (ct>0) return {v:"2.0",c:Math.min(90,60+ct*10),s:sg};
    // Kotlin 1.8-1.9 signals
    var k19tests = [[/\bdata\s+object/m,"data object"],[/\.entries\b/m,"enum entries"]];
    for (var i=0;i<k19tests.length;i++) { if (k19tests[i][0].test(code)) { ct++; sg.push({t:k19tests[i][1],i:"1.9"}); } }
    if (ct>0) return {v:"1.9",c:Math.min(85,55+ct*10),s:sg};
    // Kotlin 1.5-1.7 / general signals
    tests = [[/\bdata\s+class/m,"data class"],[/\bsealed\s+(class|interface)/m,"sealed"],[/\bsuspend\s+fun/m,"suspend fun"],[/\bcompanion\s+object/m,"companion"],[/\bwhen\s*\x28/m,"when expr"],[/\bby\s+lazy/m,"lazy delegate"]];
    for (var i=0;i<tests.length;i++) { if (tests[i][0].test(code)) { ct++; sg.push({t:tests[i][1],i:"1.5+"}); } }
    // Android-specific signals
    var andTests = [[/\bAsyncTask\b/m,"AsyncTask"],[/\bLocalBroadcastManager\b/m,"LocalBroadcast"],[/\bstartActivityForResult\b/m,"startActivityForResult"],[/\bfindViewById\b/m,"findViewById"],[/android\.support\./m,"support library"]];
    for (var i=0;i<andTests.length;i++) { if (andTests[i][0].test(code)) { ct++; sg.push({t:andTests[i][1],i:"Android legacy"}); } }
    if (ct>=4) return {v:"1.5",c:Math.min(90,55+ct*7),s:sg};
    if (ct>0) return {v:"1.7",c:Math.min(80,45+ct*8),s:sg};
    return {v:"1.7",c:35,s:sg};
  }
  return {v:null,c:0,s:[]};
}

export async function doDeepAnalysis(origFiles,migratedResults,sl,sv,tl,tv,mid,lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Espa\u00f1ol",en:"English",pt:"Portugu\u00eas"};
  var ln=lnames[lang]||"Espa\u00f1ol";
  var origManifest=origFiles.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+(r.targetPath?" ("+r.targetPath+")":"")+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  var sys="You are a STRICT senior architect reviewing a "+sn+" "+sv+"\u2192"+tn+" "+tv+" migration ("+migratedResults.length+" files). Respond in "+ln+".\n\nAnalyze 8 layers INDEPENDENTLY with concrete findings per file:\n1) Architecture (15%) 2) Cross-file deps (10%) 3) Async model (15%) 4) Security (20%) 5) Error handling (10%) 6) Types/contracts (10%) 7) Data flow (10%) 8) API preservation (10%)\n\n"+SCORING_RUBRIC+"\n\nScore each layer first. Final score = weighted average. Show math.\n\nRespond ONLY JSON:\n{\"score\":0-100,\"scoreBreakdown\":\"weighted math\",\"layers\":[{\"name\":\"...\",\"score\":0-100,\"status\":\"pass|warn|fail\",\"detail\":\"1-2 sentences\"}],\"critical\":[{\"files\":[\"file.ext\"],\"category\":\"security|architecture|async|types|dataflow\",\"msg\":\"...\",\"fix\":\"fix\"}],\"improvements\":[{\"files\":[\"file.ext\"],\"category\":\"...\",\"msg\":\"...\",\"suggestion\":\"...\"}],\"strengths\":[\"...\"],\"summary\":\"2-3 sentences\"}";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nDeep SYSTEM-LEVEL analysis. Score each layer independently, compute weighted average. Be strict \u2014 typical migration scores 65-80. ALL text in "+ln+". Respond ONLY JSON.";
  try {
    var txt=await callAgent('deepAnalysis',sys,usr,mid,3000,{timeout:120000});
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    // Same JS-side recalculation as integration check
    if (cl.layers&&cl.layers.length>=6) {
      var weights={architecture:15,"cross-file deps":10,"cross-file":10,async:15,"async model":15,security:20,errors:10,"error handling":10,types:10,"types/contracts":10,dataflow:10,"data flow":10,idiomatic:10,"api preservation":10,imports:10};
      var wSum=0, wTotal=0;
      cl.layers.forEach(function(ly){
        var key=(ly.name||"").toLowerCase().replace(/[^a-z /\-]/g,"");
        var w=weights[key]||10;
        wSum+=(ly.score||0)*w;
        wTotal+=w;
      });
      var derived=wTotal>0?Math.round(wSum/wTotal):cl.score;
      if (Math.abs(derived-(cl.score||0))>8) {
        cl.scoreBreakdown=(cl.scoreBreakdown||"")+" [Recalculated: model said "+cl.score+", layers give "+derived+"]";
        cl.score=derived;
      }
    }
    return {ok:true,analysis:cl};
  } catch(e) { return {ok:false,error:e.message}; }
}


// ═══ Android Pre-Migration Report Generator ═══
export async function generateAndroidReport(files, sl, sv, tl, tv, mid, lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Espa\u00f1ol",en:"English",pt:"Portugu\u00eas"};
  var ln=lnames[lang]||"Espa\u00f1ol";
  var codeManifest=files.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");

  var sys="You are a Senior Android Architect performing a comprehensive pre-migration analysis of an Android codebase. The migration is from "+sn+" "+sv+" to "+tn+" "+tv+". Respond in "+ln+".\n\nAnalyze the codebase across these dimensions:\n\n1. **DEPRECATED APIs**: List every deprecated Android API found, its replacement, and migration effort\n2. **ARCHITECTURE**: Current pattern (MVC/MVP/MVVM/none) and target architecture recommendation\n3. **UI FRAMEWORK**: XML Views vs Compose readiness, migration path\n4. **ASYNC MODEL**: AsyncTask/Thread/RxJava/Handler patterns \u2192 Coroutines migration\n5. **DEPENDENCY INJECTION**: Current DI approach \u2192 Hilt recommendation\n6. **DATA LAYER**: DB/SharedPrefs/Network patterns \u2192 Room/DataStore/Retrofit\n7. **SECURITY**: Hardcoded secrets, unvalidated inputs, insecure network calls\n8. **MODULARIZATION**: Current module structure, recommended module boundaries\n9. **LIBRARY UPDATES**: Dependencies that need updating with recommended versions\n10. **GRADLE/BUILD**: Build config modernization (Kotlin DSL, version catalogs)\n\nFor each finding, include:\n- File and line reference\n- Current pattern\n- Target pattern\n- Impact: critical/major/minor\n- Effort: high/medium/low\n- Priority order for migration\n\nProduce a REFACTORING PLAN with ordered phases:\n- Phase 1: Foundation (AndroidX, DI setup, base classes)\n- Phase 2: Architecture (ViewModel, Repository, UseCases)\n- Phase 3: Async (Coroutines migration)\n- Phase 4: UI (Compose migration for key screens)\n- Phase 5: Testing & Polish\n\nRespond ONLY valid JSON:\n{\"summary\":\"2-3 paragraph executive summary\",\"architecture\":{\"current\":\"...\",\"target\":\"...\",\"effort\":\"high|medium|low\"},\"breaches\":[{\"category\":\"deprecated|architecture|security|async|ui|di|data|gradle\",\"file\":\"...\",\"line\":0,\"current\":\"what exists now\",\"target\":\"what it should become\",\"impact\":\"critical|major|minor\",\"effort\":\"high|medium|low\"}],\"refactorPlan\":[{\"phase\":1,\"name\":\"...\",\"description\":\"...\",\"tasks\":[\"...\"],\"estimatedEffort\":\"...\"}],\"libraryUpdates\":[{\"current\":\"lib:version\",\"recommended\":\"lib:newversion\",\"breaking\":true|false}],\"modularization\":{\"current\":\"...\",\"recommended\":[{\"module\":\"...\",\"contents\":[\"...\"]}]},\"riskScore\":0-100,\"readinessScore\":0-100}";

  var usr="ANDROID CODEBASE ("+sn+" "+sv+"):\n"+codeManifest+"\n\nPerform EXHAUSTIVE pre-migration analysis. Be specific with file:line references. ALL text in "+ln+". Respond ONLY JSON.";

  try {
    var txt=await callAgent('androidReport',sys,usr,mid,4000,{timeout:75000});
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    return {ok:true,report:cl};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ PHASE A: Codebase Analysis — understand the app before touching anything ═══
export async function doCodebaseAnalysis(files,sl,sv,tl,tv,mid,opts) {
  var chainOpts=opts||{};
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var manifest=files.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");

  var crossBlock="";
  if (isCross) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossBlock="\n\nCROSS-LANGUAGE ("+sn+"\u2192"+tn+"): Output uses "+tgtMod.system+", "+tgtMod.naming+". Include 'fileMapping' mapping each source file to its target name/extension.";
  }

  var fileMappingSchema=isCross?",\"fileMapping\":[{\"source\":\"original.py\",\"target\":\"original.js\",\"targetPath\":\"path/original.js\",\"notes\":\"module system changes\"}]":"";

  var sys="You are a Principal Architect performing pre-migration analysis. Analyze this "+sn+" "+sv+" codebase that will be migrated to "+tn+" "+tv+". Map the ENTIRE system before any code is changed."+crossBlock+"\n\nFor EACH file, provide DETAILED migration notes:\n- List EVERY deprecated API call with its exact modern replacement\n- List EVERY import that needs to change and what it changes to\n- Identify async patterns (callbacks, promises, sync I/O) and the target async model\n- Note error handling patterns and how they map to "+tn+"\n- Identify class/function signatures that will change\n- Flag data structures that cross file boundaries\n\nCRITICAL: For each file, count processing signals in 'processingHints'. These DIRECTLY control the AI processing budget:\n- deprecatedAPIs: count of deprecated/legacy API calls that need replacement\n- asyncChanges: count of async pattern migrations (callbacks\u2192promises, sync\u2192async, etc.)\n- importChanges: count of import/require statements that need to change\n- structuralChanges: count of class/interface/inheritance changes\n- typeChanges: count of type system changes (adding types, changing generics, etc.)\n- errorHandling: count of try/catch/exception pattern changes\n- totalSignals: sum of all above \u2014 this determines how much processing power each file gets\n\nBe ACCURATE with counts \u2014 overcounting wastes resources, undercounting produces incomplete migrations.\n\nRespond ONLY valid JSON:\n{\"purpose\":\"what this app/service does\",\"architecture\":\"pattern (MVC/layered/microservice/etc)\",\"files\":[{\"name\":\"...\",\"role\":\"what this file does\",\"exports\":[\"public APIs/classes/functions\"],\"imports\":[\"what it depends on\"],\"migrationNotes\":\"DETAILED: every API change, every pattern shift, every import change\",\"complexity\":\"simple|moderate|complex\",\"estimatedChanges\":0,\"processingHints\":{\"deprecatedAPIs\":0,\"asyncChanges\":0,\"importChanges\":0,\"structuralChanges\":0,\"typeChanges\":0,\"errorHandling\":0,\"totalSignals\":0}}],\"dependencies\":[{\"from\":\"file\",\"to\":\"file\",\"type\":\"import|call|inherit|config\",\"detail\":\"...\"}],\"criticalPaths\":[\"sequence of calls that must work together\"],\"risks\":[{\"area\":\"...\",\"detail\":\"...\",\"severity\":\"high|medium|low\"}],\"migrationOrder\":[\"files in optimal migration order\"],\"sharedContracts\":[\"interfaces/types/schemas that span multiple files\"]"+fileMappingSchema+"}";
  var usr="Analyze this "+sn+" "+sv+" codebase ("+files.length+" files, "+files.reduce(function(s,f){return s+f.content.split("\n").length},0)+" total lines):\n\n"+manifest+"\n\nProvide DETAILED per-file migration notes. Each file's migrationNotes should be 3-5 sentences covering every API change, import change, and pattern migration needed.";
  try {
    var txt;
    if (chainOpts.useChain) {
      var secSys="Review the following codebase analysis for SECURITY concerns in the "+sn+" "+sv+" to "+tn+" "+tv+" migration. Identify: hardcoded secrets, injection vulnerabilities, insecure API usage, dependency risks. Enrich the analysis JSON by adding securityNotes per file and a top-level securityRisks array. Return the COMPLETE enriched JSON.";
      txt=await callAgentChain([
        {agentId:'architect',sys:sys,usr:usr,mid:mid,mt:8000,opts:{timeout:120000}},
        {agentId:'security',sys:secSys,usr:'Review and enrich the analysis above. Return enriched JSON only.',mid:mid,mt:6000,opts:{timeout:120000}}
      ],chainOpts.onAgentChange);
    } else {
      txt=await callAgent('codebaseAnalysis',sys,usr,mid,8000,{timeout:120000});
    }
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    return {ok:true,analysis:cl,isCross:isCross};
  } catch(e) { console.error("[Analysis Error]",e.message); return {ok:false,error:e.message,isCross:isCross}; }
}

// ═══ PHASE B: Per-file Migration with codebase + already-migrated context ═══
// ═══ PHASE B (pre-step): Per-file migration plan — deep analysis of ONE file ═══
export async function doFilePlan(code,fn,sl,sv,tl,tv,mid,cbCtx,alreadyMigrated,targetFileName,cap) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var lineCount=code.split("\n").length;

  // Context from codebase analysis
  var archCtx="";
  if (cbCtx&&cbCtx.ok) {
    var a=cbCtx.analysis;
    var fileInfo=(a.files||[]).find(function(f){return fn.indexOf(f.name)>=0});
    archCtx="\nApplication: "+a.purpose+". Architecture: "+a.architecture+".";
    if (fileInfo) archCtx+="\nFile role: "+fileInfo.role+". High-level notes: "+fileInfo.migrationNotes;
    if (a.sharedContracts&&a.sharedContracts.length) archCtx+="\nShared contracts: "+a.sharedContracts.join("; ");
  }

  // Paradigm context for cross-language — inject MORE mappings for complex files
  var paradigmCtx="";
  if (isCross) {
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      var mapSlice=cap?cap.paradigmSlice:10;
      paradigmCtx="\n\nParadigm mappings ("+pMap.title+"):";
      paradigmCtx+="\nStdlib: "+pMap.stdlib.slice(0,mapSlice).join("; ");
      paradigmCtx+="\nPatterns: "+pMap.patterns.slice(0,mapSlice).join("; ");
      paradigmCtx+="\nModule system: "+pMap.modules.join("; ");
      if (pMap.async) paradigmCtx+="\nAsync: "+pMap.async.slice(0,Math.min(mapSlice,8)).join("; ");
      if (pMap.versionNotes) paradigmCtx+="\nVersion notes: "+pMap.versionNotes.slice(0,6).join("; ");
    }
  }

  // Already migrated sibling exports (brief)
  var siblingCtx="";
  if (alreadyMigrated&&alreadyMigrated.length) {
    siblingCtx="\n\nAlready migrated siblings:\n"+alreadyMigrated.map(function(m){
      var exports=(m.migrated.match(/^export\s+.*/gm)||m.migrated.match(/^(?:public|module\.exports).*/gm)||[]).slice(0,5);
      return "- "+(m.targetName||m.name)+": "+exports.join("; ");
    }).join("\n");
  }

  var sys="You are a migration planner. Analyze this ONE "+sn+" "+sv+" file ("+lineCount+" lines) and produce a CONCRETE migration recipe for "+tn+" "+tv+". Do NOT write any code \u2014 only the plan."+archCtx+paradigmCtx+siblingCtx+"\n\nFor EACH section of the file, list:\n1) Line ranges and what they do\n2) EXACT changes needed (old API call \u2192 new API call, old pattern \u2192 new pattern)\n3) Import changes (what to remove, what to add)\n4) Async model changes (callbacks \u2192 promises \u2192 async/await)\n5) Error handling changes\n6) Data structure changes\n7) Any cross-file dependency considerations\n\nBe SPECIFIC: 'line 5: urllib2.urlopen(url) \u2192 const resp = await fetch(url)' not 'update HTTP calls'\n\nRespond ONLY JSON:\n{\"complexity\":\"simple|moderate|complex\",\"totalChanges\":0,\"sections\":[{\"lines\":\"1-10\",\"purpose\":\"imports\",\"changes\":[\"specific change 1\",\"specific change 2\"]},{\"lines\":\"12-25\",\"purpose\":\"class definition\",\"changes\":[\"...\"]}],\"importPlan\":{\"remove\":[\"old imports\"],\"add\":[\"new imports\"]},\"asyncPlan\":\"description of async model migration\",\"riskAreas\":[\"specific risks\"],\"estimatedOutputLines\":0}";

  var usr="Plan the migration of this "+sn+" "+sv+" file to "+tn+" "+tv+":\n\nFile: "+fn+(targetFileName?" \u2192 "+targetFileName:"")+"\n```\n"+code+"\n```\n\nProduce a line-by-line migration recipe. Be specific \u2014 exact API replacements, exact import changes. JSON only.";

  try {
    // Use capacity-driven tokens/timeout, fallback to line-based
    var planTk=cap?cap.planTokens:Math.min(3000,Math.max(1500,lineCount*30));
    var planTo=cap?cap.planTimeout:45000;
    var txt=await callAgent('filePlan',sys,usr,mid,planTk,{timeout:planTo});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    return {ok:true,plan:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

export async function doMigrate(code,fn,sl,sv,tl,tv,mid,pr,cbCtx,alreadyMigrated,targetFileName,allFileMap,filePlan,cap) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;

  // Build context from codebase analysis — RICH context for better first-pass quality
  var ctxBlock="";
  var fileComplexity="moderate";
  if (cbCtx&&cbCtx.ok) {
    var a=cbCtx.analysis;
    var fileInfo=(a.files||[]).find(function(f){return fn.indexOf(f.name)>=0});
    ctxBlock="\n\n=== CODEBASE CONTEXT ===\nApplication: "+a.purpose+"\nArchitecture: "+a.architecture;
    if (fileInfo) {
      ctxBlock+="\nThis file's role: "+fileInfo.role;
      ctxBlock+="\nExports: "+(fileInfo.exports||[]).join(", ");
      ctxBlock+="\nDependencies: "+(fileInfo.imports||[]).join(", ");
      fileComplexity=fileInfo.complexity||"moderate";
    }
    if (a.sharedContracts&&a.sharedContracts.length) ctxBlock+="\nShared contracts to preserve: "+a.sharedContracts.join("; ");
    var deps=(a.dependencies||[]).filter(function(d){return fn.indexOf(d.from)>=0||fn.indexOf(d.to)>=0});
    if (deps.length) ctxBlock+="\nDependency connections: "+deps.map(function(d){return d.from+" depends on "+d.to+" ("+d.type+": "+d.detail+")"}).join("; ");
    if (a.criticalPaths&&a.criticalPaths.length) {
      var relevantPaths=a.criticalPaths.filter(function(cp){return cp.indexOf(fn.replace(/\.[^.]+$/,""))>=0});
      if (relevantPaths.length) ctxBlock+="\nCritical paths involving this file: "+relevantPaths.join("; ");
    }
    ctxBlock+="\n=== END CONTEXT ===";
  }

  // Inject per-file migration plan (from doFilePlan) — this is the KEY quality driver
  var planBlock="";
  if (filePlan&&filePlan.ok&&filePlan.plan) {
    var fp=filePlan.plan;
    fileComplexity=fp.complexity||fileComplexity;
    planBlock="\n\n=== MIGRATION RECIPE FOR THIS FILE ("+fp.totalChanges+" changes planned) ===";
    if (fp.importPlan) {
      planBlock+="\nIMPORTS: Remove: "+(fp.importPlan.remove||[]).join(", ")+". Add: "+(fp.importPlan.add||[]).join(", ");
    }
    if (fp.asyncPlan) planBlock+="\nASYNC MODEL: "+fp.asyncPlan;
    if (fp.sections&&fp.sections.length) {
      planBlock+="\n\nSECTION-BY-SECTION PLAN:";
      fp.sections.forEach(function(sec){
        planBlock+="\n[Lines "+sec.lines+" \u2014 "+sec.purpose+"]:";
        (sec.changes||[]).forEach(function(ch){planBlock+="\n  \u2022 "+ch});
      });
    }
    if (fp.riskAreas&&fp.riskAreas.length) planBlock+="\n\nRISK AREAS: "+fp.riskAreas.join("; ");
    planBlock+="\n=== END RECIPE ===";
    planBlock+="\n\nEXECUTE THIS RECIPE PRECISELY. Apply EVERY change listed above. Do not skip any section.";
  }

  // Cross-language: add file mapping, module system, AND paradigm mapping instructions
  var crossBlock="";
  if (isCross&&allFileMap) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossBlock="\n\nCROSS-LANGUAGE: Output file: "+targetFileName+". Files: "+allFileMap.map(function(m){return m.source+"\u2192"+m.target}).join(", ")+". Use "+tn+" module system ("+tgtMod.system+"). Imports MUST use "+TARGET_EXT[tl]+" filenames.";
    // Add concrete paradigm mapping — scale depth by capacity profile
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      var mapDepth=cap?cap.paradigmSlice:12;
      if (cap&&cap.tier>=3) mapDepth=999; // complex: inject ALL mappings
      crossBlock+="\n\n=== PARADIGM MAPPING ("+pMap.title+") ===";
      crossBlock+="\nSTDLIB TRANSLATIONS:\n"+pMap.stdlib.slice(0,mapDepth).map(function(s){return "\u2022 "+s}).join("\n");
      crossBlock+="\nPATTERN TRANSLATIONS:\n"+pMap.patterns.slice(0,mapDepth).map(function(s){return "\u2022 "+s}).join("\n");
      crossBlock+="\nMODULE SYSTEM:\n"+pMap.modules.map(function(s){return "\u2022 "+s}).join("\n");
      if (pMap.async) crossBlock+="\nASYNC MODEL:\n"+pMap.async.map(function(s){return "\u2022 "+s}).join("\n");
      if (pMap.types) crossBlock+="\nTYPE SYSTEM:\n"+pMap.types.map(function(s){return "\u2022 "+s}).join("\n");
      if (pMap.versionNotes) crossBlock+="\nVERSION-SPECIFIC ("+tv+"):\n"+pMap.versionNotes.map(function(s){return "\u2022 "+s}).join("\n");
      crossBlock+="\n=== END PARADIGM MAPPING ===";
      crossBlock+="\n\nAPPLY THESE MAPPINGS CONCRETELY. Do NOT leave any "+sn+" patterns \u2014 translate EVERYTHING to idiomatic "+tn+" "+tv+".";
    }
  }

  // Pass already-migrated sibling files — use TARGET filenames in cross-language
  var siblingBlock="";
  if (alreadyMigrated&&alreadyMigrated.length) {
    var summaries=alreadyMigrated.map(function(m){
      var code=m.migrated;
      var lines=code.split("\n");
      var keyLines=[];
      lines.forEach(function(ln){
        var t=ln.trim();
        if (!t||t.startsWith("//")||t.startsWith("#")||t.startsWith("*")) return;
        if (/^(import |from |require|using |package )/.test(t)) { keyLines.push(ln); return; }
        if (/^(export |module\.exports|exports\.)/.test(t)) { keyLines.push(ln); return; }
        if (/^(public |private |protected |class |def |function |async |const |let |var |interface |enum |record |sealed )/.test(t)) {
          keyLines.push(ln);
        }
      });
      var displayName=m.targetName||m.name;
      return "### "+displayName+" [ALREADY MIGRATED \u2014 key signatures]\n```\n"+keyLines.join("\n")+"\n```";
    });
    siblingBlock="\n\n=== ALREADY MIGRATED FILES \u2014 match these exports/signatures ===\n"+summaries.join("\n\n")+"\n=== END ===\n\nYour imports and calls MUST match the actual function/class names above."+(isCross?" Reference files by their TARGET names ("+TARGET_EXT[tl]+" extensions).":"");
  }

  var sys=pr.mig.sys.replaceAll("{TARGET}",tn).replaceAll("{TARGET_VER}",tv).replaceAll("{SOURCE}",sn).replaceAll("{SOURCE_VER}",sv);
  if (pr.mig.guide.length) sys+="\n\nGuidelines:\n"+pr.mig.guide.map(function(g){return "- "+g.replace(/\{TARGET\}/g,tn).replace(/\{TARGET_VER\}/g,tv).replace(/\{SOURCE\}/g,sn).replace(/\{SOURCE_VER\}/g,sv)}).join("\n");
  if (isCross) {
    sys+="\n\nCRITICAL CROSS-LANGUAGE RULES:\n- Output MUST be valid, runnable "+tn+" "+tv+" code\n- Translate EVERY construct \u2014 do not leave ANY "+sn+" syntax\n- Use "+tn+" standard library equivalents for ALL "+sn+" stdlib calls\n- Module system: use "+tn+" imports/exports (not "+sn+"'s)\n- Naming: follow "+tn+" conventions ("+((MODULE_CONVENTIONS[tl]||{}).naming||"target conventions")+")\n- Error handling: use "+tn+" try/catch patterns\n- The output must be a COMPLETE, self-contained "+tn+" file that could run as-is";
    sys+="\n\nMULTI-FILE OUTPUT: If the source file should be split into multiple target files (e.g., separate interfaces, implementations, DTOs, config), return a JSON object:\n```json\n{\"files\": [{\"name\": \"FileName.ext\", \"content\": \"...full code...\"}, {\"name\": \"FileNameInterface.ext\", \"content\": \"...\"}]}\n```\nIf the migration is a single file, return ONLY the code (no JSON wrapper). Use multi-file output when:\n- A class with interface should be split (interface + implementation)\n- DTOs/models should be in separate files (per target language conventions)\n- Configuration should be separated from business logic\n- The target language convention requires one class per file (Java, Kotlin, C#)";
  }
  var usr="Migrate "+sn+" "+sv+" to "+tn+" "+tv+".\nSource file: "+fn+(targetFileName&&targetFileName!==fn?" Target file: "+targetFileName:"")+ctxBlock+planBlock+crossBlock+siblingBlock+"\n\nSOURCE:\n"+code;
  try {
    // Scale tokens by file complexity: larger/more complex files need more output space
    var lineCount=code.split("\n").length;
    // Token/timeout from adaptive capacity (or fallback)
    var maxMigTokens=cap?cap.migTokens:Math.min(8192,Math.round((isCross?5120:4096)*1.2));
    var migTimeout=cap?cap.migTimeout:60000;
    var txt=await callAgent('migrate',sys,usr,mid,maxMigTokens,{timeout:migTimeout});
    var m=txt.replace(/^```[\w]*\n?/gm,"").replace(/\n?```$/gm,"").trim();

    // Check for multi-file JSON response
    var multiFile = null;
    try {
      var parsed = JSON.parse(m);
      if (parsed && parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
        multiFile = parsed.files;
      }
    } catch(jsonErr) {
      // Also try extracting JSON from mixed text
      var jsonMatch = m.match(/\{[\s\S]*"files"\s*:\s*\[[\s\S]*\]\s*\}/);
      if (jsonMatch) {
        try {
          var p2 = JSON.parse(jsonMatch[0]);
          if (p2 && p2.files && Array.isArray(p2.files) && p2.files.length > 0) multiFile = p2.files;
        } catch(e2) {}
      }
    }

    if (multiFile) {
      // Multi-file output: primary file + additional files
      var primaryContent = multiFile[0].content || "";
      var additionalFiles = multiFile.slice(1).map(function(f) {
        return { name: f.name, content: f.content || "" };
      });
      var ch = multiFile.map(function(f) { return "Generated: " + f.name; });
      ch.unshift(sn+" "+sv+" \u2192 "+tn+" "+tv+" ("+multiFile.length+" files)");
      return { migrated: primaryContent, changes: ch, engine: "claude-ai", additionalFiles: additionalFiles, multiFile: multiFile };
    }

    var ch=(m.match(/(?:\/\/|#)\s*MIGRATED:.*/g)||[]).map(function(c){return c.replace(/(?:\/\/|#)\s*MIGRATED:\s*/,"").trim()});
    if (!ch.length) ch.push(sn+" "+sv+" \u2192 "+tn+" "+tv);
    return {migrated:m,changes:ch,engine:"claude-ai"};
  } catch(e) {
    return {migrated:"// Error: "+e.message+"\n\n"+code,changes:["Error: "+e.message],engine:"fallback",failed:true};
  }
}

// ═══ PHASE B2a: Dependency Audit — map every cross-file connection before touching code ═══
export async function doDependencyAudit(origFiles,migratedResults,sl,sv,tl,tv,mid) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");

  var crossCtx="";
  if (isCross) {
    crossCtx="\n\nCROSS-LANGUAGE ("+sn+" to "+tn+"): "+migratedResults.map(function(r){return r.name+" renamed to "+(r.targetName||r.name)}).join(", ")+".";
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      crossCtx+="\nExpected module system: "+pMap.modules.join("; ");
    }
  }

  var sys="You are a dependency auditor. Analyze "+migratedResults.length+" migrated files ("+tn+" "+tv+") and map EVERY cross-file connection."+crossCtx+"\n\nFor each file, extract:\n1) What it EXPORTS (functions, classes, constants, default export)\n2) What it IMPORTS (from which file, what names)\n3) Function signatures at boundaries (params, return types)\n4) Shared data structures / contracts\n\nThen verify:\n- Every import resolves to a real export in a sibling file\n- Function call signatures match the definition\n- Data types are compatible at boundaries\n- Module system is consistent (all ESM or all CommonJS)\n- Naming conventions are consistent\n\nRespond ONLY JSON:\n{\"files\":[{\"name\":\"...\",\"exports\":[{\"name\":\"...\",\"type\":\"function|class|const|default\",\"signature\":\"params and return\"}],\"imports\":[{\"from\":\"...\",\"names\":[\"...\"],\"resolved\":true/false}]}],\"connections\":[{\"from\":\"file\",\"to\":\"file\",\"type\":\"imports|calls|extends\",\"fromSignature\":\"...\",\"toSignature\":\"...\",\"compatible\":true/false,\"issue\":\"description if incompatible\"}],\"issues\":[{\"files\":[\"...\"],\"type\":\"unresolved_import|signature_mismatch|missing_export|inconsistent_module|naming\",\"detail\":\"...\",\"fix\":\"suggested fix\"}],\"moduleSystem\":\"ESM|CommonJS|mixed\",\"summary\":\"2-3 sentences\"}";

  var usr="MIGRATED CODEBASE ("+tn+" "+tv+") \u2014 "+migratedResults.length+" files migrated independently:\n\n"+migManifest+"\n\nMap ALL cross-file connections. Find every unresolved import, signature mismatch, and naming inconsistency. JSON only.";

  try {
    var txt=await callAgent('dependencyAudit',sys,usr,mid,3000,{timeout:60000});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    return {ok:true,audit:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ PHASE B2b: Consolidation Fix — use audit results to fix all cross-file issues ═══
export async function doConsolidation(origFiles,migratedResults,sl,sv,tl,tv,mid,depAudit) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");

  var crossInstr="";
  if (isCross) {
    crossInstr="\nCROSS-LANGUAGE: "+migratedResults.map(function(r){return r.name+" to "+(r.targetName||r.name)}).join(", ")+". Use "+TARGET_EXT[tl]+" filenames as JSON keys.";
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      crossInstr+="\nModule system: "+pMap.modules.join("; ");
      crossInstr+="\nAsync model: "+pMap.async.join("; ");
    }
  }

  // Build audit context if available
  var auditCtx="";
  if (depAudit&&depAudit.ok&&depAudit.audit) {
    var a=depAudit.audit;
    if (a.issues&&a.issues.length) {
      auditCtx="\n\n=== DEPENDENCY AUDIT RESULTS ("+a.issues.length+" issues found) ===\n";
      auditCtx+=a.issues.map(function(is,i){return (i+1)+". ["+is.type+"] "+((is.files||[]).join(","))+": "+is.detail+(is.fix?" \u2192 FIX: "+is.fix:"")}).join("\n");
      auditCtx+="\n=== END AUDIT ===";
    }
    if (a.connections&&a.connections.length) {
      var broken=a.connections.filter(function(c){return !c.compatible});
      if (broken.length) {
        auditCtx+="\n\nBROKEN CONNECTIONS:\n"+broken.map(function(c){return c.from+" calls "+c.to+": "+c.fromSignature+" vs "+c.toSignature+" \u2014 "+c.issue}).join("\n");
      }
    }
    if (a.moduleSystem==="mixed") {
      auditCtx+="\n\nWARNING: Mixed module system detected. Standardize to "+tn+" default.";
    }
  }

  var sys="Consolidation engineer: "+migratedResults.length+" files migrated independently "+sn+" "+sv+" to "+tn+" "+tv+"."+crossInstr+auditCtx+"\n\nFix ALL cross-file issues found by the dependency audit:\n1) Resolve every unresolved import \u2014 match exact export names\n2) Fix signature mismatches at call boundaries\n3) Standardize module system (all ESM or all CommonJS for "+tn+")\n4) Ensure consistent naming conventions\n5) Fix data type compatibility at boundaries\n6) Ensure consistent async model (no mixing callbacks with promises)\n\nReturn ALL files (unchanged ones copied as-is). Return COMPLETE file contents.\n\nReturn JSON: {\"files\":{\"filename\":\"full source code\",...},\"fixes\":[\"description of each fix\"]}";

  var usr="ORIGINAL ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED INDEPENDENTLY ("+tn+" "+tv+"):\n"+migManifest+"\n\nFix ALL cross-file issues"+(auditCtx?" identified in the audit":"")+" . Return ALL "+migratedResults.length+" files with complete source code. JSON only.";

  try {
    var txt=await callAgent('consolidation',sys,usr,mid,10000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    return {ok:true,files:parsed.files||{},fixes:parsed.fixes||[]};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ PHASE C: Integration Validation — comprehensive, regression-aware ═══
export async function doIntegrationCheck(origFiles,migratedResults,sl,sv,tl,tv,mid,lang,prevContext,opts) {
  var chainOpts=opts||{};
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var lnames={es:"Espa\u00f1ol",en:"English",pt:"Portugu\u00eas"}; var ln=lnames[lang]||"Espa\u00f1ol";
  var origManifest=origFiles.map(function(f){return "### "+f.name+(f.path?" ("+f.path+")":"")+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;var dp=r.targetPath||r.path||dn;return "### "+dn+(dp?" ("+dp+")":"")+"\n```\n"+r.migrated+"\n```"}).join("\n\n");

  var crossBlock="";
  if (isCross) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossBlock="\n\nCROSS-LANGUAGE ("+sn+"\u2192"+tn+"): Files renamed: "+migratedResults.map(function(r){return r.name+"\u2192"+(r.targetName||r.name)}).join(", ")+". Imports must use "+TARGET_EXT[tl]+" filenames. Use target names in issue 'files' arrays.";
  }

  var regressionBlock="";
  if (prevContext) {
    regressionBlock="\n\nREGRESSION CHECK: Previously working: "+prevContext.verified.slice(0,5).join("; ")+". Fixed last iteration: "+prevContext.fixedIssues.slice(0,5).join("; ")+". If something previously working broke \u2192 severity=critical.";
  }

  var sys="You are a senior code reviewer evaluating a "+sn+" "+sv+" \u2192 "+tn+" "+tv+" migration ("+migratedResults.length+" files). Respond in "+ln+"."+crossBlock+"\n\nBe thorough and fair. Find real issues but also acknowledge what works well.\n\nEvaluate ALL 8 layers INDEPENDENTLY. For each layer, examine every file:\n1) IMPORTS (weight 10%): All imports resolve to real exports? Correct paths and extensions?\n2) ARCHITECTURE (weight 15%): Module structure preserved? Separation of concerns maintained?\n3) ASYNC (weight 15%): Async model fully migrated? No mixed callback+promise patterns?\n4) SECURITY (weight 20%): SQL injection? XSS? Resource leaks? Input validation?\n5) ERRORS (weight 10%): All error paths covered? Proper propagation?\n6) TYPES (weight 10%): Function signatures match across files? Types correct at boundaries?\n7) DATAFLOW (weight 10%): Data transformation preserved? No silent data loss?\n8) IDIOMATIC (weight 10%): Modern "+tv+" patterns used? No legacy "+sv+" holdovers?"+(isCross?"\n\nCROSS-LANGUAGE CALIBRATION: In cross-language migrations, evaluate whether the code was translated to GENUINE "+tn+" idioms. A literal translation that works but uses "+sn+" patterns in "+tn+" syntax should score 50-65 in idiomatic. Code that is genuinely idiomatic "+tn+" scores 80+. Even imperfect cross-language migrations that compile and run correctly should get 40-60 overall.":"")+"\n\n"+SCORING_RUBRIC+regressionBlock+"\n\nScore each layer FIRST with specific justification. Then compute final = weighted average.\n\nRespond ONLY JSON:\n{\"layers\":[{\"name\":\"imports\",\"score\":0-100,\"status\":\"pass|warn|fail\",\"detail\":\"what you found\"},{\"name\":\"architecture\",\"score\":...},...all 8],\"score\":0-100,\"scoreBreakdown\":\"imports:X\u00d710 + architecture:X\u00d715 + ... = N/100 = final\",\"pass\":true/false,\"issues\":[{\"severity\":\"critical|major|moderate|minor\",\"files\":[\"file.ext\"],\"category\":\"imports|architecture|async|security|errors|types|dataflow|idiomatic\",\"msg\":\"specific problem\",\"fix\":\"specific code fix\"}],\"verified\":[\"what works\"],\"summary\":\"2-3 sentences\"}";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nThorough review. Score each layer independently (0-100), then compute weighted average. Show your math. ALL text in "+ln+". Respond ONLY JSON.";
  try {
    // Scale tokens: more files need more detailed layer analysis (8 layers x N files)
    var intCheckTokens=Math.min(6000,4000+migratedResults.length*400);
    var txt;
    if (chainOpts.useChain) {
      var secSys="Review the following integration check for a "+sn+" "+sv+" to "+tn+" "+tv+" migration. Focus on SECURITY: SQL injection, XSS, resource leaks, auth bypasses. Add security issues to the issues array with category:security. Return COMPLETE enriched JSON.";
      txt=await callAgentChain([
        {agentId:'qa',sys:sys,usr:usr,mid:mid,mt:intCheckTokens,opts:{timeout:75000}},
        {agentId:'security',sys:secSys,usr:'Audit the integration check above for security concerns. Return enriched JSON.',mid:mid,mt:3000,opts:{timeout:60000}}
      ],chainOpts.onAgentChange);
    } else {
      txt=await callAgent('integrationCheck',sys,usr,mid,intCheckTokens);
    }
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    if (parsed.layers&&parsed.layers.length>=6) {
      var weights={imports:10,architecture:15,async:15,security:20,errors:10,types:10,dataflow:10,idiomatic:10};
      var wSum=0, wTotal=0;
      parsed.layers.forEach(function(ly){
        var key=(ly.name||"").toLowerCase().replace(/[^a-z]/g,"");
        // Fuzzy match layer names to weight keys
        var w=weights[key]||0;
        if(!w){Object.keys(weights).forEach(function(k){if(key.indexOf(k)>=0||k.indexOf(key)>=0)w=weights[k]})}
        if(!w)w=10; // fallback
        wSum+=(ly.score||0)*w;
        wTotal+=w;
      });
      var derived=wTotal>0?Math.round(wSum/wTotal):parsed.score;
      if (Math.abs(derived-(parsed.score||0))>8) {
        parsed.scoreBreakdown=(parsed.scoreBreakdown||"")+" [Recalculated: model said "+parsed.score+", layers give "+derived+"]";
        parsed.score=derived;
      }
      // Ensure pass reflects the recalculated score
      parsed.pass=parsed.score>=90&&(parsed.issues||[]).filter(function(is){return is.severity==="critical"||is.severity==="major"}).length===0;
    }
    // ═══ SCORING FLOOR: if there's actual migrated code, minimum score is 10 ═══
    // A score of 0 means "no code at all" — even terrible code with syntax errors gets 10-20
    if ((parsed.score||0)<10) {
      var hasCode=migratedResults.some(function(r){return r.migrated&&r.migrated.trim().length>50&&!r.migrated.startsWith("// Error:")});
      if (hasCode) {
        parsed.scoreBreakdown=(parsed.scoreBreakdown||"")+" [Floor applied: original="+parsed.score+", migrated code exists \u2192 min 10]";
        parsed.score=Math.max(parsed.score||0,10);
      }
    }
    return {ok:true,result:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

// ═══ PHASE D: Integration Fix — holistic, escalating strategies ═══
export async function doIntegrationFix(origFiles,migratedResults,issues,sl,sv,tl,tv,mid,iteration,prevIssues) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var isCross=sl!==tl;
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  // Sort issues by severity for priority fixing
  var sevOrder={critical:0,major:1,moderate:2,minor:3};
  var sortedIssues=issues.slice().sort(function(a,b){return (sevOrder[a.severity]||3)-(sevOrder[b.severity]||3)});
  var issueList=sortedIssues.map(function(is,idx){return (idx+1)+". ["+is.severity.toUpperCase()+"] "+(is.files||[]).join(" \u2194 ")+" ("+is.category+"): "+is.msg+(is.fix?"\n   FIX: "+is.fix:"")}).join("\n");

  var crossInstr="";
  if (isCross) {
    var tgtMod=MODULE_CONVENTIONS[tl]||{};
    crossInstr="\n\nCROSS-LANGUAGE CONTEXT:\nFile mapping: "+migratedResults.map(function(r){return r.name+" \u2192 "+(r.targetName||r.name)}).join(", ")+"\nTarget module system: "+tgtMod.system+"\nUse TARGET filenames as keys in your response JSON.";
    var pMap=getParadigmMap(sl,tl);
    if (pMap) {
      crossInstr+="\n\nKEY API TRANSLATIONS ("+pMap.title+"):\n"+pMap.stdlib.slice(0,8).map(function(s){return "\u2022 "+s}).join("\n");
      crossInstr+="\n"+pMap.patterns.slice(0,6).map(function(s){return "\u2022 "+s}).join("\n");
    }
  }

  var escalation="";
  if (iteration>=2 && prevIssues) {
    escalation="\n\nESCALATION: Previous fix failed. Try DIFFERENT approach \u2014 rewrite affected functions/classes instead of patching. Still broken: "+prevIssues.slice(0,5).map(function(is){return (is.files||[]).join("\u2194")+": "+is.msg}).join("; ");
  }

  var fileListStr=migratedResults.map(function(r){return r.targetName||r.name}).join(", ");
  var sys="Fix ALL "+issues.length+" issues in "+sn+" "+sv+" to "+tn+" "+tv+" migration ("+fileListStr+")."+escalation+crossInstr+"\n\nCRITICAL ANTI-REGRESSION RULES:\n- DO NOT break anything that currently works. Fix issues ONLY \u2014 do not rewrite unrelated code.\n- If a file has no issues, return it UNCHANGED (copy it exactly as-is).\n- Preserve ALL existing imports, exports, function signatures unless an issue specifically requires changing them.\n- After fixing, mentally verify: would the fixed code compile? Do all imports still resolve?\n\nPriority: fix critical/major first, then moderate (non-idiomatic code, incomplete async migration, weak typing, missing validation). Return ALL "+migratedResults.length+" files (unchanged files copied as-is). Valid runnable "+tn+" "+tv+" with MODERN idiomatic patterns. "+SCORING_RUBRIC+"\n\nReturn ONLY JSON: {\"files\":{\"filename\":\"full source code\",...},\"fixed\":[\"fix descriptions\"]}";

  var usr="ORIGINAL ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nCURRENT MIGRATED ("+tn+" "+tv+") \u2014 has "+issues.length+" issues:\n"+migManifest+"\n\n===\n\nALL ISSUES ("+issues.length+") sorted by severity:\n"+issueList+"\n\nFix ALL issues including moderate quality gaps. Return ALL "+migratedResults.length+" files. JSON only.";

  try {
    var txt=await callAgent('integrationFix',sys,usr,mid,10000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed)throw new Error("Invalid JSON response");
    var fixedFiles=parsed.files||parsed;
    var fixed=parsed.fixed||[];
    return {ok:true,files:fixedFiles,fixed:fixed};
  } catch(e) { return {ok:false,error:e.message}; }
}

export async function doReview(origFiles,migratedResults,sl,sv,tl,tv,mid,pr,lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Espa\u00f1ol",en:"English",pt:"Portugu\u00eas"};
  var ln=lnames[lang]||"Espa\u00f1ol";
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){var dn=r.targetName||r.name;return "### "+dn+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  var sys="You are a STRICT QA reviewer: "+sn+" "+sv+"\u2192"+tn+" "+tv+" ("+migratedResults.length+" files). Respond in "+ln+".\n\nScore each dimension independently FIRST, then compute weighted average:\n- Functional(25%): Does migrated code produce same outputs for same inputs? Test with empty, null, error cases.\n- Syntax(15%): Valid compilable "+tv+"? All imports resolve? All types correct?\n- Idiomatic(15%): Genuine modern "+tv+" patterns? No legacy "+sv+" holdovers? Proper stdlib usage?\n- Async(10%): Async model fully migrated and consistent? No mixed paradigms?\n- Security(15%): SQL injection, XSS, resource leaks, input validation, hardcoded secrets?\n- Errors(8%): All error paths covered? No swallowed exceptions? Resource cleanup?\n- Contracts(7%): Public API surface preserved? Function signatures compatible for callers?\n- Docs(5%): MIGRATED comments present? Clear naming? Self-documenting code?\n\n"+SCORING_RUBRIC+"\n\nFinal score = weighted average of dimensions. Verdict: aprobado(90+), con_observaciones(70-89), rechazado(<70).\n\nRespond ONLY JSON:\n{\"score\":0-100,\"scoreBreakdown\":\"func:X\u00d725 + syn:X\u00d715 + idi:X\u00d715 + async:X\u00d710 + sec:X\u00d715 + err:X\u00d78 + con:X\u00d77 + doc:X\u00d75 = N/100\",\"verdict\":\"aprobado|con_observaciones|rechazado\",\"dimensions\":{\"functional\":0-100,\"syntax\":0-100,\"idiomatic\":0-100,\"async\":0-100,\"security\":0-100,\"errors\":0-100,\"contracts\":0-100,\"docs\":0-100},\"errors\":[{\"file\":\"...\",\"line\":0,\"severity\":\"critical|major|minor\",\"dimension\":\"functional|syntax|idiomatic|async|security|errors|contracts|docs\",\"msg\":\"in "+ln+"\"}],\"warnings\":[{\"file\":\"...\",\"line\":0,\"dimension\":\"...\",\"msg\":\"in "+ln+"\"}],\"good\":[\"in "+ln+"\"],\"summary\":\"2-3 sentences in "+ln+"\"}";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nStrict review. Score each dimension independently. Compute weighted average. Typical migration: 65-80. ALL text in "+ln+". Respond ONLY JSON.";
  try {
    var txt=await callAgent('review',sys,usr,mid,4000);
    var cl=safeParseJSON(txt);
    if(!cl)throw new Error("Invalid JSON response");
    // JS-side recalculation from dimensions
    if (cl.dimensions) {
      var dw={functional:25,syntax:15,idiomatic:15,async:10,security:15,errors:8,contracts:7,docs:5};
      var dSum=0;
      Object.keys(dw).forEach(function(k){dSum+=((cl.dimensions[k]||0)*dw[k])});
      var derived=Math.round(dSum/100);
      if (Math.abs(derived-(cl.score||0))>8) {
        cl.scoreBreakdown=(cl.scoreBreakdown||"")+" [Recalc: model="+cl.score+", dims="+derived+"]";
        cl.score=derived;
      }
      cl.verdict=cl.score>=90?"aprobado":cl.score>=70?"con_observaciones":"rechazado";
    }
    // Scoring floor: valid code never gets 0
    if ((cl.score||0)<10 && cl.dimensions) {
      var anyDim=Object.values(cl.dimensions).some(function(v){return v>0});
      if (anyDim) { cl.score=Math.max(cl.score||0,10); cl.verdict=cl.score>=90?"aprobado":cl.score>=70?"con_observaciones":"rechazado"; }
    }
    return {ok:true,review:cl};
  } catch(e) { return {ok:false,error:e.message}; }
}

export async function doFixPlan(origFiles,migratedResults,review,sl,sv,tl,tv,mid,lang) {
  var sn=(LANGS[sl]||{}).n||sl, tn=(LANGS[tl]||{}).n||tl;
  var lnames={es:"Espa\u00f1ol",en:"English",pt:"Portugu\u00eas"};
  var ln=lnames[lang]||"Espa\u00f1ol";
  var origManifest=origFiles.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");
  var migManifest=migratedResults.map(function(r){return "### "+r.name+"\n```\n"+r.migrated+"\n```"}).join("\n\n");
  var errList=(review.errors||[]).map(function(e){return "["+((e.file||"?"))+"] "+(e.line?"Ln "+e.line+": ":"")+e.msg}).join("\n");
  var warnList=(review.warnings||[]).map(function(w){return "["+((w.file||"?"))+"] "+w.msg}).join("\n");
  var sys="Fix "+migratedResults.length+" files: "+sn+" "+sv+"\u2192"+tn+" "+tv+" migration. Respond in "+ln+".\n\nFormat:\n---ACTION_PLAN---\n(numbered steps in "+ln+")\n---CORRECTED_FILES---\nJSON: {\"files\":{\"filename\":\"full source\",...}}\n---CHECKLIST---\n(verification items in "+ln+")";
  var usr="ORIGINAL CODEBASE ("+sn+" "+sv+"):\n"+origManifest+"\n\n===\n\nMIGRATED CODEBASE ("+tn+" "+tv+"):\n"+migManifest+"\n\nSCORE: "+review.score+"/100\n\nERRORS:\n"+errList+"\n\nWARNINGS:\n"+warnList+"\n\nGenerate fix plan in "+ln+". Return ALL "+migratedResults.length+" files.";
  try {
    var txt=await callAgent('fixPlan',sys,usr,mid,10000,{timeout:75000});
    var plan="",filesJson=null,checklist="";
    var parts=txt.split(/---(?:ACTION_PLAN|CORRECTED_FILES|CHECKLIST)---/);
    if (parts.length>=4) {
      plan=parts[1].trim();
      var codeBlock=parts[2].replace(/^```json?\n?/gm,"").replace(/\n?```$/gm,"").trim();
      try { filesJson=JSON.parse(codeBlock); filesJson=filesJson.files||filesJson; } catch(e){ filesJson=null; }
      checklist=parts[3].trim();
    } else if (parts.length>=2) {
      plan=parts[1]?parts[1].trim():"";
      checklist=parts[3]?parts[3].trim():"";
    } else { plan=txt; }
    return {ok:true,plan:plan,files:filesJson,checklist:checklist};
  } catch(e) { return {ok:false,error:e.message}; }
}
