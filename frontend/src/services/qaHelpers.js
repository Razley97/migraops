import { LANGS } from "../config/languages.js";
import { callClaude } from "./claudeClient.js";
import { safeParseJSON } from "./utils.js";

export async function runVirtualQA(files, lang, ver, mid, phase) {
  // Claude "mentally executes" the code — traces through each function predicting exact outputs
  var ln=(LANGS[lang]||{}).n||lang;
  var manifest=files.map(function(f){return "### "+f.name+"\n```\n"+f.content+"\n```"}).join("\n\n");

  var phaseCtx=phase==="post"?"\n\nNOTE: This is the POST-MIGRATION version of the code ("+ln+" "+ver+"). The original code was in a different language. Focus on whether the MIGRATED code produces correct outputs — trace the actual "+ln+" logic, not what you think the original did.":"";

  var sys="You are a Senior QA Engineer performing MENTAL EXECUTION of "+ln+" "+ver+" code. You must trace through each function step-by-step and predict the EXACT output for given inputs."+phaseCtx+"\n\nFor EACH public function/method in the codebase:\n1) Identify the function, its file, params, and return type\n2) Design 3-5 test scenarios covering: happy path, edge cases (null/empty/zero), error conditions, boundary values\n3) TRACE through the code line by line for each input — show your reasoning\n4) Predict the EXACT return value (not approximate — exact JSON-serializable value)\n5) Identify side effects (DB writes, HTTP calls, file I/O, console output, state mutations)\n6) Rate your confidence: high (pure logic, deterministic), medium (some external deps), low (heavy I/O, non-deterministic)\n7) Note any potential bugs, edge cases, or error conditions you find during tracing\n\nCRITICAL RULES:\n- For DB/HTTP/filesystem operations: predict based on mock scenarios (empty DB returns [], HTTP 200 returns {status:\"ok\"}, file exists with sample content)\n- For randomness/timestamps: note as non-deterministic but predict a representative value\n- Be PRECISE: string outputs include exact formatting, numbers include exact decimals, arrays include exact elements\n- Trace EVERY code path the input takes — don't skip steps\n- For error cases: predict the exact exception type and message\n- Count function arguments carefully — don't add or remove params\n\nRespond ONLY valid JSON:\n{\"functions\":[{\"name\":\"functionName\",\"file\":\"filename\",\"description\":\"what it does\",\"params\":\"param types and meaning\",\"returnType\":\"return type\",\"tests\":[{\"input\":\"JSON input\",\"trace\":\"step-by-step execution trace (3-5 key steps)\",\"predicted\":\"exact predicted output as JSON\",\"sideEffects\":[\"list of side effects\"],\"confidence\":\"high|medium|low\",\"label\":\"what this tests\",\"bugs\":\"any bugs found or null\"}]}],\"summary\":{\"totalFunctions\":0,\"totalTests\":0,\"highConfidence\":0,\"mediumConfidence\":0,\"lowConfidence\":0,\"bugsFound\":0}}";

  var usr="Mentally execute this "+ln+" "+ver+" codebase ("+phase+" migration). Trace through EVERY function with concrete inputs and predict exact outputs:\n\n"+manifest+"\n\nTrace each function step-by-step. Predict exact return values. Include edge cases. JSON only.";

  try {
    var txt=await callClaude(sys,usr,mid,8000,{timeout:75000});
    var parsed=safeParseJSON(txt);
    if(!parsed||!parsed.functions)throw new Error("Invalid virtual QA JSON");
    parsed.phase=phase;
    parsed.timestamp=new Date().toISOString();
    return {ok:true,virtual:parsed};
  } catch(e) { return {ok:false,error:e.message}; }
}

