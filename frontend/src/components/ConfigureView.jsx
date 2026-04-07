import { LANGS } from "../config/languages.js";
import { MODELS } from "../config/models.js";
import { generateAndRunQA } from "../services/qaSandbox.js";
import { runVirtualQA, compareVirtualQA, compareQAResults } from "../services/qaHelpers.js";
import { generateReportHTML, exportTestsAsCode } from "../services/reportGenerators.js";
import { generateAndroidReport } from "../services/migrationPhases.js";

export default function ConfigureView(props) {
  var T = props.T;
  var t = props.t;
  var S = props.S;
  var isMobile = props.isMobile;
  var dark = props.dark;
  var files = props.files;
  var sL = props.sL;
  var sV = props.sV;
  var tL = props.tL;
  var tV = props.tV;
  var mt = props.mt;
  var mod = props.mod;
  var setMt = props.setMt;
  var setTL = props.setTL;
  var setTV = props.setTV;
  var setMod = props.setMod;
  var setVw = props.setVw;
  var setShCfg = props.setShCfg;
  var go = props.go;
  var uiL = props.uiL;
  var res = props.res;
  var qaTests = props.qaTests;
  var setQaTests = props.setQaTests;
  var qaPreR = props.qaPreR;
  var setQaPreR = props.setQaPreR;
  var qaPostR = props.qaPostR;
  var setQaPostR = props.setQaPostR;
  var qaVPreR = props.qaVPreR;
  var setQaVPreR = props.setQaVPreR;
  var qaVPostR = props.qaVPostR;
  var setQaVPostR = props.setQaVPostR;
  var qaTestsLd = props.qaTestsLd;
  var setQaTestsLd = props.setQaTestsLd;
  var qaTab = props.qaTab;
  var setQaTab = props.setQaTab;
  var shQaPanel = props.shQaPanel;
  var setShQaPanel = props.setShQaPanel;
  var andReport = props.andReport;
  var setAndReport = props.setAndReport;
  var andReportLd = props.andReportLd;
  var setAndReportLd = props.setAndReportLd;
  var shAndReport = props.shAndReport;
  var setShAndReport = props.setShAndReport;
  var Dots = props.Dots;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={function(){setVw("upload")}} style={S.btn()}>{"←"}</button><h2 style={{fontSize:18,fontWeight:800,color:T.nv}}>{t.cfg}</h2></div>
        <button onClick={function(){setShCfg(true)}} style={S.btn("ai")}>{t.aiCfg}</button>
      </div>
      <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.type}</span></div>
        <div style={{padding:14,display:"flex",gap:10}}>{[{k:"version",i:"",l:t.updVer},{k:"cross",i:"⇄",l:t.chgLang}].map(function(o){return <div key={o.k} onClick={function(){setMt(o.k);setTL(o.k==="version"?sL:"");setTV("")}} style={{flex:1,padding:12,borderRadius:10,cursor:"pointer",border:"2px solid "+(mt===o.k?T.bl:T.bdL),background:mt===o.k?T.blM:T.w}}><div style={{fontSize:20,marginBottom:2}}>{o.i}</div><div style={{fontWeight:700,fontSize:12,color:T.nv}}>{o.l}</div></div>})}</div></div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr auto 1fr",gap:12,alignItems:"start"}}>
        <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.origin}</span></div><div style={{padding:16,textAlign:"center"}}>{sL&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10,padding:"8px 14px",borderRadius:10,background:(LANGS[sL]||{}).c+"08",border:"1px solid "+(LANGS[sL]||{}).c+"20"}}><span style={{fontSize:22}}>{(LANGS[sL]||{}).i}</span><div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:800,color:T.nv}}>{(LANGS[sL]||{}).n}</div><div style={{fontSize:9,color:T.txD}}>{sV||"Latest"}</div></div></div>}<span style={{fontSize:26}}>{(LANGS[sL]||{}).i}</span><div style={{fontSize:15,fontWeight:800,color:T.nv}}>{(LANGS[sL]||{}).n}</div><div style={{fontSize:18,fontWeight:900,color:T.bl}}>{sV}</div></div></div>
        <div style={{alignSelf:"center",marginTop:24,width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",boxShadow:"0 4px 16px "+T.bl+"30",animation:"arrowPulse 2s ease-in-out infinite",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff"}}>{"→"}</div>
        <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.dest}</span></div>
          {tL&&<div style={{padding:"8px 14px",margin:"0 14px",borderRadius:10,background:(LANGS[tL]||{}).c+"08",border:"1px solid "+(LANGS[tL]||{}).c+"20",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4}}><span style={{fontSize:22}}>{(LANGS[tL]||{}).i}</span><div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:800,color:T.nv}}>{(LANGS[tL]||{}).n}</div><div style={{fontSize:9,color:T.txD}}>{tV||""}</div></div></div>}
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
            {mt==="version"
              ? <select value={tV} onChange={function(e){setTL(sL);setTV(e.target.value)}} style={S.sel}><option value="">{t.selVer}</option>{(LANGS[sL]||{v:[]}).v.filter(function(v){return v!==sV}).map(function(v){return <option key={v} value={v}>{v}</option>})}</select>
              : <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <select value={tL} onChange={function(e){setTL(e.target.value);var lv=(LANGS[e.target.value]||{v:[]}).v;setTV(lv.length?lv[lv.length-1]:"")}} style={S.sel}><option value="">{t.selLang}</option>{Object.keys(LANGS).filter(function(k){return k!==sL}).map(function(k){return <option key={k} value={k}>{LANGS[k].n}</option>})}</select>
                  {tL&&<select value={tV} onChange={function(e){setTV(e.target.value)}} style={S.sel}>{(LANGS[tL]||{v:[]}).v.map(function(v){return <option key={v} value={v}>{v}</option>})}</select>}
                </div>}
          </div></div>
      </div>

      <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.model}</span></div>
        <div style={{padding:14,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:8}}>{MODELS.map(function(m){var iS=mod===m.id;return <div key={m.id} onClick={function(){setMod(m.id)}} className="hv-lift" style={{padding:12,borderRadius:12,cursor:"pointer",position:"relative",border:"2px solid "+(iS?T.bl:T.bdL),background:iS?T.blM:T.w,transition:"all .25s",boxShadow:iS?"0 4px 16px "+T.bl+"20":"none"}}>
          <span style={{padding:"1px 6px",borderRadius:8,fontSize:8,fontWeight:800,background:m.bc+"15",color:m.bc}}>{m.badge}</span>
          <div style={{fontSize:12,fontWeight:800,color:T.nv,marginTop:6,marginBottom:3}}>{m.n}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,fontSize:9}}><div><span style={{color:T.txD,fontSize:7,fontWeight:700}}>{t.qual}</span><br/><Dots n={m.q}/></div><div><span style={{color:T.txD,fontSize:7,fontWeight:700}}>{t.spd}</span><br/><b style={{color:T.nv}}>{m.spd}</b></div></div>
          {iS&&<div style={{position:"absolute",top:5,right:5,width:16,height:16,borderRadius:"50%",background:T.bl,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10}}>{"✓"}</div>}
        </div>})}</div>
        {mod.indexOf("haiku")>=0&&(files.length>=3||mt==="cross")&&<div style={{margin:"0 14px 10px",padding:"6px 10px",borderRadius:8,background:T.warnBg,border:"1px solid #fde68a",fontSize:9,color:T.warnTx}}>{"Haiku es rápido pero puede producir resultados de menor calidad en migraciones complejas ("+(files.length>=3?files.length+" archivos":"cross-language")+"). Considera Sonnet para mejor calidad."}</div>}
      </div>

      {sL&&tL&&tV&&<div style={Object.assign({},S.card,{padding:16,background:"linear-gradient(135deg,"+T.blM+","+T.w+")"})}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:12,fontWeight:700,color:T.nv}}>{t.summary}</div><div style={{fontSize:11,color:T.txM}}>{files.length+" arch. · "}<b style={{color:(LANGS[sL]||{}).c}}>{(LANGS[sL]||{}).n+" "+sV}</b>{" → "}<b style={{color:(LANGS[tL]||{}).c}}>{(LANGS[tL]||{}).n+" "+tV}</b></div></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
            {(function(){var tl3=files.reduce(function(s,f){return s+(f.content?f.content.split("\n").length:0)},0);var cx=tl3>500?"high":tl3>200?"medium":"low";var cClr=cx==="high"?"#DC2626":cx==="medium"?"#D97706":"#059669";var cLbl=cx==="high"?"Compleja":cx==="medium"?"Media":"Simple";var eMin=Math.ceil(tl3*0.08);var eMax=Math.ceil(tl3*0.15);var ml3=MODELS.find(function(m){return m.id===mod});var eCost=ml3?((tl3*20*(ml3.pi||0)+tl3*30*(ml3.po||0))/1000000):0;return [<span key="cx" style={{padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:700,background:cClr+"12",color:cClr}}>{cLbl+" ("+tl3+" líneas)"}</span>,<span key="et" style={{padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:600,background:T.blP,color:T.bl}}>{"~"+eMin+"-"+eMax+" min"}</span>,<span key="ec" style={{padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:600,background:"#F0FDF4",color:"#059669"}}>{"~$"+(eCost<0.01?"<0.01":eCost.toFixed(2))}</span>]})()}
          </div>
          <div style={{display:"flex",gap:6}}>
            {(sL==="java"||sL==="kotlin"||tL==="kotlin")&&<button disabled={andReportLd} onClick={async function(){setAndReportLd(true);setAndReport(null);var rv=await generateAndroidReport(files,sL,sV,tL,tV,mod,uiL);setAndReport(rv);setAndReportLd(false);if(rv.ok)setShAndReport(true)}} style={Object.assign({},S.btn("ai"),{padding:"12px 18px",fontSize:12,opacity:andReportLd?.6:1})}>{andReportLd?"⏳ ...":t.andGenReport}</button>}
            <button disabled={qaTestsLd} onClick={async function(){setQaTestsLd(true);setQaPreR(null);setQaPostR(null);var rv=await generateAndRunQA(files,sL,sV,mod,"pre",null);if(rv.ok){setQaTests(rv.suite);setQaPreR(rv.results);setShQaPanel(true)}else{setQaTests(null);setQaPreR(null);}var vr=await runVirtualQA(files,sL,sV,mod,"pre");if(vr.ok){setQaVPreR(vr.virtual)}setQaTestsLd(false);if(!rv.ok&&!vr.ok){alert("Error: "+(rv.error||vr.error||"Unknown"))}}} style={Object.assign({},S.btn("ai"),{padding:"12px 18px",fontSize:12,opacity:qaTestsLd?.6:1})}>{qaTestsLd?t.qaRunning:t.qaGenerate}</button>
            <button onClick={function(){setVw("chat")}} style={Object.assign({},S.btn("ai"),{padding:"14px 24px",fontSize:13,borderRadius:10,display:"inline-flex",alignItems:"center",gap:6})}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>{"Chat IA"}</button>
            <button onClick={go} aria-label={t.migrate} className="mig-btn" style={Object.assign({},S.btn("p"),{padding:"14px 32px",fontSize:14,letterSpacing:"-.01em",animation:"pulseGlow 2.5s ease-in-out infinite",transition:"all .25s",borderRadius:10})}>{t.migrate}</button>
          </div>
        </div></div>}


      {/* QA Sandbox Panel */}
      {shQaPanel&&qaPreR&&(function(){
        var sr=qaPreR.summary;
        var hasPost=!!qaPostR;
        var comparison=hasPost?compareQAResults(qaPreR,qaPostR):null;
        var postSr=hasPost?qaPostR.summary:null;
        return <div style={Object.assign({},S.card,{border:"2px solid "+T.g})}>
          <div style={Object.assign({},S.cH,{background:"linear-gradient(135deg,"+T.okBg+","+T.blM+")"})}>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
              <span style={{fontSize:20}}>{"QA"}</span>
              <div><div style={{fontSize:14,fontWeight:800,color:"#059669"}}>{t.qaTitle}</div>
                <div style={{fontSize:10,color:T.txM}}>{sr.total+" "+t.qaTotal+" · "+sr.timeMs+"ms"}</div></div>
            <div style={{display:"flex",gap:2,background:T.bdL,borderRadius:6,padding:2,marginLeft:12}}>
              <button onClick={function(){setQaTab("sandbox")}} style={{padding:"4px 10px",borderRadius:4,border:"none",fontSize:9,fontWeight:700,cursor:"pointer",background:qaTab==="sandbox"?"#059669":"transparent",color:qaTab==="sandbox"?"#fff":T.txM}}>{t.qaSandbox}</button>
              <button onClick={function(){setQaTab("virtual")}} style={{padding:"4px 10px",borderRadius:4,border:"none",fontSize:9,fontWeight:700,cursor:"pointer",background:qaTab==="virtual"?"#7c3aed":"transparent",color:qaTab==="virtual"?"#fff":T.txM}}>{t.qaVirtual}</button>
            </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {res.length>0&&!qaPostR&&<button onClick={async function(){setQaTestsLd(true);var migFiles=res.map(function(r){return{name:r.targetName||r.name,content:r.migrated}});var rv=await generateAndRunQA(migFiles,tL,tV,mod,"post",qaTests);if(rv.ok){setQaPostR(rv.results)}var vr2=await runVirtualQA(migFiles,tL,tV,mod,"post");if(vr2.ok){setQaVPostR(vr2.virtual)}setQaTestsLd(false)}} disabled={qaTestsLd} style={Object.assign({},S.btn("ai"),{fontSize:10,padding:"6px 12px",opacity:qaTestsLd?.6:1})}>{qaTestsLd?"⏳":t.qaRetest}</button>}
              {qaTests&&<button onClick={function(){var tgt=tL||sL;var code=exportTestsAsCode(qaTests,sL,tgt);var extMap={javascript:"test.js",typescript:"test.ts",python:"test_migraops.py",java:"MigraOpsTest.java",kotlin:"MigraOpsTest.kt",csharp:"MigraOpsTest.cs"};var fname="optimiza_"+(extMap[tgt]||"tests.txt");var blob=new Blob([code],{type:"text/plain"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=fname;a.click();URL.revokeObjectURL(url)}} style={Object.assign({},S.btn(),{fontSize:10,padding:"6px 12px"})}>{t.qaExport}</button>}
              <button onClick={function(){setShQaPanel(false)}} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.txM}}>{"✕"}</button>
            </div>
          </div>

          {/* Score summary bar — Sandbox */}
          {qaTab==="sandbox"&&<div>
          <div style={{display:"flex",gap:12,padding:"10px 14px",borderBottom:"1px solid "+T.bdL,flexWrap:"wrap"}}>
            <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:"#ecfdf5"}}><div style={{fontSize:20,fontWeight:900,color:"#059669"}}>{sr.passed}</div><div style={{fontSize:8,fontWeight:700,color:"#059669"}}>{t.qaPassed}</div></div>
            <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:sr.failed>0?"#fef2f2":"#f9fafb"}}><div style={{fontSize:20,fontWeight:900,color:sr.failed>0?"#dc2626":"#9ca3af"}}>{sr.failed}</div><div style={{fontSize:8,fontWeight:700,color:sr.failed>0?"#dc2626":"#9ca3af"}}>{t.qaFailed}</div></div>
            <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:"#f9fafb"}}><div style={{fontSize:20,fontWeight:900,color:"#6b7280"}}>{sr.skipped}</div><div style={{fontSize:8,fontWeight:700,color:"#6b7280"}}>{t.qaSkipped}</div></div>
            {hasPost&&<div style={{borderLeft:"2px solid "+T.bdL,paddingLeft:12,display:"flex",gap:12}}>
              <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:"#eff6ff"}}><div style={{fontSize:20,fontWeight:900,color:"#2563eb"}}>{postSr.passed}</div><div style={{fontSize:8,fontWeight:700,color:"#2563eb"}}>{t.qaPassed+" (post)"}</div></div>
              <div style={{textAlign:"center",padding:"8px 16px",borderRadius:8,background:postSr.failed>0?"#fef2f2":"#f9fafb"}}><div style={{fontSize:20,fontWeight:900,color:postSr.failed>0?"#dc2626":"#9ca3af"}}>{postSr.failed}</div><div style={{fontSize:8,fontWeight:700,color:postSr.failed>0?"#dc2626":"#9ca3af"}}>{t.qaFailed+" (post)"}</div></div>
            </div>}
            {comparison&&<div style={{borderLeft:"2px solid "+T.bdL,paddingLeft:12,textAlign:"center",padding:"8px 16px",borderRadius:8,background:comparison.summary.regressions>0?"#fef2f2":"#ecfdf5"}}><div style={{fontSize:20,fontWeight:900,color:comparison.summary.regressions>0?"#dc2626":"#059669"}}>{comparison.preservationRate+"%"}</div><div style={{fontSize:8,fontWeight:700,color:comparison.summary.regressions>0?"#dc2626":"#059669"}}>{comparison.summary.regressions>0?t.qaRegression:t.qaIdentical}</div></div>}
          </div>

          </div>}
          {/* Comparison details if post-migration ran */}
          {qaTab==="sandbox"&&comparison&&<div style={{padding:"8px 14px",borderBottom:"1px solid "+T.bdL}}>
            <div style={{fontSize:10,fontWeight:700,color:"#2563eb",marginBottom:6}}>{t.qaCompare}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
              <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#ecfdf5",color:"#059669",fontWeight:700}}>{comparison.summary.identical+" "+t.qaIdentical}</span>
              {comparison.summary.regressions>0&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{comparison.summary.regressions+" "+t.qaRegression}</span>}
              {comparison.summary.newPasses>0&&<span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:"#eff6ff",color:"#2563eb",fontWeight:700}}>{comparison.summary.newPasses+" "+t.qaNewPass}</span>}
            </div>
          </div>}

          {/* Virtual QA Tab */}
          {qaTab==="virtual"&&<div style={{padding:"10px 14px"}}>
            <div style={{fontSize:9,color:"#7c3aed",fontWeight:700,marginBottom:6}}>{t.qaVirtual+" — "+t.qaVDesc}</div>
            {!qaVPreR&&<div style={{padding:20,textAlign:"center",color:T.txD,fontSize:11}}>{t.qaRunning}</div>}
            {qaVPreR&&(function(){
              var vComp=qaVPostR?compareVirtualQA(qaVPreR,qaVPostR):null;
              return <div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                  <span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:T.blM,color:"#7c3aed",fontWeight:700}}>{qaVPreR.summary.totalFunctions+" "+t.qaFunc+"s · "+qaVPreR.summary.totalTests+" tests"}</span>
                  <span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:"#ecfdf5",color:"#059669",fontWeight:700}}>{""+qaVPreR.summary.highConfidence+" "+t.qaVHigh}</span>
                  {qaVPreR.summary.bugsFound>0&&<span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{""+qaVPreR.summary.bugsFound+" bugs"}</span>}
                  {vComp&&<span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:vComp.summary.different>0?"#fef2f2":"#ecfdf5",color:vComp.summary.different>0?"#dc2626":"#059669",fontWeight:700}}>{vComp.preservationRate+"% "+t.qaVEquivalent}</span>}
                </div>
                <div style={{maxHeight:280,overflowY:"auto"}}>
                  {qaVPreR.functions.map(function(fn,fi){
                    var postFn=qaVPostR?(qaVPostR.functions.find(function(pf){return pf.name===fn.name})||null):null;
                    var compF=vComp?vComp.comparisons.find(function(c){return c.name===fn.name}):null;
                    return <div key={fi} style={{marginBottom:8,borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                      <div style={{padding:"6px 10px",background:T.blM,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:10,fontWeight:700,color:"#7c3aed",flex:1}}>{fn.name}</span>
                        <span style={{fontSize:7,padding:"1px 6px",borderRadius:6,background:T.bdL,color:T.txM,fontWeight:600,fontFamily:T.f}}>{fn.file}</span>
                        <span style={{fontSize:8,color:T.txD}}>{fn.description}</span>
                        {compF&&<span style={{fontSize:9,fontWeight:800,color:compF.status==="equivalent"?"#059669":"#dc2626"}}>{compF.status==="equivalent"?"✅":"⚠️"}</span>}
                      </div>
                      {(fn.tests||[]).map(function(tc,ci){
                        var confBg=tc.confidence==="high"?"#ecfdf5":tc.confidence==="medium"?"#fffbeb":"#fef2f2";
                        var confC=tc.confidence==="high"?"#059669":tc.confidence==="medium"?"#d97706":"#dc2626";
                        var confLabel=tc.confidence==="high"?t.qaVHigh:tc.confidence==="medium"?t.qaVMed:t.qaVLow;
                        var postTc=postFn&&postFn.tests?postFn.tests[ci]:null;
                        var caseComp=compF&&compF.cases?compF.cases[ci]:null;
                        return <div key={ci} style={{padding:"4px 10px",fontSize:9,borderTop:"1px solid "+T.bdL,background:caseComp?(caseComp.status==="equivalent"?"#f0fdf4":"#fef2f2"):"#fff"}}>
                          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                            <span style={{fontWeight:700,color:T.tx}}>{tc.label}</span>
                            <span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:confBg,color:confC,fontWeight:700}}>{confLabel}</span>
                            {tc.bugs&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:"#fef2f2",color:"#dc2626",fontWeight:700}}>{""+tc.bugs}</span>}
                            {caseComp&&<span style={{fontSize:8,fontWeight:800,marginLeft:"auto",color:caseComp.status==="equivalent"?"#059669":"#dc2626"}}>{caseComp.status==="equivalent"?"= "+t.qaVEquivalent:"≠ "+t.qaVDifferent}</span>}
                          </div>
                          <div style={{display:"flex",gap:8,color:T.txD,fontFamily:T.f}}>
                            <span>{t.qaInput+": "+JSON.stringify(tc.input)}</span>
                            <span style={{color:"#7c3aed"}}>{t.qaVPredicted+": "+JSON.stringify(tc.predicted)}</span>
                            {postTc&&<span style={{color:"#2563eb"}}>{"Post: "+JSON.stringify(postTc.predicted)}</span>}
                          </div>
                          {tc.trace&&<div style={{marginTop:2,padding:"2px 6px",borderRadius:4,background:T.bdL,color:T.txD,fontSize:8,fontFamily:T.f}}>{t.qaVTrace+": "+tc.trace}</div>}
                          {tc.sideEffects&&tc.sideEffects.length>0&&<div style={{marginTop:2,fontSize:8,color:T.txD}}>{"⚡ "+t.qaVSideEffects+": "+tc.sideEffects.join(", ")}</div>}
                        </div>})}
                    </div>})}
                </div>
              </div>})()}
          </div>}

          {/* Individual test results (Sandbox tab) */}
          {qaTab==="sandbox"&&<div style={{maxHeight:300,overflowY:"auto",padding:"8px 14px"}}>
            {qaPreR.tests.map(function(test,ti){
              var postTest=qaPostR?qaPostR.tests.find(function(pt){return pt.id===test.id})||(qaPostR.tests[ti]||null):null;
              var typeBg=test.type==="unit"?"#dbeafe":test.type==="integration"?"#fef3c7":"#e0e7ff";
              var typeC=test.type==="unit"?"#2563EB":test.type==="integration"?"#92400e":"#4338ca";
              var typeLabel=test.type==="unit"?t.qaUnit:test.type==="integration"?t.qaInteg:t.qaApi;
              return <div key={test.id||ti} style={{marginBottom:8,borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                <div style={{padding:"6px 10px",background:test.passed?"#f0fdf4":test.skipped?"#f9fafb":"#fef2f2",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12}}>{test.skipped?"⏭":test.passed?"✅":"❌"}</span>
                  <span style={{fontSize:10,fontWeight:700,color:T.tx,flex:1}}>{test.name}</span>
                  <span style={{fontSize:7,padding:"1px 6px",borderRadius:6,background:typeBg,color:typeC,fontWeight:700}}>{typeLabel}</span>
                  <span style={{fontSize:7,padding:"1px 6px",borderRadius:6,background:T.bdL,color:T.txM,fontWeight:600,fontFamily:T.f}}>{test.file}</span>
                  <span style={{fontSize:8,color:T.txD,fontFamily:T.f}}>{test.timeMs+"ms"}</span>
                  {postTest&&<span style={{fontSize:10,marginLeft:4}}>{postTest.passed?"✅":"❌"}</span>}
                </div>
                {test.cases.map(function(c,ci){
                  var postCase=postTest&&postTest.cases?postTest.cases[ci]:null;
                  var compItem=comparison&&comparison.comparisons[ti]?comparison.comparisons[ti].cases[ci]:null;
                  var statusBg=compItem?(compItem.status==="identical"?"#f0fdf4":compItem.status==="regression"?"#fef2f2":compItem.status==="new_pass"?"#eff6ff":"#f9fafb"):(c.pass?"#ffffff":"#fff5f5");
                  return <div key={ci} style={{padding:"4px 10px 4px 28px",fontSize:9,borderTop:"1px solid "+T.bdL,display:"flex",gap:8,alignItems:"center",background:statusBg}}>
                    <span style={{width:12,textAlign:"center"}}>{c.skipped?"⏭":c.pass?"✓":"✗"}</span>
                    <span style={{color:T.txM,flex:1}}>{c.label}</span>
                    <span style={{fontFamily:T.f,color:T.txD,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={JSON.stringify(c.input)}>{t.qaInput+": "+JSON.stringify(c.input)}</span>
                    <span style={{fontFamily:T.f,color:c.pass?"#059669":"#dc2626",maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={c.error||JSON.stringify(c.actual)}>{c.error?"Err: "+c.error:JSON.stringify(c.actual)}</span>
                    {compItem&&<span style={{fontSize:8,fontWeight:700,color:compItem.status==="identical"?"#059669":compItem.status==="regression"?"#dc2626":"#2563eb"}}>{compItem.status==="identical"?"=":compItem.status==="regression"?"≠":"+"}</span>}
                  </div>})}
              </div>})}
          </div>}
        </div>})()}

      {/* Android Pre-Migration Report Panel */}
      {andReport&&andReport.ok&&shAndReport&&(function(){
        var rp=andReport.report;
        var impBg=function(imp){return imp==="critical"?"#fef2f2":imp==="major"?"#fffbeb":"#f0fdf4"};
        var impC=function(imp){return imp==="critical"?"#dc2626":imp==="major"?"#d97706":"#059669"};
        return <div style={Object.assign({},S.card,{border:"2px solid "+T.bl})}>
          <div style={Object.assign({},S.cH,{background:"linear-gradient(135deg,"+T.blM+","+T.blP+")"})}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{"📱"}</span>
              <div><div style={{fontSize:14,fontWeight:800,color:T.bl}}>{t.andReport}</div>
                <div style={{fontSize:10,color:T.txM}}>{(LANGS[sL]||{}).n+" "+sV+" → "+(LANGS[tL]||{}).n+" "+tV}</div></div>
            </div>
            <div style={{display:"flex",gap:4}}>
              <button onClick={function(){
                var html=generateReportHTML(rp,files,sL,sV,tL,tV,t);
                var blob=new Blob([html],{type:"text/html;charset=utf-8"});
                var url=URL.createObjectURL(blob);
                var a=document.createElement("a");a.href=url;a.download="optimiza_android_report.html";document.body.appendChild(a);a.click();
                setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url)},200);
              }} style={Object.assign({},S.btn("g"),{padding:"4px 12px",fontSize:10})}>{t.andExportHtml}</button>
              <button onClick={function(){setShAndReport(false)}} style={Object.assign({},S.btn(),{padding:"4px 8px",fontSize:12})}>{"✕"}</button>
            </div>
          </div>
          <div style={{padding:14,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{padding:12,borderRadius:10,background:rp.riskScore>70?"#fef2f2":rp.riskScore>40?"#fffbeb":"#f0fdf4",textAlign:"center"}}>
                <div style={{fontSize:9,fontWeight:700,color:T.txD}}>{"RISK SCORE"}</div>
                <div style={{fontSize:28,fontWeight:900,color:rp.riskScore>70?"#dc2626":rp.riskScore>40?"#d97706":"#059669"}}>{rp.riskScore||0}</div>
              </div>
              <div style={{padding:12,borderRadius:10,background:rp.readinessScore>=70?"#f0fdf4":rp.readinessScore>=40?"#fffbeb":"#fef2f2",textAlign:"center"}}>
                <div style={{fontSize:9,fontWeight:700,color:T.txD}}>{"READINESS"}</div>
                <div style={{fontSize:28,fontWeight:900,color:rp.readinessScore>=70?"#059669":rp.readinessScore>=40?"#d97706":"#dc2626"}}>{rp.readinessScore||0}</div>
              </div>
            </div>

            {rp.summary&&<div style={{padding:10,borderRadius:8,background:T.blM,fontSize:11,lineHeight:1.6,color:T.txM}}>{rp.summary}</div>}

            {rp.architecture&&<div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
              <div style={{padding:10,borderRadius:8,background:"#fef2f2",textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.andPattern}</div><div style={{fontSize:12,fontWeight:800,color:"#dc2626"}}>{rp.architecture.current}</div></div>
              <span style={{fontSize:16}}>{"→"}</span>
              <div style={{padding:10,borderRadius:8,background:"#f0fdf4",textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.andTarget}</div><div style={{fontSize:12,fontWeight:800,color:"#059669"}}>{rp.architecture.target}</div></div>
            </div>}

            {rp.breaches&&rp.breaches.length>0&&<div>
              <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andBreach+" ("+rp.breaches.length+")"}</div>
              <div style={{maxHeight:200,overflowY:"auto",border:"1px solid "+T.bdL,borderRadius:8}}>
                {rp.breaches.map(function(b,i){return <div key={i} style={{padding:"6px 10px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:6,background:i%2===0?"transparent":T.cBg}}>
                  <span style={{padding:"1px 6px",borderRadius:10,fontSize:8,fontWeight:700,background:impBg(b.impact),color:impC(b.impact)}}>{b.impact}</span>
                  <span style={{fontFamily:T.f,fontSize:9,color:T.bl}}>{b.file}{b.line?":"+b.line:""}</span>
                  <span style={{fontSize:9,color:T.txM,flex:1}}>{b.current+" → "+b.target}</span>
                  <span style={{fontSize:8,color:T.txD}}>{b.effort}</span>
                </div>})}
              </div>
            </div>}

            {rp.refactorPlan&&rp.refactorPlan.length>0&&<div>
              <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andRefactor}</div>
              {rp.refactorPlan.map(function(p,i){return <div key={i} style={{padding:"8px 12px",borderLeft:"3px solid #7F52FF",marginBottom:6,background:T.cBg,borderRadius:"0 8px 8px 0"}}>
                <div style={{fontSize:11,fontWeight:800,color:T.bl}}>{"Fase "+p.phase+": "+p.name}</div>
                <div style={{fontSize:10,color:T.txM,marginTop:2}}>{p.description}</div>
                {p.tasks&&<div style={{marginTop:4}}>{p.tasks.map(function(tk,j){return <div key={j} style={{fontSize:9,color:T.tx,padding:"1px 0"}}>{"• "+tk}</div>})}</div>}
                <div style={{fontSize:8,color:T.txD,marginTop:3}}>{t.andEffort+": "+p.estimatedEffort}</div>
              </div>})}
            </div>}

            {rp.libraryUpdates&&rp.libraryUpdates.length>0&&<div>
              <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andLibs}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {rp.libraryUpdates.map(function(l,i){return <div key={i} style={{padding:"3px 8px",borderRadius:6,fontSize:9,border:"1px solid "+(l.breaking?"#fecaca":"#a7f3d0"),background:l.breaking?"#fef2f2":"#f0fdf4"}}>
                  <span style={{color:T.txD}}>{l.current}</span>{" → "}<b style={{color:l.breaking?"#dc2626":"#059669"}}>{l.recommended}</b>
                </div>})}
              </div>
            </div>}

            {rp.modularization&&rp.modularization.recommended&&<div>
              <div style={{fontSize:11,fontWeight:800,color:T.nv,marginBottom:6}}>{t.andModular}</div>
              <div style={{fontSize:9,color:T.txM,marginBottom:4}}>{"Actual: "+rp.modularization.current}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:6}}>
                {rp.modularization.recommended.map(function(m,i){return <div key={i} style={{padding:8,borderRadius:8,background:T.blM,border:"1px solid "+T.bdL}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.nv}}>{m.module}</div>
                  {m.contents&&<div style={{fontSize:8,color:T.txD,marginTop:2}}>{m.contents.join(", ")}</div>}
                </div>})}
              </div>
            </div>}
          </div>
        </div>
      })()}
      {andReport&&!andReport.ok&&<div style={Object.assign({},S.card,{padding:12,background:"#fef2f2",textAlign:"center",fontSize:11,color:T.r})}>{"Error: "+(andReport.error||"?")}</div>}
    </div>
  );
}
