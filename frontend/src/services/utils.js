import { LANGS } from "../config/languages.js";

// ═══════════════════════════════════════════════════════════════
// Utility functions extracted from App.jsx
// ═══════════════════════════════════════════════════════════════

/**
 * Safe JSON parser with recovery — handles markdown fences and
 * LLM responses that wrap JSON in explanatory text.
 */
export function safeParseJSON(str) {
  if(!str)return null;
  var s=str.replace(/^```json?\n?/gm,"").replace(/\n?```$/gm,"").trim();
  try { return JSON.parse(s); }
  catch(e) {
    // Try to extract JSON from mixed text (LLM sometimes adds explanation before/after)
    var m=s.match(/(\{[\s\S]*\})/);
    if(m){try{return JSON.parse(m[1])}catch(e2){}}
    var m2=s.match(/(\[[\s\S]*\])/);
    if(m2){try{return JSON.parse(m2[1])}catch(e3){}}
    // Try to repair truncated JSON (max_tokens cut off mid-response)
    var jsonStart=s.indexOf("{");
    if(jsonStart>=0){
      var truncated=s.slice(jsonStart);
      // Remove trailing incomplete values (truncated strings, etc.)
      truncated=truncated.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/,"");
      truncated=truncated.replace(/,\s*$/,"");
      // Count and close unclosed braces/brackets
      var opens=0,closesNeeded=[];
      for(var i=0;i<truncated.length;i++){
        var c=truncated[i];
        if(c==="{"){ opens++; closesNeeded.push("}"); }
        else if(c==="["){ closesNeeded.push("]"); }
        else if(c==="}"||c==="]"){ closesNeeded.pop(); }
      }
      truncated+=closesNeeded.reverse().join("");
      try{return JSON.parse(truncated)}catch(e4){}
    }
    return null;
  }
}

/**
 * Simple line-by-line diff generator.
 * Returns array of {t, o, n, oN, nN} where t is "same"|"mod"|"del"|"add".
 */
export function mkDiff(a,b) {
  var ol=a.split("\n"),nl=b.split("\n"),d=[];
  var oi=0,ni=0;
  while(oi<ol.length||ni<nl.length) {
    if (oi<ol.length&&ni<nl.length) {
      if (ol[oi]===nl[ni]) { d.push({t:"same",o:ol[oi],n:nl[ni],oN:oi+1,nN:ni+1}); oi++; ni++; }
      else { d.push({t:"mod",o:ol[oi],n:nl[ni],oN:oi+1,nN:ni+1}); oi++; ni++; }
    } else if (oi<ol.length) { d.push({t:"del",o:ol[oi],n:"",oN:oi+1,nN:null}); oi++; }
    else { d.push({t:"add",o:"",n:nl[ni],oN:null,nN:ni+1}); ni++; }
  }
  return d;
}

/**
 * Risk assessment generator based on source/target language pair.
 */
export function mkRisks(sl,tl) {
  var r=[];
  if (sl!==tl) r.push({lv:"high",cat:"Cross-Language",msg:"Cambios arquitectónicos"});
  if (sl==="javascript") r.push({lv:"medium",cat:"Async",msg:"Callbacks a async/await"});
  if (sl==="java") r.push({lv:"medium",cat:"APIs",msg:"APIs legacy"});
  if (sl==="csharp") r.push({lv:"high",cat:"Framework",msg:"System.Web, ConfigMgr"});
  if (sl==="python") r.push({lv:"medium",cat:"Sintaxis",msg:"print, urllib2"});
  return r;
}

/**
 * Minimal syntax highlighting -- returns array of {text, color} segments.
 * Tokenizes strings, numbers, keywords, and comments per language group.
 */
export function syntaxHL(line,lang) {
  if (!line) return [{text:"",color:null}];
  var segs=[],i=0,s=line;
  // Comment detection
  var cc=lang==="python"||lang==="ruby"?"#":"//";
  var ci=s.indexOf(cc);
  // Skip if inside a string
  var inStr=false;
  if (ci>=0) {
    for(var j=0;j<ci;j++){if(s[j]==="'"||s[j]==='"')inStr=!inStr}
    if (!inStr) return [{text:s.slice(0,ci),color:null},{text:s.slice(ci),color:"#6a9955"}];
  }
  // Keywords per language group
  var kw;
  if (lang==="python"||lang==="ruby") kw=/\b(def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|in|not|and|or|is|None|True|False|self|yield|async|await|raise|lambda|pass|break|continue|require|do|end|module|begin|rescue|puts|attr_accessor)\b/g;
  else if (lang==="java"||lang==="kotlin"||lang==="csharp") kw=/\b(public|private|protected|class|interface|enum|extends|implements|return|if|else|for|while|switch|case|break|try|catch|finally|throw|throws|new|import|package|static|final|void|int|String|boolean|double|float|long|var|val|fun|override|abstract|sealed|record|using|namespace|async|await|null|true|false|this|super|readonly|const|get|set)\b/g;
  else kw=/\b(var|let|const|function|class|return|if|else|for|while|switch|case|break|try|catch|finally|throw|new|import|export|from|require|module|async|await|yield|null|undefined|true|false|this|super|typeof|instanceof|default|extends|of|in)\b/g;
  // Tokenize: strings, keywords, numbers, rest
  var re=/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)/g;
  var parts=[],lastIdx=0,m;
  while((m=re.exec(s))!==null){
    if(m.index>lastIdx)parts.push({t:s.slice(lastIdx,m.index),k:"code"});
    if(m[1])parts.push({t:m[1],k:"str"});
    else if(m[2])parts.push({t:m[2],k:"num"});
    lastIdx=re.lastIndex;
  }
  if(lastIdx<s.length)parts.push({t:s.slice(lastIdx),k:"code"});
  // Apply keywords to "code" parts
  var result=[];
  parts.forEach(function(p){
    if(p.k==="str"){result.push({text:p.t,color:"#ce9178"});return;}
    if(p.k==="num"){result.push({text:p.t,color:"#b5cea8"});return;}
    // Split by keywords
    var last=0;kw.lastIndex=0;
    var km;
    while((km=kw.exec(p.t))!==null){
      if(km.index>last)result.push({text:p.t.slice(last,km.index),color:null});
      result.push({text:km[0],color:"#569cd6"});
      last=kw.lastIndex;
    }
    if(last<p.t.length)result.push({text:p.t.slice(last),color:null});
  });
  return result.length?result:[{text:s,color:null}];
}