export function compareVirtualQA(preV, postV) {
  // Compare virtual QA results pre vs post migration
  if(!preV||!postV||!preV.functions||!postV.functions) return null;
  var comparisons=[];
  var equivalent=0,different=0,missing=0;

  preV.functions.forEach(function(preF) {
    // Find matching function in post (by name, fuzzy)
    var postF=postV.functions.find(function(pf){return pf.name===preF.name})||
              postV.functions.find(function(pf){return preF.name.toLowerCase().indexOf(pf.name.toLowerCase())>=0||pf.name.toLowerCase().indexOf(preF.name.toLowerCase())>=0});

    if(!postF) {
      missing++;
      comparisons.push({name:preF.name,file:preF.file,status:"missing",pre:preF,post:null,cases:[]});
      return;
    }

    var caseDiffs=[];
    (preF.tests||[]).forEach(function(preT,j){
      var postT=(postF.tests||[])[j];
      if(!postT) { missing++; caseDiffs.push({label:preT.label,status:"missing",pre:preT,post:null}); return; }

      var preOut=JSON.stringify(typeof preT.predicted==="string"?preT.predicted:JSON.stringify(preT.predicted));
      var postOut=JSON.stringify(typeof postT.predicted==="string"?postT.predicted:JSON.stringify(postT.predicted));

      if(preOut===postOut) {
        equivalent++;
        caseDiffs.push({label:preT.label,status:"equivalent",pre:preT,post:postT});
      } else {
        different++;
        caseDiffs.push({label:preT.label,status:"different",pre:preT,post:postT});
      }
    });

    comparisons.push({name:preF.name,file:preF.file,status:caseDiffs.some(function(c){return c.status==="different"})?"different":"equivalent",pre:preF,post:postF,cases:caseDiffs});
  });

  var total=equivalent+different+missing;
  return {
    comparisons:comparisons,
    summary:{equivalent:equivalent,different:different,missing:missing,total:total},
    preservationRate:total>0?Math.round(equivalent/total*100):0
  };
}

export function compareQAResults(preR, postR) {
  // Compare pre-migration vs post-migration test results
  if(!preR||!postR||!preR.tests||!postR.tests) return null;
  var comparisons=[];
  var identical=0,regressions=0,newPasses=0,unchanged=0;

  preR.tests.forEach(function(preTest,i){
    var postTest=postR.tests.find(function(pt){return pt.id===preTest.id})||postR.tests[i];
    if(!postTest) return;

    var preCases=preTest.cases||[];
    var postCases=postTest.cases||[];
    var caseDiffs=[];

    preCases.forEach(function(preCase,j){
      var postCase=postCases[j];
      if(!postCase){caseDiffs.push({label:preCase.label,status:"missing",pre:preCase,post:null});return;}

      if(preCase.pass&&postCase.pass&&preCase.actualStr===postCase.actualStr){
        identical++;
        caseDiffs.push({label:preCase.label,status:"identical",pre:preCase,post:postCase});
      } else if(preCase.pass&&!postCase.pass){
        regressions++;
        caseDiffs.push({label:preCase.label,status:"regression",pre:preCase,post:postCase});
      } else if(!preCase.pass&&postCase.pass){
        newPasses++;
        caseDiffs.push({label:preCase.label,status:"new_pass",pre:preCase,post:postCase});
      } else if(preCase.pass&&postCase.pass&&preCase.actualStr!==postCase.actualStr){
        regressions++;
        caseDiffs.push({label:preCase.label,status:"output_changed",pre:preCase,post:postCase});
      } else {
        unchanged++;
        caseDiffs.push({label:preCase.label,status:"both_fail",pre:preCase,post:postCase});
      }
    });

    comparisons.push({id:preTest.id,name:preTest.name,file:preTest.file,func:preTest.func,type:preTest.type,cases:caseDiffs});
  });

  return {
    comparisons:comparisons,
    summary:{identical:identical,regressions:regressions,newPasses:newPasses,unchanged:unchanged,total:identical+regressions+newPasses+unchanged},
    preservationRate:identical+regressions+newPasses+unchanged>0?Math.round(identical/(identical+regressions+newPasses+unchanged)*100):0
  };
}
