import React, { useState, useEffect } from "react";
import { LANGS } from "../config/languages.js";
import { MODELS } from "../config/models.js";
import { _tks } from "../services/claudeClient.js";
import { resolveScreenshots, generateVisualQAHTML } from "../services/visualQAReport.js";

function ResultsView(props) {
  var vw=props.vw, res=props.res, actR=props.actR, setActR=props.setActR;
  var shR=props.shR, setShR=props.setShR;
  var pdfLd=props.pdfLd, generatePDF=props.generatePDF;
  var t=props.t, T=props.T, S=props.S;
  var rsk=props.rsk, bR=props.bR, intR=props.intR;
  var auditTrail=props.auditTrail;
  var audTab=props.audTab, setAudTab=props.setAudTab;
  var audExpand=props.audExpand, setAudExpand=props.setAudExpand;
  var fmtMs=props.fmtMs, dlF=props.dlF, dlN=props.dlN;
  var uiL=props.uiL, isMobile=props.isMobile, dark=props.dark;
  var rst=props.rst;
  var dm=props.dm, setDm=props.setDm;
  var tOut=props.tOut, setTOut=props.setTOut;
  var sL=props.sL, tL=props.tL, sV=props.sV, tV=props.tV;
  var mod=props.mod;
  var migStartTs=props.migStartTs;
  var resTab=props.resTab, setResTab=props.setResTab;
  var CodeLine=props.CodeLine;
  var pwComparison=props.pwComparison;
  var visualQA=props.visualQA;
  var qaTests=props.qaTests;

  // Resolve screenshots from IndexedDB when visualQA report is available
  var resolvedVQAState = useState(null);
  var resolvedVQA = resolvedVQAState[0];
  var setResolvedVQA = resolvedVQAState[1];
  var vqaLoadingState = useState(false);
  var vqaLoading = vqaLoadingState[0];
  var setVqaLoading = vqaLoadingState[1];
  var vqaViewState = useState("overview"); // "overview" | "pre" | "post" | "compare"
  var vqaView = vqaViewState[0];
  var setVqaView = vqaViewState[1];

  useEffect(function() {
    if (visualQA && !resolvedVQA) {
      setVqaLoading(true);
      resolveScreenshots(visualQA).then(function(resolved) {
        setResolvedVQA(resolved);
        setVqaLoading(false);
      }).catch(function() { setVqaLoading(false); });
    }
    if (!visualQA) setResolvedVQA(null);
  }, [visualQA]);

  if(!(vw==="results"&&res.length>0&&res[actR]))return null;

  var r=res[actR],d=r.diff||[];
  var ad=d.filter(function(x){return x.t==="add"}).length;
  var rm=d.filter(function(x){return x.t==="del"}).length;
  return <React.Fragment><div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <h2 style={{fontSize:16,fontWeight:800,color:T.nv}}>{"✅ "+t.done+" ("+res.length+")"}</h2>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              <button onClick={function(){setShR(!shR)}} style={S.btn()}>{"⚠️"}</button>
              <button disabled={pdfLd} onClick={generatePDF} style={Object.assign({},S.btn("ai"),{opacity:pdfLd?.6:1})}>{"📄 "+(pdfLd?t.pdfGen:t.pdfExport)}</button>
              <button onClick={function(){res.forEach(function(x){dlF(x.migrated,dlN(x.name,x.targetName))})}} style={S.btn("g")}>{"⬇ "+t.dlAll}</button>
                            <button onClick={rst} style={S.btn("p")}>{"🔄 "+t.newMig}</button>
            </div></div>

          {shR&&rsk.length>0&&<div style={Object.assign({},S.card,{border:"1px solid #fde68a"})}><div style={Object.assign({},S.cH,{background:T.warnBg})}><span style={{fontWeight:700,color:T.nv}}>{"⚠️ "+t.risks}</span></div><div style={{padding:8}}>{rsk.map(function(x,i){return <div key={i} style={{padding:"5px 8px",borderRadius:6,marginBottom:3,background:T.cBg,display:"flex",alignItems:"center",gap:6,fontSize:10}}>{bR(x.lv)}<b>{x.cat}</b>{" — "+x.msg}</div>})}</div></div>}

          {/* INTEGRATION REPORT */}
          {intR&&intR.ok&&<div style={Object.assign({},S.card,{border:"2px solid "+(intR.result.score>=95?T.okBd:intR.result.score>=70?T.warnBd:T.errBd)})}>
            <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10,background:intR.result.score>=95?T.okBg:intR.result.score>=70?T.warnBg:T.errBg,borderBottom:"1px solid "+T.bdL}}>
              <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid "+(intR.result.score>=95?T.g:intR.result.score>=70?T.y:T.r),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:intR.result.score>=95?T.g:intR.result.score>=70?T.y:T.r}}>{intR.result.score}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:T.nv}}>{"🔗 "+t.intTitle}</div>
                <div style={{fontSize:10,color:T.txM}}>{intR.result.pass?"✅ "+t.intPass:"⚠️ "+t.intFail}</div>
              </div>
            </div>
            {intR.result.summary&&<div style={{padding:"8px 16px",fontSize:10,color:T.txM,background:T.blM,borderBottom:"1px solid "+T.bdL}}>{intR.result.summary}</div>}
            {intR.result.scoreBreakdown&&<div style={{padding:"4px 16px",fontSize:9,fontFamily:T.f,color:T.txD,background:T.cBg,borderBottom:"1px solid "+T.bdL}}>{"📐 "+intR.result.scoreBreakdown}</div>}
            <div style={{padding:8,maxHeight:200,overflowY:"auto"}}>
              {intR.result.issues&&intR.result.issues.length>0&&<div style={{marginBottom:6}}>
                <div style={{fontSize:10,fontWeight:700,color:T.r,marginBottom:3,padding:"0 6px"}}>{""+t.intIssues+" ("+intR.result.issues.length+")"}</div>
                {intR.result.issues.map(function(is,i){return <div key={i} style={{padding:"5px 8px",marginBottom:3,borderRadius:6,background:is.severity==="critical"?T.errBg:T.warnBg,border:"1px solid "+(is.severity==="critical"?T.errBd:T.warnBd),fontSize:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
                    <span style={{fontSize:7,fontWeight:800,padding:"0 5px",borderRadius:3,background:is.severity==="critical"?T.r:is.severity==="major"?"#f97316":T.y,color:"#fff"}}>{is.severity}</span>
                    <span style={{fontSize:7,fontWeight:700,padding:"0 4px",borderRadius:3,background:T.bdL,color:T.txM}}>{is.category}</span>
                    {is.files&&<span style={{fontSize:8,color:T.txD,fontFamily:T.f}}>{is.files.join(" ↔ ")}</span>}
                  </div>
                  <div style={{color:is.severity==="critical"?T.r:T.warnTx,fontWeight:600}}>{is.msg}</div>
                  {is.fix&&<div style={{marginTop:2,padding:"2px 6px",borderRadius:4,background:T.w,fontSize:9,color:T.txM,fontFamily:T.f}}>{"→ "+is.fix}</div>}
                </div>})}
              </div>}
              {intR.result.verified&&intR.result.verified.length>0&&<div>
                <div style={{fontSize:10,fontWeight:700,color:T.g,marginBottom:3,padding:"0 6px"}}>{""+t.intVerified}</div>
                {intR.result.verified.map(function(v,i){return <div key={i} style={{padding:"2px 8px",fontSize:10,color:T.g}}>{"✓ "+v}</div>})}
              </div>}
            </div>
          </div>}

          {/* AUDIT TRAIL — Professional timing & analytics dashboard */}
          {auditTrail&&(function(){
            // ── Computed analytics ──
            var phases=auditTrail.phases||[];
            var totalMs=auditTrail.totalDurationMs||1;
            var fileTimes=phases.filter(function(p){return p.id==="B"&&p.files}).reduce(function(a,p){return a.concat(p.files||[])},[]).filter(function(f){return f.durationMs>0});
            var avgFile=fileTimes.length?Math.round(fileTimes.reduce(function(s,f){return s+f.durationMs},0)/fileTimes.length):0;
            var slowFile=fileTimes.length?Math.max.apply(null,fileTimes.map(function(f){return f.durationMs})):0;
            var fastFile=fileTimes.length?Math.min.apply(null,fileTimes.map(function(f){return f.durationMs})):0;
            var cPhases=phases.filter(function(p){return p.id&&p.id.startsWith("C")&&p.score!==undefined&&!p.rolledBack});
            var dPhases=phases.filter(function(p){return p.id&&p.id.startsWith("D")});
            var migTime=phases.filter(function(p){return p.id==="A"||p.id==="B"||p.id==="B2"||p.id==="B2a"||p.id==="B2b"}).reduce(function(s,p){return s+(p.durationMs||0)},0);
            var qaTime=phases.filter(function(p){return p.id&&(p.id.startsWith("C")||p.id.startsWith("D"))}).reduce(function(s,p){return s+p.durationMs},0);
            var migPct=Math.round((migTime/totalMs)*100);
            var qaPct=100-migPct;
            // Phase descriptions
            var phDescsAll={
              es:{A:"Análisis de arquitectura, dependencias y contratos del codebase",B:"Por archivo: planificación detallada + migración guiada por receta",B2:"Auditoría de dependencias cross-file + consolidación con corrección guiada",C1:"Validación integral: 12 dimensiones (integración + calidad)",D1:"Corrección automática de issues detectados por Claude",C2:"Re-validación post-fix con regression check",D2:"Corrección con escalation — estrategia diferente",C3:"Verificación final de integración",D3:"Corrección final con rewrite completo",C4:"Check final"},
              en:{A:"Architecture analysis: dependencies, contracts, entry points",B:"Per-file: detailed planning + recipe-guided migration",B2:"Cross-file dependency audit + guided consolidation fix",C1:"Comprehensive validation: 12 dimensions (integration + quality)",D1:"Automatic fix of issues detected by Claude",C2:"Post-fix re-validation with regression check",D2:"Fix with escalation — different strategy",C3:"Final integration verification",D3:"Final fix with full rewrite",C4:"Final check"},
              pt:{A:"Análise de arquitetura, dependências e contratos do codebase",B:"Migração sequencial por arquivo com contexto de dependências",B2:"Consolidação cross-file: imports, signatures, module system",C1:"Validação integral: 12 dimensões (integração + qualidade)",D1:"Correção automática de issues detectados por Claude",C2:"Re-validação pós-fix com regression check",D2:"Correção com escalation — estratégia diferente",C3:"Verificação final de integração",D3:"Correção final com rewrite completo",C4:"Check final"}
            };
            var phDescs=phDescsAll[uiL]||phDescsAll.es;
            var phIcons={A:"C",B:"›",B2:"B2",C1:"✅",C2:"✅",C3:"✅",C4:"✅",D1:"",D2:"",D3:""};
            var phColors={A:"#6366f1",B:"#2563EB",B2:"#0ea5e9",B2a:"#38bdf8",B2b:"#0ea5e9",C1:"#059669",C2:"#059669",C3:"#059669",C4:"#059669",D1:"#d97706",D2:"#d97706",D3:"#d97706"};
            // Category groups
            var groups=[
              {key:"mig",label:"Migración",ids:["A","B","B2"],color:"#2563EB",icon:"›"},
              {key:"qa",label:"QA / Integración",ids:phases.filter(function(p){return p.id&&(p.id.startsWith("C")||p.id.startsWith("D"))}).map(function(p){return p.id}),color:"#059669",icon:"✅"}
            ];

            return <div style={Object.assign({},S.card,{overflow:"visible"})}>
              {/* Header */}
              <div style={Object.assign({},S.cH,{background:"linear-gradient(135deg,"+T.nv+","+T.bl+")"})}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{"⏱️"}</span><div><div style={{fontWeight:800,fontSize:13,color:"#fff"}}>{t.auditTitle}</div><div style={{fontSize:9,color:"#93b4ff"}}>{t.auditDesc+" — "+phases.length+" "+t.auditPhases}</div></div></div>
                <button onClick={function(){dlF(JSON.stringify(auditTrail,null,2),"migraops_audit_"+auditTrail.id+".json")}} style={Object.assign({},S.btn("g"),{padding:"5px 12px",fontSize:9})}>{"📋 "+t.auditExport}</button>
              </div>

              {/* KPI Strip — Enhanced */}
              <div style={{padding:"14px 16px",display:"flex",gap:0,alignItems:"stretch",borderBottom:"1px solid "+T.bdL,flexWrap:"wrap"}}>
                {/* Total time with mini donut */}
                <div style={{flex:"1 1 auto",display:"flex",alignItems:"center",gap:10,padding:"0 12px",borderRight:"1px solid "+T.bdL,minWidth:140}}>
                  <div style={{position:"relative",width:44,height:44}}>
                    <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke={T.bdL} strokeWidth="4"/><circle cx="22" cy="22" r="18" fill="none" stroke={T.bl} strokeWidth="4" strokeDasharray={migPct*1.13+" 113"} strokeLinecap="round" transform="rotate(-90 22 22)"/><circle cx="22" cy="22" r="18" fill="none" stroke={T.g} strokeWidth="4" strokeDasharray={qaPct*1.13+" 113"} strokeDashoffset={-migPct*1.13} strokeLinecap="round" transform="rotate(-90 22 22)"/></svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:T.nv,fontFamily:T.f}}>{phases.length}</div>
                  </div>
                  <div><div style={{fontSize:20,fontWeight:900,color:T.nv,fontFamily:T.f,lineHeight:1}}>{fmtMs(totalMs)}</div><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.auditTotal}</div>
                    <div style={{display:"flex",gap:6,marginTop:2}}>
                      <span style={{fontSize:7,color:T.bl}}>{"● "+t.gPhB+" "+migPct+"%"}</span>
                      <span style={{fontSize:7,color:T.g}}>{"● "+t.gPhC+" "+qaPct+"%"}</span>
                    </div>
                  </div>
                </div>
                {/* API calls */}
                <div style={{flex:"0 0 auto",textAlign:"center",padding:"0 14px",borderRight:"1px solid "+T.bdL}}>
                  <div style={{fontSize:18,fontWeight:900,color:T.bl,fontFamily:T.f}}>{auditTrail.apiCalls}</div>
                  <div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.auditCalls}</div>
                </div>
                {/* Files */}
                <div style={{flex:"0 0 auto",textAlign:"center",padding:"0 14px",borderRight:"1px solid "+T.bdL}}>
                  <div style={{fontSize:18,fontWeight:900,color:T.nv,fontFamily:T.f}}>{auditTrail.config.fileCount}</div>
                  <div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.filesLbl}</div>
                </div>
                {/* Per-file stats */}
                {fileTimes.length>0&&<div style={{flex:"1 1 auto",display:"flex",gap:8,padding:"0 14px",borderRight:"1px solid "+T.bdL,alignItems:"center"}}>
                  <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:T.txM,fontFamily:T.f}}>{fmtMs(avgFile)}</div><div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.auditAvg}</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:T.r,fontFamily:T.f}}>{fmtMs(slowFile)}</div><div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.auditSlowest}</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:800,color:T.g,fontFamily:T.f}}>{fmtMs(fastFile)}</div><div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.auditFastest}</div></div>
                </div>}
                {/* Throughput */}
                {(function(){var totalLines=0;try{(res||[]).forEach(function(r){totalLines+=r.migrated?r.migrated.split("\n").length:0})}catch(e){};if(!totalLines)return null;var lps=totalMs>0?Math.round(totalLines/(totalMs/1000)):0;return <div style={{flex:"0 0 auto",textAlign:"center",padding:"0 14px",borderRight:"1px solid "+T.bdL}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#6366f1",fontFamily:T.f}}>{totalLines}</div>
                  <div style={{fontSize:7,fontWeight:700,color:T.txD}}>{t.lines}</div>
                  <div style={{fontSize:7,color:T.txD}}>{lps+" "+t.lines+"/s"}</div>
                </div>})()}
                {/* Final score */}
                {auditTrail.finalScore!=null&&<div style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:6,padding:"0 14px"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid "+(auditTrail.finalScore>=95?T.g:auditTrail.finalScore>=80?T.y:T.r),display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:auditTrail.finalScore>=95?T.g:auditTrail.finalScore>=80?T.y:T.r,fontFamily:T.f}}>{auditTrail.finalScore}</div>
                  <div><div style={{fontSize:8,fontWeight:700,color:T.txD}}>{t.score}</div><div style={{fontSize:7,color:auditTrail.finalPass?T.g:T.y}}>{auditTrail.finalPass?"✓ PASS":""+t.obs}</div></div>
                </div>}
              </div>

              {/* Tab navigation */}
              <div style={{padding:"8px 16px",borderBottom:"1px solid "+T.bdL,display:"flex",gap:4,background:T.cBg}}>
                {[{k:"pipeline",l:"📊 "+t.auditPipeline},{k:"charts",l:"📈 "+t.auditDistrib},{k:"detail",l:"📋 "+t.auditDetail}].map(function(tb){
                  return <button key={tb.k} onClick={function(){setAudTab(tb.k)}} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:T.ui,background:audTab===tb.k?T.nv:"transparent",color:audTab===tb.k?"#fff":T.txD,transition:"all .15s"}}>{tb.l}</button>
                })}
              </div>

              {/* ═══ TAB: Pipeline — Connected timeline with phase cards ═══ */}
              {audTab==="pipeline"&&<div style={{padding:"16px 16px 16px 28px"}}>
                {/* Expand/Collapse all */}
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
                  <button onClick={function(){var allExpanded=phases.every(function(ph){return audExpand[ph.id]});var n={};phases.forEach(function(ph){n[ph.id]=!allExpanded});setAudExpand(n)}} style={{fontSize:8,fontWeight:700,color:T.bl,background:"none",border:"none",cursor:"pointer",fontFamily:T.ui,padding:"2px 6px"}}>{phases.every(function(ph){return audExpand[ph.id]})?"▲ Collapse":"▼ Expand all"}</button>
                </div>
                {phases.map(function(ph,i){
                  var pct=Math.max(2,Math.round((ph.durationMs/totalMs)*100));
                  var clr=phColors[ph.id]||(ph.id.startsWith("C")?T.g:ph.id.startsWith("D")?T.y:T.bl);
                  var icon=phIcons[ph.id]||"⚙";
                  var desc=phDescs[ph.id]||(ph.name||"");
                  var stClr=ph.status==="done"?T.g:ph.status==="error"?T.r:T.y;
                  var isExpanded=audExpand[ph.id];
                  var isLast=i===phases.length-1;
                  // Group separator: detect transition from migration (A/B/B2) to QA (C/D)
                  var prevPh=i>0?phases[i-1]:null;
                  var isMigPhase=function(id){return id==="A"||id==="B"||id==="B2"};
                  var isQaPhase=function(id){return id&&(id.startsWith("C")||id.startsWith("D"))};
                  var showGroupSep=prevPh&&isMigPhase(prevPh.id)&&isQaPhase(ph.id);
                  // Detail string
                  var detailParts=[];
                  if(ph.score!==undefined)detailParts.push("Score: "+ph.score+"/100");
                  if(ph.issueCount!==undefined)detailParts.push(ph.issueCount+" issues");
                  if(ph.fixedFiles!==undefined)detailParts.push(ph.fixedFiles+" archivos corregidos");
                  if(ph.fixedFiles!==undefined&&ph.issueCount)detailParts.push(Math.round((ph.fixedFiles/(ph.issueCount||1))*100)+"% fix rate");
                  if(ph.fileCount!==undefined&&ph.id==="B")detailParts.push(ph.fileCount+" archivos migrados");
                  if(ph.detail&&!ph.score)detailParts.push(ph.detail);

                  return <div key={i}>
                    {showGroupSep&&<div style={{display:"flex",alignItems:"center",gap:8,margin:"6px 0 10px",paddingLeft:2}}>
                      <div style={{flex:1,height:1,background:"linear-gradient(90deg,"+T.g+","+T.bdL+")"}}></div>
                      <span style={{fontSize:8,fontWeight:800,color:T.g,textTransform:"uppercase",letterSpacing:1}}>{"✅ "+t.gPhC}</span>
                      <div style={{flex:1,height:1,background:"linear-gradient(90deg,"+T.bdL+","+T.g+")"}}></div>
                    </div>}
                    <div style={{position:"relative",paddingLeft:28,paddingBottom:isLast?0:16,minHeight:isLast?40:56}}>
                    {/* Vertical connector line */}
                    {!isLast&&<div style={{position:"absolute",left:11,top:20,bottom:0,width:2,background:"linear-gradient(180deg,"+clr+","+((phColors[phases[i+1]&&phases[i+1].id])||T.bdL)+")"}}></div>}
                    {/* Node circle */}
                    <div style={{position:"absolute",left:3,top:4,width:18,height:18,borderRadius:"50%",background:clr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,zIndex:2,boxShadow:"0 0 0 3px "+T.w+",0 0 0 4px "+clr+"40"}}><span style={{filter:"brightness(10)"}}>{icon}</span></div>
                    {/* Phase card */}
                    <div onClick={function(){setAudExpand(function(p){var n=Object.assign({},p);n[ph.id]=!n[ph.id];return n})}} style={{borderRadius:10,border:"1px solid "+(isExpanded?clr:T.bdL),background:isExpanded?clr+"08":T.w,cursor:"pointer",overflow:"hidden",transition:"all .2s"}}>
                      {/* Card header */}
                      <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:8,fontWeight:900,color:clr,fontFamily:T.f,background:clr+"15",padding:"1px 5px",borderRadius:4}}>{ph.id}</span>
                            <span style={{fontSize:10,fontWeight:700,color:T.nv}}>{ph.name}</span>
                            <span style={{marginLeft:"auto",fontSize:14,fontWeight:900,color:T.nv,fontFamily:T.f}}>{fmtMs(ph.durationMs)}</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{marginTop:4,display:"flex",alignItems:"center",gap:6}}>
                            <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}>
                              <div style={{width:pct+"%",height:"100%",borderRadius:3,background:"linear-gradient(90deg,"+clr+","+clr+"cc)",transition:"width .5s ease"}}></div>
                            </div>
                            <span style={{fontSize:7,fontWeight:700,color:T.txD,flexShrink:0}}>{pct+"%"}</span>
                            <span style={{width:7,height:7,borderRadius:"50%",background:stClr,flexShrink:0}}></span>
                          </div>
                        </div>
                      </div>
                      {/* Expanded detail */}
                      {isExpanded&&<div style={{padding:"0 12px 10px",borderTop:"1px solid "+T.bdL,marginTop:0}}>
                        <div style={{fontSize:9,color:T.txM,marginTop:8,lineHeight:1.5}}>{desc}</div>
                        {detailParts.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
                          {detailParts.map(function(dp,j){return <span key={j} style={{padding:"2px 8px",borderRadius:6,fontSize:8,fontWeight:600,background:T.cBg,color:T.txM,border:"1px solid "+T.bdL}}>{dp}</span>})}
                        </div>}
                        <div style={{display:"flex",gap:10,marginTop:6,fontSize:8,color:T.txD}}>
                          <span>{t.auditStart+": "+(ph.startedAt?ph.startedAt.slice(11,19):"—")}</span>
                          <span>{t.auditEnd+": "+(ph.completedAt?ph.completedAt.slice(11,19):"—")}</span>
                          <span style={{padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:700,background:stClr+"18",color:stClr}}>{ph.status}</span>
                        </div>
                        {/* Sub-files for Phase B */}
                        {ph.files&&ph.files.length>0&&<div style={{marginTop:8}}>
                          {ph.files.map(function(fl,j){
                            var fPct=ph.durationMs>0?Math.round((fl.durationMs/ph.durationMs)*100):0;
                            return <div key={j} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:j<ph.files.length-1?"1px solid "+T.bdL:"none"}}>
                              <span style={{width:8,height:8,borderRadius:2,background:fl.status==="done"?T.g:T.r,flexShrink:0}}></span>
                              <span style={{fontSize:8,fontWeight:700,color:T.nv,fontFamily:T.f,width:100,flexShrink:0}}>{fl.name}</span>
                              <div style={{flex:1,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:fPct+"%",height:"100%",borderRadius:2,background:T.bl}}></div></div>
                              <span style={{fontSize:8,fontWeight:700,color:T.txM,fontFamily:T.f,flexShrink:0}}>{fmtMs(fl.durationMs)}</span>
                              <span style={{fontSize:7,color:T.txD}}>{fl.changes+" "+t.changes}</span>
                            </div>
                          })}
                        </div>}
                      </div>}
                    </div>
                  </div>
                  </div>
                })}
              </div>}

              {/* ═══ TAB: Charts — Distribution, Score evolution, File comparison ═══ */}
              {audTab==="charts"&&<div style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
                {/* Time Distribution — Stacked horizontal bar */}
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:8}}>{"📊 "+t.auditDistrib}</div>
                  <div style={{display:"flex",height:28,borderRadius:6,overflow:"hidden",border:"1px solid "+T.bdL}}>
                    {phases.map(function(ph,i){
                      var pct=Math.max(1,Math.round((ph.durationMs/totalMs)*100));
                      var clr=phColors[ph.id]||T.bl;
                      return <div key={i} title={ph.id+": "+fmtMs(ph.durationMs)+" ("+pct+"%)"} style={{width:pct+"%",background:clr,display:"flex",alignItems:"center",justifyContent:"center",minWidth:pct>5?0:2,transition:"width .5s"}}>
                        {pct>6&&<span style={{fontSize:7,fontWeight:800,color:"#fff"}}>{ph.id}</span>}
                      </div>
                    })}
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:6}}>
                    {phases.map(function(ph,i){
                      var clr=phColors[ph.id]||T.bl;
                      return <div key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:8,color:T.txM}}>
                        <span style={{width:8,height:8,borderRadius:2,background:clr}}></span>
                        <span style={{fontWeight:700}}>{ph.id}</span>
                        <span>{fmtMs(ph.durationMs)}</span>
                      </div>
                    })}
                  </div>
                </div>

                {/* Score Evolution — Line chart with auto-scaled Y-axis */}
                {cPhases.length>1&&(function(){
                  var scores=cPhases.map(function(cp){return cp.score||0});
                  var minScore=Math.min.apply(null,scores);
                  var maxScore=Math.max.apply(null,scores);
                  // Auto-scale: pad range by 10 pts each side, clamp 0-100
                  var yMin=Math.max(0,Math.floor((minScore-10)/5)*5);
                  var yMax=Math.min(100,Math.ceil((maxScore+10)/5)*5);
                  if (yMax-yMin<20) { yMin=Math.max(0,yMin-5); yMax=Math.min(100,yMax+5); }
                  var yRange=yMax-yMin;
                  // Generate 5 grid lines within the visible range
                  var yStep=Math.max(5,Math.round(yRange/4/5)*5);
                  var yLabels=[];
                  for (var yv=yMin;yv<=yMax;yv+=yStep) yLabels.push(yv);
                  if (yLabels[yLabels.length-1]<yMax) yLabels.push(yMax);
                  // Chart dimensions
                  var chartH=140, padT=14, padB=20, plotH=chartH-padT-padB;
                  var padL=30, padR=16;
                  var chartW=isMobile?260:420;
                  var plotW=chartW-padL-padR;
                  var yPos=function(v){return padT+((yMax-v)/yRange)*plotH};
                  var xPos=function(i){return padL+(cPhases.length>1?i*(plotW/(cPhases.length-1)):plotW/2)};
                  // Pass threshold visible?
                  var passThreshold=90; var passVisible=passThreshold>=yMin&&passThreshold<=yMax;

                  return <div>
                    <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:8}}>{"📈 "+t.auditScoreEvol}</div>
                    <div style={{position:"relative",width:chartW,height:chartH,border:"1px solid "+T.bdL,borderRadius:8,background:T.cBg}}>
                      {/* Y-axis labels + grid lines */}
                      {yLabels.map(function(v){
                        var y=yPos(v);
                        return <div key={v}>
                          <div style={{position:"absolute",left:2,top:y-5,fontSize:7,color:T.txD,fontFamily:T.f,width:24,textAlign:"right"}}>{v}</div>
                          <div style={{position:"absolute",left:padL,right:padR,top:y,height:1,background:T.bdL}}></div>
                        </div>
                      })}
                      {/* Pass threshold line */}
                      {passVisible&&<div>
                        <div style={{position:"absolute",left:padL,right:padR,top:yPos(passThreshold),height:1,background:T.g,opacity:.4}}></div>
                        <div style={{position:"absolute",right:padR+2,top:yPos(passThreshold)-8,fontSize:6,color:T.g,fontWeight:700}}>{passThreshold+" PASS"}</div>
                      </div>}
                      {/* Gradient fill under the line */}
                      <svg style={{position:"absolute",left:0,top:0,width:chartW,height:chartH,pointerEvents:"none"}}>
                        <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.bl} stopOpacity="0.15"/><stop offset="100%" stopColor={T.bl} stopOpacity="0.02"/></linearGradient></defs>
                        {cPhases.length>1&&<path d={
                          "M "+xPos(0)+" "+yPos(scores[0])+
                          scores.slice(1).map(function(s,i){return " L "+xPos(i+1)+" "+yPos(s)}).join("")+
                          " L "+xPos(scores.length-1)+" "+(padT+plotH)+
                          " L "+xPos(0)+" "+(padT+plotH)+" Z"
                        } fill="url(#scoreGrad)"/>}
                      </svg>
                      {/* Connecting lines */}
                      <svg style={{position:"absolute",left:0,top:0,width:chartW,height:chartH,pointerEvents:"none",zIndex:1}}>
                        {cPhases.map(function(cp,i){
                          if (i===0) return null;
                          var prev=cPhases[i-1];
                          return <line key={i} x1={xPos(i-1)} y1={yPos(prev.score||0)} x2={xPos(i)} y2={yPos(cp.score||0)} stroke={T.bl} strokeWidth="2.5" strokeLinecap="round"/>
                        })}
                      </svg>
                      {/* Data points */}
                      {cPhases.map(function(cp,i){
                        var x=xPos(i), y=yPos(cp.score||0);
                        var scoreClr=(cp.score||0)>=90?T.g:(cp.score||0)>=75?"#d97706":T.bl;
                        return <div key={i}>
                          <div style={{position:"absolute",left:x-8,top:y-8,width:16,height:16,borderRadius:"50%",background:scoreClr,border:"2.5px solid "+T.w,boxShadow:"0 1px 4px rgba(0,0,0,.15)",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:7,fontWeight:900,color:"#fff"}}>{cp.score}</span>
                          </div>
                          <div style={{position:"absolute",left:x-12,top:y+10,fontSize:7,fontWeight:700,color:T.txM,textAlign:"center",width:24}}>{cp.id}</div>
                          {/* Delta badge */}
                          {i>0&&<div style={{position:"absolute",left:x-6,top:y-18,fontSize:6,fontWeight:800,color:(cp.score||0)>=(cPhases[i-1].score||0)?T.g:T.r}}>{(cp.score||0)>=(cPhases[i-1].score||0)?"+"+(cp.score-cPhases[i-1].score):""+(cp.score-cPhases[i-1].score)}</div>}
                        </div>
                      })}
                    </div>
                  </div>
                })()}

                {/* Per-file time comparison — Horizontal bars */}
                {fileTimes.length>0&&<div>
                  <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:8}}>{"📁 "+t.auditFileComp}</div>
                  {fileTimes.map(function(fl,i){
                    var pct=slowFile>0?Math.round((fl.durationMs/slowFile)*100):0;
                    var isMax=fl.durationMs===slowFile;
                    var isMin=fl.durationMs===fastFile;
                    return <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{width:90,fontSize:8,fontWeight:700,color:T.nv,fontFamily:T.f,flexShrink:0,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fl.name}</span>
                      <div style={{flex:1,height:14,borderRadius:4,background:T.bdL,overflow:"hidden",position:"relative"}}>
                        <div style={{width:pct+"%",height:"100%",borderRadius:4,background:isMax?T.r:isMin?T.g:T.bl,transition:"width .5s"}}></div>
                        <span style={{position:"absolute",right:4,top:1,fontSize:7,fontWeight:700,color:pct>40?"#fff":T.txD}}>{fmtMs(fl.durationMs)}</span>
                      </div>
                      {isMax&&<span style={{fontSize:7,fontWeight:800,color:T.r,flexShrink:0}}>{t.auditSlowest}</span>}
                      {isMin&&fileTimes.length>1&&<span style={{fontSize:7,fontWeight:800,color:T.g,flexShrink:0}}>{t.auditFastest}</span>}
                    </div>
                  })}
                </div>}

                {/* Migration vs QA time split */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{padding:12,borderRadius:8,border:"1px solid "+T.bdL,background:T.bl+"08"}}>
                    <div style={{fontSize:8,fontWeight:700,color:T.bl}}>{"⚡ Migración (A+B+B2)"}</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.bl,fontFamily:T.f}}>{fmtMs(migTime)}</div>
                    <div style={{fontSize:8,color:T.txD}}>{migPct+"% "+t.auditTotal.toLowerCase()}</div>
                  </div>
                  <div style={{padding:12,borderRadius:8,border:"1px solid "+T.bdL,background:T.g+"08"}}>
                    <div style={{fontSize:8,fontWeight:700,color:T.g}}>{"✅ QA / Integración (C+D)"}</div>
                    <div style={{fontSize:18,fontWeight:900,color:T.g,fontFamily:T.f}}>{fmtMs(qaTime)}</div>
                    <div style={{fontSize:8,color:T.txD}}>{qaPct+"% · "+(cPhases.length>0?cPhases.length+" checks":"")+(dPhases.length>0?", "+dPhases.length+" fixes":"")}</div>
                  </div>
                </div>
              </div>}

              {/* ═══ TAB: Detail — Enhanced table ═══ */}
              {audTab==="detail"&&<div>
                <div style={{maxHeight:320,overflowY:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:9,fontFamily:T.f}}>
                    <thead><tr style={{background:T.cBg,position:"sticky",top:0,zIndex:3}}>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditPhase}</th>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditDetail}</th>
                      <th style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditDuration}</th>
                      <th style={{padding:"6px 8px",textAlign:"right",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{"% "+t.auditTotal}</th>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditStart}</th>
                      <th style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditEnd}</th>
                      <th style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:T.txD,borderBottom:"2px solid "+T.bdL}}>{t.auditStatus}</th>
                    </tr></thead>
                    <tbody>
                      {phases.map(function(ph,i){
                        var stClr=ph.status==="done"?T.g:ph.status==="error"?T.r:T.y;
                        var pct=Math.round((ph.durationMs/totalMs)*100);
                        var clr=phColors[ph.id]||T.bl;
                        var detStr=ph.detail||(ph.score!==undefined?"Score: "+ph.score:"")+(ph.issueCount!==undefined?" · Issues: "+ph.issueCount:"")+(ph.fixedFiles!==undefined?" · Fixed: "+ph.fixedFiles:"")+(ph.criticalCount!==undefined&&ph.criticalCount>0?" · "+ph.criticalCount+" critical":"");
                        var rows=[<tr key={"ph"+i} style={{background:i%2===0?T.w:T.cBg,borderBottom:"1px solid "+T.bdL}}>
                          <td style={{padding:"5px 8px"}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:8,fontWeight:900,color:clr,fontFamily:T.f,background:clr+"15",padding:"1px 4px",borderRadius:3}}>{ph.id}</span><span style={{fontWeight:700,color:T.nv}}>{ph.name}</span></div></td>
                          <td style={{padding:"5px 8px",color:T.txM,fontSize:8}}>{detStr}</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontWeight:800,color:T.nv}}>{fmtMs(ph.durationMs)}</td>
                          <td style={{padding:"5px 8px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}><div style={{width:40,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:clr,borderRadius:2}}></div></div><span style={{fontSize:7,fontWeight:700,color:T.txD}}>{pct+"%"}</span></div></td>
                          <td style={{padding:"5px 8px",color:T.txD,fontSize:8}}>{ph.startedAt?ph.startedAt.slice(11,19):""}</td>
                          <td style={{padding:"5px 8px",color:T.txD,fontSize:8}}>{ph.completedAt?ph.completedAt.slice(11,19):""}</td>
                          <td style={{padding:"5px 8px",textAlign:"center"}}><span style={{padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:700,background:stClr+"18",color:stClr}}>{ph.status}</span></td>
                        </tr>];
                        if(ph.files&&ph.files.length>0){
                          ph.files.forEach(function(fl,j){
                            var fClr=fl.status==="done"?T.g:T.r;
                            var fPct=Math.round((fl.durationMs/totalMs)*100);
                            rows.push(<tr key={"fl"+i+"-"+j} style={{background:T.cBg,borderBottom:"1px solid "+T.bdL}}>
                              <td style={{padding:"3px 8px 3px 28px",color:T.txM,fontSize:8}}>{"└ "+fl.name}</td>
                              <td style={{padding:"3px 8px",color:T.txD,fontSize:8}}>{fl.changes+" "+t.changes+(fl.engine?" · "+fl.engine:"")}</td>
                              <td style={{padding:"3px 8px",textAlign:"right",fontWeight:700,color:T.txM,fontSize:8}}>{fmtMs(fl.durationMs)}</td>
                              <td style={{padding:"3px 8px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end"}}><div style={{width:40,height:3,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:Math.max(1,fPct)+"%",height:"100%",background:T.bl,borderRadius:2}}></div></div><span style={{fontSize:6,color:T.txD}}>{fPct+"%"}</span></div></td>
                              <td style={{padding:"3px 8px",color:T.txD,fontSize:7}}>{fl.startedAt?fl.startedAt.slice(11,19):""}</td>
                              <td style={{padding:"3px 8px",color:T.txD,fontSize:7}}>{fl.completedAt?fl.completedAt.slice(11,19):""}</td>
                              <td style={{padding:"3px 8px",textAlign:"center"}}><span style={{padding:"1px 5px",borderRadius:4,fontSize:6,fontWeight:700,background:fClr+"18",color:fClr}}>{fl.status}</span></td>
                            </tr>);
                          });
                        }
                        return rows;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>}

              {/* Config footer */}
              <div style={{padding:"8px 16px",background:T.cBg,borderTop:"1px solid "+T.bdL,display:"flex",gap:10,flexWrap:"wrap",fontSize:8,color:T.txD,alignItems:"center"}}>
                <span style={{fontWeight:800,color:T.nv}}>{t.auditConfig}</span>
                <span style={{padding:"1px 6px",borderRadius:4,background:T.blP,color:T.bl,fontFamily:T.f,fontWeight:600}}>{"ID: "+auditTrail.id}</span>
                <span>{auditTrail.config.source+" → "+auditTrail.config.target}</span>
                <span style={{fontFamily:T.f}}>{auditTrail.config.model}</span>
                <span>{auditTrail.config.fileCount+" "+t.files}</span>
                {auditTrail.finalScore!==null&&<span style={{padding:"1px 6px",borderRadius:4,fontWeight:800,background:auditTrail.finalScore>=95?T.okBg:T.warnBg,color:auditTrail.finalScore>=95?T.g:T.y,fontFamily:T.f}}>{t.score+": "+auditTrail.finalScore+"/100"}</span>}
                <span style={{marginLeft:"auto",fontFamily:T.f}}>{auditTrail.startedAt.replace("T"," ").slice(0,19)}</span>
              </div>
            </div>
          })()}

          {/* ═══ MIGRATION ANALYTICS DASHBOARD ═══ */}
              {(function(){
                var totalLines=res.reduce(function(s,r){return s+(r.migrated?r.migrated.split("\n").length:0)},0);
                var origLines=res.reduce(function(s,r){return s+(r.original?r.original.split("\n").length:0)},0);
                var totalChanges=res.reduce(function(s,r){var c=r.changes;return s+(typeof c==="number"?c:0)},0);
                var ml2=MODELS.find(function(m){return m.id===mod});
                var costUsd=ml2?((_tks.i*(ml2.pi||0)+_tks.o*(ml2.po||0))/1000000):0;
                var costStr=costUsd>0?(costUsd<0.01?"<$0.01":"$"+costUsd.toFixed(3)):"$0.00";
                var durMs=auditTrail&&auditTrail.totalDurationMs?auditTrail.totalDurationMs:(migStartTs>0?Date.now()-migStartTs:0);
                var durStr=durMs>0?((durMs>=60000?Math.floor(durMs/60000)+"m ":"")+Math.floor((durMs%60000)/1000)+"s"):"--";
                var score=auditTrail&&auditTrail.finalScore!==null?auditTrail.finalScore:(intR&&intR.ok&&intR.result?intR.result.score:(function(){var bs=null;if(auditTrail&&auditTrail.phases)auditTrail.phases.forEach(function(ph){if(ph.score!==undefined&&ph.score!==null&&(bs===null||ph.score>bs))bs=ph.score});return bs})());
                var grade=score===null?"?":(score>=90?"A":score>=80?"B":score>=70?"C":score>=50?"D":"F");
                var gradeClr=grade==="A"||grade==="B"?"#059669":grade==="C"?"#D97706":"#DC2626";
                var phases=auditTrail&&auditTrail.phases?auditTrail.phases:[];
                var fileTimings=phases.reduce(function(acc,ph){if(ph.files)ph.files.forEach(function(f){acc.push({name:f.target||f.source||"?",ms:f.durationMs||0,phase:ph.phase})});return acc},[]);
                return <div style={{marginBottom:12}}>

                {/* Executive Summary Card */}
                <div style={Object.assign({},S.card,{overflow:"hidden",marginBottom:10})}>
                  <div style={{padding:"16px 20px",background:score>=90?"linear-gradient(135deg,#ecfdf5,#d1fae5)":score>=70?"linear-gradient(135deg,#fffbeb,#fef3c7)":"linear-gradient(135deg,#fef2f2,#fee2e2)",display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:56,height:56,borderRadius:14,border:"3px solid "+gradeClr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:gradeClr,fontFamily:T.f,background:"#fff"}}>{score!==null?score:"?"}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:800,color:T.nv}}>{"Migration Report"}</div>
                      <div style={{fontSize:11,color:T.txM}}>{(LANGS[sL]||{}).i+" "+(LANGS[sL]||{}).n+" "+sV+" → "+(LANGS[tL]||{}).i+" "+(LANGS[tL]||{}).n+" "+tV+" · "+res.length+" files"}</div>
                    </div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:10,color:T.txD,fontWeight:600}}>{"GRADE"}</div><div style={{fontSize:28,fontWeight:900,color:gradeClr,fontFamily:T.f}}>{grade}</div></div>
                  </div>

                  {/* KPI Row */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat("+((isMobile)?"2":"5")+",1fr)",borderTop:"1px solid "+T.bdL}}>
                    {[{l:"Duration",v:durStr,c:"#2563EB"},{l:"Tokens",v:(_tks.i+_tks.o)>1000?Math.round((_tks.i+_tks.o)/1000)+"k":(_tks.i+_tks.o)+"",c:"#7C3AED"},{l:"Cost",v:costStr,c:"#059669"},{l:"Lines",v:totalLines+"",c:"#D97706"},{l:"Changes",v:totalChanges>0?totalChanges+"":res.length+"",c:"#DC2626"}].map(function(kpi,ki){return <div key={ki} style={{padding:"12px 16px",borderRight:ki<4?"1px solid "+T.bdL:"none",textAlign:"center"}}>
                      <div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em"}}>{kpi.l}</div>
                      <div style={{fontSize:18,fontWeight:900,color:kpi.c,fontFamily:T.f,marginTop:2}}>{kpi.v}</div>
                    </div>})}
                  </div>
                </div>

                {/* Quality Layers + Phase Timeline row */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>

                  {/* Quality Layers */}
                  {intR&&intR.ok&&intR.result.layers&&<div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Quality Breakdown"}</span></div>
                    <div style={{padding:"10px 14px"}}>
                      {intR.result.layers.map(function(ly,li){var sc=ly.score||0;var clr=sc>=90?(dark?"#3D8B6E":"#059669"):sc>=70?(dark?"#A8842E":"#D97706"):(dark?"#B85450":"#DC2626");return <div key={li} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span style={{fontSize:8,fontWeight:600,color:T.txM,width:75,flexShrink:0}}>{ly.name}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:sc+"%",height:"100%",borderRadius:3,background:clr,transition:"width .5s"}}/></div>
                        <span style={{fontSize:9,fontWeight:800,color:clr,fontFamily:T.f,width:22,textAlign:"right"}}>{sc}</span>
                      </div>})}
                    </div>
                  </div>}

                  {/* Phase Timeline */}
                  {phases.length>0&&<div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Pipeline Timeline"}</span></div>
                    <div style={{padding:"10px 14px"}}>
                      {phases.map(function(ph,pi){var dur=ph.durationMs||0;var pct=durMs>0?Math.round(dur/durMs*100):0;var phClr=ph.phase==="analysis"?"#6366F1":ph.phase==="migration"?"#2563EB":ph.phase==="consolidation"?"#0EA5E9":ph.phase==="integration"?"#059669":"#D97706";return <div key={pi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <span style={{fontSize:8,fontWeight:600,color:T.txM,width:75,flexShrink:0}}>{ph.phase}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:phClr}}/></div>
                        <span style={{fontSize:8,fontFamily:T.f,color:T.txD,width:35,textAlign:"right"}}>{dur>=60000?Math.floor(dur/60000)+"m "+Math.floor((dur%60000)/1000)+"s":Math.floor(dur/1000)+"s"}</span>
                      </div>})}
                    </div>
                  </div>}
                </div>

                {/* File Performance + Token Breakdown */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>

                  {/* Per-file timing chart */}
                  {fileTimings.length>0&&<div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"File Processing Time"}</span></div>
                    <div style={{padding:"10px 14px"}}>
                      {fileTimings.slice(0,10).map(function(ft,fi){var maxMs=Math.max.apply(null,fileTimings.map(function(x){return x.ms}))||1;var pct=Math.round(ft.ms/maxMs*100);return <div key={fi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <span style={{fontSize:8,fontWeight:600,color:T.txM,width:80,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ft.name}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:"#2563EB"}}/></div>
                        <span style={{fontSize:8,fontFamily:T.f,color:T.txD,width:30,textAlign:"right"}}>{ft.ms>=1000?Math.round(ft.ms/1000)+"s":ft.ms+"ms"}</span>
                      </div>})}
                    </div>
                  </div>}

                  {/* Token breakdown */}
                  <div style={S.card}>
                    <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Token Usage"}</span></div>
                    <div style={{padding:"14px"}}>
                      <div style={{display:"flex",gap:12,marginBottom:12}}>
                        <div style={{flex:1,textAlign:"center",padding:10,borderRadius:10,background:"#EEF2FF"}}>
                          <div style={{fontSize:7,fontWeight:700,color:"#6366F1",textTransform:"uppercase"}}>{"Input"}</div>
                          <div style={{fontSize:16,fontWeight:900,color:"#6366F1",fontFamily:T.f}}>{_tks.i>1000?Math.round(_tks.i/1000)+"k":_tks.i}</div>
                        </div>
                        <div style={{flex:1,textAlign:"center",padding:10,borderRadius:10,background:"#F0FDF4"}}>
                          <div style={{fontSize:7,fontWeight:700,color:"#059669",textTransform:"uppercase"}}>{"Output"}</div>
                          <div style={{fontSize:16,fontWeight:900,color:"#059669",fontFamily:T.f}}>{_tks.o>1000?Math.round(_tks.o/1000)+"k":_tks.o}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",background:T.bdL}}>
                        <div style={{width:(_tks.i/Math.max(_tks.i+_tks.o,1)*100)+"%",background:"#6366F1",borderRadius:"4px 0 0 4px"}}/>
                        <div style={{width:(_tks.o/Math.max(_tks.i+_tks.o,1)*100)+"%",background:"#059669",borderRadius:"0 4px 4px 0"}}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                        <span style={{fontSize:7,color:"#6366F1",fontWeight:600}}>{"Input "+Math.round(_tks.i/Math.max(_tks.i+_tks.o,1)*100)+"%"}</span>
                        <span style={{fontSize:7,color:"#059669",fontWeight:600}}>{"Output "+Math.round(_tks.o/Math.max(_tks.i+_tks.o,1)*100)+"%"}</span>
                      </div>
                      {ml2&&<div style={{marginTop:8,padding:"6px 10px",borderRadius:6,background:T.cBg,fontSize:8,color:T.txD,textAlign:"center"}}>
                        {"Model: "+(ml2.n||"")+" · Cost: "+costStr}
                      </div>}
                    </div>
                  </div>
                </div>

                {/* Risks summary */}
                {rsk&&rsk.length>0&&<div style={Object.assign({},S.card,{marginBottom:10})}>
                  <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Risks & Warnings ("+rsk.length+")"}</span>
                    <div style={{display:"flex",gap:4}}>
                      {[{l:"High",c:"#DC2626",n:rsk.filter(function(r){return r.level==="high"}).length},{l:"Med",c:"#D97706",n:rsk.filter(function(r){return r.level==="medium"}).length},{l:"Low",c:"#059669",n:rsk.filter(function(r){return r.level==="low"||!r.level}).length}].filter(function(x){return x.n>0}).map(function(x,xi){return <span key={xi} style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:x.c+"15",color:x.c}}>{x.n+" "+x.l}</span>})}
                    </div>
                  </div>
                  <div style={{padding:"8px 14px",maxHeight:120,overflowY:"auto"}}>
                    {rsk.slice(0,8).map(function(r,ri){var lc=r.level==="high"?"#DC2626":r.level==="medium"?"#D97706":"#059669";return <div key={ri} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:"1px solid "+T.bdL}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:lc,flexShrink:0}}/>
                      <span style={{fontSize:9,color:T.txM,flex:1}}>{r.msg||r.risk||""}</span>
                      <span style={{fontSize:8,fontFamily:T.f,color:T.txD}}>{r.file||""}</span>
                    </div>})}
                  </div>
                </div>}

                </div>})()}

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"170px 1fr",gap:8}}>
            <div style={S.card}><div style={{padding:"8px 10px",fontSize:9,fontWeight:700,color:T.txD,background:T.blM,borderBottom:"1px solid "+T.bdL}}>{t.filesLbl}</div>
              {res.map(function(x,i){
                // Count issues per file from integration report — check both source and target names
                var fileIssues=intR&&intR.ok&&intR.result.issues?intR.result.issues.filter(function(is){return (is.files||[]).some(function(fn){return fn===x.name||fn===(x.targetName||x.name)||x.name.indexOf(fn)>=0||fn.indexOf(x.name)>=0})}):[];
                var critCount=fileIssues.filter(function(is){return is.severity==="critical"}).length;
                var majCount=fileIssues.filter(function(is){return is.severity==="major"}).length;
                var dotColor=critCount>0?T.r:majCount>0?"#f97316":fileIssues.length>0?T.y:T.g;
                var displayName=x.targetName||x.name;
                return <div key={i} onClick={function(){setActR(i);setTOut(null)}} style={{padding:"6px 10px",cursor:"pointer",borderLeft:"3px solid "+(actR===i?T.bl:"transparent"),background:actR===i?T.blM:"transparent"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:dotColor,flexShrink:0}}/>
                    <span style={{fontFamily:T.f,fontSize:9,fontWeight:600,flex:1}}>{displayName}</span>
                    {x.isCross&&<span style={{padding:"0 4px",borderRadius:3,fontSize:6,fontWeight:700,background:T.blP,color:T.bl}}>{"→"}</span>}
                    {x.intFixed&&<span style={{padding:"0 4px",borderRadius:4,fontSize:7,fontWeight:700,background:T.okBg,color:T.g}}>{"fixed"}</span>}
                  </div>
                  {x.isCross&&<div style={{fontSize:7,color:T.txD,marginLeft:10,fontFamily:T.f}}>{x.name+" → "+displayName}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:T.txD,marginLeft:10}}>
                    <span>{x.changes.length+" "+t.changes}{fileIssues.length>0?" · "+fileIssues.length+" issues":""}</span>
                    <button onClick={function(e){e.stopPropagation();dlF(x.migrated,dlN(x.name,x.targetName))}} style={{background:"none",border:"none",cursor:"pointer",color:T.bl,fontSize:9,padding:0}}>{"⬇"}</button>
                  </div>
                </div>})}</div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* DIFF */}
              <div style={S.card}><div style={S.cH}><div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>{r.isCross&&<span style={{fontFamily:T.f,fontSize:8,color:T.txD}}>{r.path||r.name}</span>}{r.isCross&&<span style={{color:T.bl,fontSize:8}}>{"→"}</span>}<span style={{fontFamily:T.f,fontSize:10,fontWeight:700,color:T.nv}}>{r.targetName||(r.path||r.name)}</span><span style={{fontSize:8,color:T.g}}>{"+"+ad}</span><span style={{fontSize:8,color:T.r}}>{"-"+rm}</span></div>
                <div style={{display:"flex",gap:4}}><button onClick={function(){if(navigator.clipboard)navigator.clipboard.writeText(r.migrated)}} title="Copy" style={Object.assign({},S.btn(),{padding:"3px 10px",fontSize:9})}>{"📋"}</button><button onClick={function(){dlF(r.migrated,dlN(r.name,r.targetName))}} style={Object.assign({},S.btn("g"),{padding:"3px 10px",fontSize:9})}>{"⬇"}</button>
                  <div style={{display:"flex",background:T.cBg,borderRadius:6,padding:2,border:"1px solid "+T.bdL}}>{["split","unified"].map(function(m){return <button key={m} onClick={function(){setDm(m)}} style={{padding:"2px 8px",borderRadius:4,border:"none",cursor:"pointer",fontSize:8,fontWeight:600,background:dm===m?T.w:"transparent",color:dm===m?T.nv:T.txD}}>{m}</button>})}</div></div></div>
                <div style={{maxHeight:300,overflowY:"auto",overflowX:"auto"}}>
                  {dm==="split"
                    ? <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minWidth:500}}>{[0,1].map(function(si){return <div key={si} style={si===0?{borderRight:"1px solid "+T.bdL}:{}}>
                        <div style={{padding:"4px 8px",fontSize:7,fontWeight:700,color:si?T.g:T.r,background:si?T.okBg:T.errBg,borderBottom:"1px solid "+T.bdL}}>{si?(r.targetName||t.mig)+" ("+((LANGS[tL]||{}).n||"")+")":t.orig+" ("+(r.name||"")+")"}</div>
                        {d.map(function(x,i){var bg="transparent";if(si===0&&(x.t==="del"||x.t==="mod"))bg=x.t==="del"?T.errBg:T.warnBg;if(si===1&&(x.t==="add"||x.t==="mod"))bg=x.t==="add"?T.okBg:T.warnBg;var txt=si===0?(x.t==="add"?"":x.o):(x.t==="del"?"":x.n);var ln=si===0?sL:tL;return <div key={i} style={{display:"flex",fontSize:9,fontFamily:T.f,background:bg,borderBottom:"1px solid "+T.bdL,minHeight:18}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7,borderRight:"1px solid "+T.bdL}}>{si?(x.nN||""):(x.oN||"")}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",wordBreak:"break-all",flex:1}}><CodeLine text={txt} lang={ln}/></pre></div>})}
                      </div>})}</div>
                    : <div>{d.map(function(x,i){return <div key={i}>
                        {(x.t==="del"||x.t==="mod")&&<div style={{display:"flex",fontSize:9,fontFamily:T.f,background:T.errBg,borderLeft:"3px solid "+T.r,borderBottom:"1px solid "+T.bdL}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7}}>{"-"+x.oN}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",flex:1,color:T.r}}><CodeLine text={x.o} lang={sL}/></pre></div>}
                        {(x.t==="add"||x.t==="mod")&&<div style={{display:"flex",fontSize:9,fontFamily:T.f,background:T.okBg,borderLeft:"3px solid "+T.g,borderBottom:"1px solid "+T.bdL}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7}}>{"+"+x.nN}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",flex:1,color:T.g}}><CodeLine text={x.n} lang={tL}/></pre></div>}
                        {x.t==="same"&&<div style={{display:"flex",fontSize:9,fontFamily:T.f,borderBottom:"1px solid "+T.bdL}}><span style={{width:28,textAlign:"right",padding:"1px 3px",color:T.txD,fontSize:7}}>{x.oN}</span><pre style={{margin:0,padding:"1px 4px",whiteSpace:"pre-wrap",flex:1,color:T.txM}}><CodeLine text={x.o} lang={tL}/></pre></div>}
                      </div>})}</div>}
                </div></div>

            </div>
          </div>
        </div>



      {/* RESULT TABS */}
      {res.length>0&&<div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px 16px"}}>
        <div style={{display:"flex",gap:2,background:T.cBg,borderRadius:10,padding:3,border:"1px solid "+T.bdL,marginBottom:10}}>
          {[{k:"code",l:"Código"},{k:"audit",l:"Auditoría"},{k:"visual",l:"Visual"},{k:"testing",l:"QA Tests"},{k:"risks",l:"Riesgos"}].map(function(tb){return <button key={tb.k} onClick={function(){setResTab(tb.k)}} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:resTab===tb.k?700:500,background:resTab===tb.k?T.w:"transparent",color:resTab===tb.k?T.nv:T.txM,boxShadow:resTab===tb.k?"0 1px 3px rgba(0,0,0,.08)":"none",fontFamily:T.ui,transition:"all .2s"}}>{tb.l}</button>})}
        </div>
        {resTab==="audit"&&auditTrail&&<div style={Object.assign({},S.card,{overflow:"hidden"})}>
          <div style={{padding:"14px 20px",background:"linear-gradient(135deg,#1E3A5F,#2D4A7A)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:14,fontWeight:800}}>{"Registro de Auditoría"}</div><div style={{fontSize:10,opacity:.7}}>{"Trazabilidad — "+(auditTrail.phases?auditTrail.phases.length:0)+" fases"}</div></div>
            <button onClick={function(){dlF(JSON.stringify(auditTrail,null,2),"audit_"+Date.now()+".json")}} style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer"}}>{"Exportar JSON"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat("+(isMobile?"2":"5")+",1fr)",borderBottom:"1px solid "+T.bdL}}>
            {(function(){var dur=auditTrail.totalDurationMs||0;var tL2=res.reduce(function(s,r){return s+(r.migrated?r.migrated.split("\n").length:0)},0);return [{l:"Tiempo",v:dur>=60000?Math.floor(dur/60000)+"m "+Math.floor((dur%60000)/1000)+"s":Math.floor(dur/1000)+"s",c:"#2563EB"},{l:"Archivos",v:(auditTrail.config?auditTrail.config.fileCount:res.length)+"",c:"#059669"},{l:"Líneas",v:tL2+"",c:"#D97706"},{l:"Fases",v:(auditTrail.phases?auditTrail.phases.length:0)+"",c:"#7C3AED"},{l:"Score",v:auditTrail.finalScore!=null?auditTrail.finalScore+"":"--",c:auditTrail.finalScore>=90?"#059669":"#D97706"}].map(function(kpi,ki){return <div key={ki} style={{padding:"12px 10px",borderRight:ki<4?"1px solid "+T.bdL:"none",textAlign:"center"}}><div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{kpi.l}</div><div style={{fontSize:16,fontWeight:900,color:kpi.c,fontFamily:T.f,marginTop:2}}>{kpi.v}</div></div>})})()}
          </div>
          <div style={{display:"flex",gap:2,padding:"6px 14px",borderBottom:"1px solid "+T.bdL,background:T.cBg}}>
            {[{k:"pipeline",l:"Pipeline"},{k:"charts",l:"Distribución"},{k:"detail",l:"Detalle"}].map(function(tb2){return <button key={tb2.k} onClick={function(){setAudTab(tb2.k)}} style={{padding:"4px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:audTab===tb2.k?700:500,background:audTab===tb2.k?T.bl:"transparent",color:audTab===tb2.k?"#fff":T.txM,fontFamily:T.ui}}>{tb2.l}</button>})}
          </div>
          {audTab==="pipeline"&&auditTrail.phases&&<div style={{padding:16}}>{auditTrail.phases.map(function(ph,pi){var phC=dark?{A:"#7C7FBF",B:"#4A7AA8",C1:"#3D8B6E",C2:"#3D8B6E",C3:"#3D8B6E",B2a:"#3E7E9A",B2b:"#3E7E9A",D1:"#A8842E",D2:"#A8842E",D3:"#A8842E"}:{A:"#6366F1",B:"#2563EB",B2a:"#0EA5E9",B2b:"#0EA5E9",C1:"#059669",C2:"#059669",C3:"#059669",D1:"#D97706",D2:"#D97706",D3:"#D97706"};var clr=phC[ph.id]||T.bl;var pct=auditTrail.totalDurationMs>0?Math.round((ph.durationMs||0)/auditTrail.totalDurationMs*100):0;return <div key={pi} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+T.bdL}}><div style={{width:32,height:32,borderRadius:"50%",background:clr+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:8,fontWeight:800,color:clr}}>{ph.id}</span></div><div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.nv}}>{ph.name||ph.phase}</div><div style={{marginTop:4,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",borderRadius:3,background:clr}}/></div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:T.nv}}>{fmtMs(ph.durationMs)}</div><div style={{fontSize:8,color:T.txD}}>{pct+"%"}</div></div></div>})}</div>}
          {audTab==="charts"&&auditTrail.phases&&<div style={{padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:12}}>{"Phase Duration Distribution"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {auditTrail.phases.map(function(ph,pi){var pct=auditTrail.totalDurationMs>0?Math.round((ph.durationMs||0)/auditTrail.totalDurationMs*100):0;var colors=["#6366F1","#2563EB","#0EA5E9","#059669","#D97706","#DC2626","#7C3AED","#EC4899"];var clr=colors[pi%colors.length];return <div key={pi} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:90,fontSize:9,fontWeight:600,color:T.txM,textAlign:"right",flexShrink:0}}>{ph.name||ph.id}</div>
                <div style={{flex:1,height:18,borderRadius:4,background:T.bdL,overflow:"hidden",position:"relative"}}>
                  <div style={{width:pct+"%",height:"100%",borderRadius:4,background:"linear-gradient(90deg,"+clr+","+clr+"bb)",transition:"width 0.5s",minWidth:pct>0?2:0}}/>
                  <span style={{position:"absolute",right:4,top:2,fontSize:8,fontWeight:700,color:T.txM}}>{fmtMs(ph.durationMs)}</span>
                </div>
                <div style={{width:30,fontSize:9,fontWeight:700,color:T.nv,textAlign:"right"}}>{pct+"%"}</div>
              </div>})}
            </div>
            {auditTrail.finalScore!=null&&<div style={{marginTop:16,padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL}}>
              <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:8}}>{"Score Breakdown"}</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:60,height:60,borderRadius:"50%",border:"4px solid "+(auditTrail.finalScore>=90?T.g:auditTrail.finalScore>=70?T.y:T.r),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:auditTrail.finalScore>=90?T.g:auditTrail.finalScore>=70?T.y:T.r}}>{auditTrail.finalScore}</span></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:T.txM}}>{"Integration Score"}</div>
                  <div style={{marginTop:4,height:8,borderRadius:4,background:T.bdL,overflow:"hidden"}}><div style={{width:auditTrail.finalScore+"%",height:"100%",borderRadius:4,background:"linear-gradient(90deg,"+T.gradA+","+T.gradB+")"}}/></div>
                  {auditTrail.visualFidelityScore!=null&&<div style={{marginTop:6}}>
                    <div style={{fontSize:10,color:T.txM}}>{"Visual Fidelity: "+auditTrail.visualFidelityScore+"/100"}</div>
                    <div style={{marginTop:2,height:6,borderRadius:3,background:T.bdL,overflow:"hidden"}}><div style={{width:auditTrail.visualFidelityScore+"%",height:"100%",borderRadius:3,background:"linear-gradient(90deg,#7C3AED,#8B5CF6)"}}/></div>
                  </div>}
                </div>
              </div>
            </div>}
          </div>}
          {audTab==="detail"&&auditTrail.phases&&<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}><thead><tr style={{background:T.cBg}}>{["Fase","Detalle","Duración","% Total","Estado"].map(function(h,hi){return <th key={hi} style={{padding:"6px 10px",textAlign:"left",fontWeight:700,color:T.txD,borderBottom:"1px solid "+T.bdL}}>{h}</th>})}</tr></thead><tbody>{auditTrail.phases.map(function(ph,pi){var pct=auditTrail.totalDurationMs>0?Math.round((ph.durationMs||0)/auditTrail.totalDurationMs*100):0;return <tr key={pi} style={{borderBottom:"1px solid "+T.bdL}}><td style={{padding:"6px 10px",fontWeight:700,color:T.nv}}><span style={{fontSize:8,padding:"1px 5px",borderRadius:3,background:T.blP,color:T.bl,marginRight:4}}>{ph.id}</span>{ph.name||ph.phase}</td><td style={{padding:"6px 10px",color:T.txM}}>{ph.detail||(ph.files?ph.files.length+" files":"")}</td><td style={{padding:"6px 10px",fontFamily:T.f,fontWeight:700}}>{fmtMs(ph.durationMs)}</td><td style={{padding:"6px 10px"}}><div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:40,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:T.bl}}/></div><span style={{fontFamily:T.f}}>{pct+"%"}</span></div></td><td style={{padding:"6px 10px"}}><span style={{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:T.okBg,color:T.g}}>{"done"}</span></td></tr>})}</tbody></table></div>}
        </div>}
        {resTab==="audit"&&!auditTrail&&<div style={{padding:40,textAlign:"center",color:T.txD}}>{"No hay auditoría disponible"}</div>}
        {resTab==="visual"&&(function(){
          // Determine data source: live pwComparison or persisted visualQA report
          var comp = pwComparison;
          var vqa = visualQA;
          var resolved = resolvedVQA;
          var images = resolved && resolved._resolvedImages ? resolved._resolvedImages : {};
          var hasData = !!(comp || (vqa && vqa.comparison));
          var compData = comp || (vqa ? vqa.comparison : null);
          var verdictData = vqa ? vqa.verdict : null;

          // Export handler
          var handleExport = function() {
            var rpt = vqa;
            if (!rpt) return;
            setVqaLoading(true);
            resolveScreenshots(rpt).then(function(r2) {
              var imgs = r2 && r2._resolvedImages ? r2._resolvedImages : {};
              var html = generateVisualQAHTML(rpt, imgs);
              var blob = new Blob([html], { type: "text/html" });
              var url = URL.createObjectURL(blob);
              var a = document.createElement("a");
              a.href = url;
              a.download = "visual-qa-report-" + rpt.migrationId + ".html";
              a.click();
              URL.revokeObjectURL(url);
              setVqaLoading(false);
            }).catch(function() { setVqaLoading(false); });
          };

          return <div style={Object.assign({},S.card,{overflow:"hidden"})}>
            <div style={{padding:"14px 20px",background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:14,fontWeight:800}}>{"Visual QA Report"}</div>
                <div style={{fontSize:10,opacity:.7}}>{"Pre vs Post migration — professional QA documentation"}</div>
                {vqa&&<div style={{fontSize:9,opacity:.6,marginTop:2}}>{vqa.id+" | "+vqa.migrationId}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {verdictData&&<span style={{padding:"4px 12px",borderRadius:8,fontSize:12,fontWeight:900,background:verdictData.overall==="PASS"?"rgba(5,150,105,0.2)":verdictData.overall==="WARN"?"rgba(217,119,6,0.2)":"rgba(220,38,38,0.2)",color:"#fff"}}>{verdictData.overall}</span>}
                {compData&&compData.compositeScore!=null&&<div style={{width:48,height:48,borderRadius:"50%",border:"3px solid "+(compData.compositeScore>=80?"#34D399":compData.compositeScore>=60?"#FBBF24":"#F87171"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff"}}>{compData.compositeScore}</div>}
              </div>
            </div>

            {!hasData&&<div style={{padding:40,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>{"\ud83d\udd2d"}</div><div style={{fontSize:12,color:T.txD}}>{"No visual comparison available"}</div><div style={{fontSize:10,color:T.txD,marginTop:4}}>{"Visual baseline requires Playwright installed on the backend"}</div></div>}

            {hasData&&<div style={{padding:0}}>
              {/* ── Sub-navigation ── */}
              <div style={{display:"flex",gap:0,borderBottom:"1px solid "+T.bdL,background:T.cBg}}>
                {[{k:"overview",l:"Overview"},{k:"pre",l:"Pre-Migration"},{k:"post",l:"Post-Migration"},{k:"compare",l:"Side-by-Side"}].map(function(tab){
                  return <button key={tab.k} onClick={function(){setVqaView(tab.k)}} style={{padding:"10px 16px",border:"none",borderBottom:vqaView===tab.k?"2px solid #7C3AED":"2px solid transparent",background:"transparent",color:vqaView===tab.k?T.nv:T.txD,fontSize:11,fontWeight:vqaView===tab.k?700:500,cursor:"pointer",transition:"all .15s"}}>{tab.l}</button>;
                })}
                <div style={{flex:1}}/>
                {vqa&&<button onClick={handleExport} disabled={vqaLoading} style={{margin:"4px 8px",padding:"4px 12px",borderRadius:6,border:"none",background:"#7C3AED",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",opacity:vqaLoading?.5:1}}>{vqaLoading?"...":"Export HTML Report"}</button>}
              </div>

              <div style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>

                {/* ── OVERVIEW TAB ── */}
                {vqaView==="overview"&&<React.Fragment>
                  {/* Verdict banner */}
                  {verdictData&&<div style={{padding:"12px 16px",borderRadius:10,background:verdictData.overall==="PASS"?T.okBg:verdictData.overall==="WARN"?T.warnBg:T.errBg,border:"1px solid "+(verdictData.overall==="PASS"?T.okBd:verdictData.overall==="WARN"?T.warnBd:T.errBd),display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:24,fontWeight:900,color:verdictData.overall==="PASS"?T.g:verdictData.overall==="WARN"?T.y:T.r}}>{verdictData.overall}</div>
                    <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.nv}}>{verdictData.notes}</div>
                    {verdictData.regressionAreas&&verdictData.regressionAreas.length>0&&<div style={{fontSize:9,color:T.txM,marginTop:2}}>{"Regressions: "+verdictData.regressionAreas.join(", ")}</div>}</div>
                  </div>}

                  {/* 5-dimension scores */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat("+(isMobile?"2":"5")+",1fr)",gap:8}}>
                    {[{l:"Visual Match",v:compData.visualScore,w:"40%",c:"#8B5CF6"},{l:"DOM Similarity",v:compData.domSimilarity,w:"25%",c:"#2563EB"},{l:"Functional",v:compData.functionalScore,w:"20%",c:"#059669"},{l:"Performance",v:compData.perfDelta?compData.perfDelta.score:null,w:"10%",c:"#D97706"},{l:"Accessibility",v:compData.a11yDelta?compData.a11yDelta.score:null,w:"5%",c:"#EC4899"}].map(function(m,mi){var val=m.v!=null?m.v:0;var clr=val>=80?"#059669":val>=60?"#D97706":"#DC2626";return <div key={mi} style={{padding:"12px 10px",borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{m.l}</div><div style={{fontSize:20,fontWeight:900,color:clr,fontFamily:T.f,marginTop:2}}>{val!=null?val+"":"--"}</div><div style={{fontSize:7,color:T.txD}}>{"weight: "+m.w}</div><div style={{marginTop:4,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:val+"%",height:"100%",borderRadius:2,background:m.c}}/></div></div>})}
                  </div>

                  {/* Composite score bar */}
                  <div style={{padding:"12px 16px",borderRadius:10,background:compData.compositeScore>=80?T.okBg:compData.compositeScore>=60?T.warnBg:T.errBg,border:"1px solid "+(compData.compositeScore>=80?T.okBd:compData.compositeScore>=60?T.warnBd:T.errBd),display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28,fontWeight:900,fontFamily:T.f,color:compData.compositeScore>=80?T.g:compData.compositeScore>=60?T.y:T.r}}>{compData.compositeScore+"/100"}</div>
                    <div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Composite Visual Fidelity Score"}</div><div style={{fontSize:9,color:T.txM}}>{"Weighted: Visual 40% + DOM 25% + Functional 20% + Perf 10% + A11y 5%"}</div><div style={{marginTop:6,height:8,borderRadius:4,background:T.bdL,overflow:"hidden"}}><div style={{width:compData.compositeScore+"%",height:"100%",borderRadius:4,background:"linear-gradient(90deg,"+T.gradA+","+T.gradB+")"}}/></div></div>
                  </div>

                  {/* Pass/fail criteria table */}
                  {verdictData&&verdictData.thresholds&&<div style={{borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                    <div style={{padding:"10px 16px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:12,fontWeight:700,color:T.nv}}>{"Pass/Fail Criteria"}</div>
                    <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{background:T.cBg}}>{["Dimension","Required","Actual","Status"].map(function(h,hi){return <th key={hi} style={{padding:"6px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:T.txD,borderBottom:"1px solid "+T.bdL}}>{h}</th>})}</tr></thead>
                    <tbody>{Object.keys(verdictData.thresholds).map(function(k){var th=verdictData.thresholds[k];return <tr key={k} style={{borderBottom:"1px solid "+T.bdL}}><td style={{padding:"6px 12px",fontSize:11,fontWeight:600,textTransform:"capitalize"}}>{k}</td><td style={{padding:"6px 12px",fontSize:11,fontFamily:T.f}}>{"≥ "+th.required}</td><td style={{padding:"6px 12px",fontSize:11,fontFamily:T.f,fontWeight:700}}>{th.actual}</td><td style={{padding:"6px 12px"}}><span style={{padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,background:th.pass?T.okBg:T.errBg,color:th.pass?T.g:T.r}}>{th.pass?"PASS":"FAIL"}</span></td></tr>})}</tbody></table>
                  </div>}

                  {/* Diff images */}
                  {comp&&comp.details&&comp.details.diffImages&&comp.details.diffImages.length>0&&<div>
                    <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:8}}>{"Screenshot Comparison"}</div>
                    {comp.details.diffImages.map(function(di,dii){return <div key={dii} style={{marginBottom:12,borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                      <div style={{padding:"8px 12px",background:T.cBg,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+T.bdL}}>
                        <span style={{fontSize:10,fontWeight:700,color:T.nv}}>{"Route: "+di.route}</span>
                        <span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:di.matchPct>=90?T.okBg:di.matchPct>=70?T.warnBg:T.errBg,color:di.matchPct>=90?T.g:di.matchPct>=70?T.y:T.r}}>{di.matchPct+"% match"}</span>
                      </div>
                      <div style={{padding:12,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:4}}>{"DIFF OVERLAY"}</div><img src={"data:image/png;base64,"+di.diff} alt={"Diff "+di.route} style={{maxWidth:isMobile?280:400,borderRadius:6,border:"1px solid "+T.bdL}}/></div>
                      </div>
                      <div style={{padding:"6px 12px",background:T.cBg,borderTop:"1px solid "+T.bdL,display:"flex",gap:12,fontSize:9,color:T.txD}}>
                        <span>{"Mismatched: "+di.mismatchPixels.toLocaleString()+" px"}</span>
                        <span>{"Total: "+(di.totalPixels||0).toLocaleString()+" px"}</span>
                      </div>
                    </div>})}
                  </div>}

                  {/* Performance + structural from live comparison */}
                  {compData.perfDelta&&<div style={{padding:"12px 16px",borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:8}}>{"Performance Delta"}</div>
                    <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:10}}>
                      <div><span style={{color:T.txD}}>{"Load (pre): "}</span><span style={{fontWeight:700,fontFamily:T.f}}>{compData.perfDelta.loadTimePre?compData.perfDelta.loadTimePre+"ms":"N/A"}</span></div>
                      <div><span style={{color:T.txD}}>{"Load (post): "}</span><span style={{fontWeight:700,fontFamily:T.f}}>{compData.perfDelta.loadTimePost?compData.perfDelta.loadTimePost+"ms":"N/A"}</span></div>
                      <div><span style={{color:T.txD}}>{"Delta: "}</span><span style={{fontWeight:700,fontFamily:T.f,color:(compData.perfDelta.deltaPercent||0)<=0?T.g:(compData.perfDelta.deltaPercent||0)<=20?T.y:T.r}}>{((compData.perfDelta.deltaPercent||0)>0?"+":"")+(compData.perfDelta.deltaPercent||0)+"%"}</span></div>
                    </div>
                  </div>}

                  {auditTrail&&auditTrail.visualFidelityScore!=null&&<div style={{padding:"10px 16px",borderRadius:10,background:T.blM,border:"1px solid "+T.bdL,fontSize:10,color:T.txM}}>
                    {"Score final integrado: "}
                    {auditTrail.originalIntegrationScore!=null&&<span>{"Integration "+auditTrail.originalIntegrationScore+" \u00d7 70% + Visual "+auditTrail.visualFidelityScore+" \u00d7 30% = "}</span>}
                    <span style={{fontWeight:800,color:T.bl}}>{auditTrail.finalScore+"/100"}</span>
                  </div>}
                </React.Fragment>}

                {/* ── PRE-MIGRATION TAB ── */}
                {vqaView==="pre"&&(function(){
                  var pre = vqa ? vqa.pre : null;
                  if (!pre) return <div style={{padding:40,textAlign:"center",color:T.txD}}>{"No pre-migration baseline data available"}</div>;
                  return <React.Fragment>
                    <div style={{padding:"12px 16px",borderRadius:10,background:"#EDE9FE",border:"1px solid #C4B5FD"}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#7C3AED"}}>{"Pre-Migration Baseline (Source)"}</div>
                      <div style={{fontSize:10,color:"#6D28D9",marginTop:2}}>{"Captured: "+new Date(pre.capturedAt).toLocaleString()+" | Duration: "+(pre.durationMs||0)+"ms"}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat("+(isMobile?"2":"4")+",1fr)",gap:8}}>
                      <div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"Routes"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv}}>{pre.routeCount||0}</div></div>
                      <div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"JS Errors"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:(pre.jsErrors||[]).length>0?T.r:T.g}}>{(pre.jsErrors||[]).length}</div></div>
                      {pre.metrics&&<div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"Load Time"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv}}>{(pre.metrics.loadTime||0)+"ms"}</div></div>}
                      {pre.domSummary&&<div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"DOM Nodes"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv}}>{pre.domSummary.nodeCount||0}</div></div>}
                    </div>
                    {pre.domSummary&&<div style={{padding:"10px 16px",borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,fontSize:10,color:T.txM}}>
                      {"DOM: "+pre.domSummary.nodeCount+" nodes, "+pre.domSummary.uniqueTags+" unique tags"+(pre.domSummary.depth?", depth "+pre.domSummary.depth:"")}
                    </div>}
                    {pre.jsErrors&&pre.jsErrors.length>0&&<div style={{padding:"10px 16px",borderRadius:10,background:T.errBg,border:"1px solid "+T.errBd}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.r,marginBottom:4}}>{"JS Errors Detected"}</div>
                      {pre.jsErrors.map(function(err,ei){return <div key={ei} style={{fontSize:10,color:T.r,padding:"3px 6px",background:"rgba(220,38,38,0.05)",borderRadius:4,marginBottom:2,fontFamily:T.f}}>{err}</div>})}
                    </div>}
                    {/* Pre screenshots from IndexedDB */}
                    {pre.screenshotRefs&&pre.screenshotRefs.length>0&&<div>
                      <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:8}}>{"Screenshots ("+pre.screenshotRefs.length+")"}</div>
                      {pre.screenshotRefs.map(function(ref,idx){
                        var b64 = images[ref];
                        return <div key={idx} style={{marginBottom:12,borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                          <div style={{padding:"8px 12px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:10,fontWeight:700,color:T.nv}}>{"Route: "+(pre.routes&&pre.routes[idx]?pre.routes[idx]:"/")}</div>
                          {b64?<div style={{padding:12,textAlign:"center"}}><img src={"data:image/png;base64,"+b64} alt={"Pre "+idx} style={{maxWidth:"100%",borderRadius:6,border:"1px solid "+T.bdL}}/></div>
                          :<div style={{padding:24,textAlign:"center",color:T.txD,fontSize:10}}>{"Screenshot not available in storage"}</div>}
                        </div>;
                      })}
                    </div>}
                  </React.Fragment>;
                })()}

                {/* ── POST-MIGRATION TAB ── */}
                {vqaView==="post"&&(function(){
                  var post = vqa ? vqa.post : null;
                  if (!post) return <div style={{padding:40,textAlign:"center",color:T.txD}}>{"No post-migration baseline data available"}</div>;
                  return <React.Fragment>
                    <div style={{padding:"12px 16px",borderRadius:10,background:"#DBEAFE",border:"1px solid #93C5FD"}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#2563EB"}}>{"Post-Migration Baseline (Target)"}</div>
                      <div style={{fontSize:10,color:"#1D4ED8",marginTop:2}}>{"Captured: "+new Date(post.capturedAt).toLocaleString()+" | Duration: "+(post.durationMs||0)+"ms"}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat("+(isMobile?"2":"4")+",1fr)",gap:8}}>
                      <div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"Routes"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv}}>{post.routeCount||0}</div></div>
                      <div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"JS Errors"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:(post.jsErrors||[]).length>0?T.r:T.g}}>{(post.jsErrors||[]).length}</div></div>
                      {post.metrics&&<div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"Load Time"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv}}>{(post.metrics.loadTime||0)+"ms"}</div></div>}
                      {post.domSummary&&<div style={{padding:12,borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{"DOM Nodes"}</div><div style={{fontSize:20,fontWeight:900,fontFamily:T.f,color:T.nv}}>{post.domSummary.nodeCount||0}</div></div>}
                    </div>
                    {post.jsErrors&&post.jsErrors.length>0&&<div style={{padding:"10px 16px",borderRadius:10,background:T.errBg,border:"1px solid "+T.errBd}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.r,marginBottom:4}}>{"JS Errors Detected"}</div>
                      {post.jsErrors.map(function(err,ei){return <div key={ei} style={{fontSize:10,color:T.r,padding:"3px 6px",background:"rgba(220,38,38,0.05)",borderRadius:4,marginBottom:2,fontFamily:T.f}}>{err}</div>})}
                    </div>}
                    {post.screenshotRefs&&post.screenshotRefs.length>0&&<div>
                      <div style={{fontSize:12,fontWeight:700,color:T.nv,marginBottom:8}}>{"Screenshots ("+post.screenshotRefs.length+")"}</div>
                      {post.screenshotRefs.map(function(ref,idx){
                        var b64 = images[ref];
                        return <div key={idx} style={{marginBottom:12,borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                          <div style={{padding:"8px 12px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:10,fontWeight:700,color:T.nv}}>{"Route: "+(post.routes&&post.routes[idx]?post.routes[idx]:"/")}</div>
                          {b64?<div style={{padding:12,textAlign:"center"}}><img src={"data:image/png;base64,"+b64} alt={"Post "+idx} style={{maxWidth:"100%",borderRadius:6,border:"1px solid "+T.bdL}}/></div>
                          :<div style={{padding:24,textAlign:"center",color:T.txD,fontSize:10}}>{"Screenshot not available in storage"}</div>}
                        </div>;
                      })}
                    </div>}
                  </React.Fragment>;
                })()}

                {/* ── SIDE-BY-SIDE TAB ── */}
                {vqaView==="compare"&&(function(){
                  var pre = vqa ? vqa.pre : null;
                  var post = vqa ? vqa.post : null;
                  var rrs = compData.routeResults || [];
                  if (!pre && !post) return <div style={{padding:40,textAlign:"center",color:T.txD}}>{"No baseline data for side-by-side comparison"}</div>;
                  var maxRoutes = Math.max(pre?pre.screenshotRefs.length:0, post?post.screenshotRefs.length:0);
                  return <React.Fragment>
                    <div style={{padding:"12px 16px",borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.nv}}>{"Side-by-Side Visual Comparison"}</div>
                      <div style={{fontSize:10,color:T.txM,marginTop:2}}>{"Source vs migrated screenshots with diff overlay per route"}</div>
                    </div>
                    {Array.from({length:maxRoutes},function(_,si){
                      var routeName = (pre&&pre.routes&&pre.routes[si]) || (post&&post.routes&&post.routes[si]) || "/";
                      var rr = rrs[si];
                      var preRef = pre&&pre.screenshotRefs[si];
                      var postRef = post&&post.screenshotRefs[si];
                      var preB64 = preRef ? images[preRef] : null;
                      var postB64 = postRef ? images[postRef] : null;
                      var diffRef = rr ? rr.diffRef : null;
                      var diffB64 = diffRef ? images[diffRef] : null;
                      return <div key={si} style={{borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden",marginBottom:0}}>
                        <div style={{padding:"8px 12px",background:T.cBg,borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Route: "+routeName}</span>
                          {rr&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:rr.verdict==="PASS"?T.okBg:rr.verdict==="WARN"?T.warnBg:T.errBg,color:rr.verdict==="PASS"?T.g:rr.verdict==="WARN"?T.y:T.r}}>{rr.matchPct+"% — "+rr.verdict}</span>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:0}}>
                          <div style={{padding:12,borderRight:isMobile?"none":"1px solid "+T.bdL,borderBottom:isMobile?"1px solid "+T.bdL:"none",textAlign:"center"}}>
                            <div style={{fontSize:9,fontWeight:700,color:"#7C3AED",textTransform:"uppercase",marginBottom:6}}>{"PRE (Source)"}</div>
                            {preB64?<img src={"data:image/png;base64,"+preB64} alt="Pre" style={{maxWidth:"100%",borderRadius:6,border:"1px solid "+T.bdL}}/>
                            :<div style={{padding:30,background:T.cBg,borderRadius:6,color:T.txD,fontSize:10}}>{"No screenshot"}</div>}
                          </div>
                          <div style={{padding:12,textAlign:"center"}}>
                            <div style={{fontSize:9,fontWeight:700,color:"#2563EB",textTransform:"uppercase",marginBottom:6}}>{"POST (Migrated)"}</div>
                            {postB64?<img src={"data:image/png;base64,"+postB64} alt="Post" style={{maxWidth:"100%",borderRadius:6,border:"1px solid "+T.bdL}}/>
                            :<div style={{padding:30,background:T.cBg,borderRadius:6,color:T.txD,fontSize:10}}>{"No screenshot"}</div>}
                          </div>
                        </div>
                        {diffB64&&<div style={{padding:12,borderTop:"1px solid "+T.bdL,textAlign:"center"}}>
                          <div style={{fontSize:9,fontWeight:700,color:T.txD,textTransform:"uppercase",marginBottom:6}}>{"DIFF OVERLAY"}</div>
                          <img src={"data:image/png;base64,"+diffB64} alt="Diff" style={{maxWidth:isMobile?"100%":"60%",borderRadius:6,border:"1px solid "+T.bdL}}/>
                          {rr&&<div style={{fontSize:9,color:T.txD,marginTop:4}}>{(rr.mismatchPixels||0).toLocaleString()+" mismatched pixels"}</div>}
                        </div>}
                      </div>;
                    })}
                  </React.Fragment>;
                })()}
              </div>
            </div>}
          </div>;
        })()}
        {resTab==="testing"&&(function(){
          var qd = qaTests;
          var hasQA = !!(qd && (qd.pre || qd.post));

          if (!hasQA) return <div style={{padding:40,textAlign:"center",color:T.txD}}>
            <div style={{fontSize:32,marginBottom:8}}>{"\uD83E\uDDEA"}</div>
            <div style={{fontSize:12}}>{"No QA test data available"}</div>
            <div style={{fontSize:10,marginTop:4}}>{"QA tests run automatically during migration"}</div>
          </div>;

          var pre = qd.pre && qd.pre.ok ? qd.pre.virtual : null;
          var post = qd.post && qd.post.ok ? qd.post.virtual : null;
          var comp = qd.comparison;

          return <div style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>
            {/* Summary banner */}
            {comp&&<div style={{padding:"12px 16px",borderRadius:10,background:comp.preservationRate>=80?T.okBg:comp.preservationRate>=60?T.warnBg:T.errBg,border:"1px solid "+(comp.preservationRate>=80?T.okBd:comp.preservationRate>=60?T.warnBd:T.errBd),display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,fontWeight:900,fontFamily:T.f,color:comp.preservationRate>=80?T.g:comp.preservationRate>=60?T.y:T.r}}>{comp.preservationRate+"%"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Behavioral Preservation Rate"}</div>
                <div style={{fontSize:9,color:T.txM}}>{"Equivalent: "+comp.summary.equivalent+" | Different: "+comp.summary.different+" | Missing: "+comp.summary.missing}</div>
              </div>
            </div>}

            {/* Stats grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[
                {l:"Pre Tests",v:pre?pre.summary.totalTests:0,c:"#6366F1"},
                {l:"Post Tests",v:post?post.summary.totalTests:0,c:"#8B5CF6"},
                {l:"Bugs Found",v:(pre?pre.summary.bugsFound:0)+(post?post.summary.bugsFound:0),c:"#EF4444"},
                {l:"High Confidence",v:post?post.summary.highConfidence:0,c:"#059669"}
              ].map(function(m,mi){return <div key={mi} style={{padding:"12px 10px",borderRadius:10,background:T.cBg,border:"1px solid "+T.bdL,textAlign:"center"}}>
                <div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{m.l}</div>
                <div style={{fontSize:20,fontWeight:900,color:m.c,fontFamily:T.f,marginTop:2}}>{m.v}</div>
              </div>})}
            </div>

            {/* Function-by-function comparison */}
            {comp&&comp.comparisons&&<div style={{borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden"}}>
              <div style={{padding:"10px 16px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:12,fontWeight:700,color:T.nv}}>{"Function Comparison (Pre vs Post)"}</div>
              <div style={{maxHeight:400,overflowY:"auto"}}>
                {comp.comparisons.map(function(fn,fi){
                  var statusColor = fn.status==="equivalent"?T.g:fn.status==="missing"?"#EF4444":"#D97706";
                  return <div key={fi} style={{borderBottom:"1px solid "+T.bdL,padding:"10px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:T.nv}}>{fn.name}</span>
                      <span style={{fontSize:9,color:T.txD}}>{fn.file}</span>
                      <span style={{marginLeft:"auto",padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:700,background:fn.status==="equivalent"?T.okBg:fn.status==="missing"?T.errBg:T.warnBg,color:statusColor}}>{fn.status.toUpperCase()}</span>
                    </div>
                    {fn.cases&&fn.cases.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {fn.cases.map(function(c,ci){
                        var cColor = c.status==="equivalent"?"#059669":c.status==="different"?"#D97706":"#EF4444";
                        return <div key={ci} style={{padding:"3px 8px",borderRadius:4,fontSize:8,background:T.cBg,border:"1px solid "+T.bdL}} title={c.label}>
                          <span style={{color:cColor,fontWeight:700}}>{c.status==="equivalent"?"\u2713":c.status==="different"?"\u0394":"\u2717"}</span>
                          <span style={{marginLeft:4,color:T.txM}}>{c.label||("Case "+(ci+1))}</span>
                        </div>
                      })}
                    </div>}
                  </div>
                })}
              </div>
            </div>}

            {/* Function details — Post migration */}
            {post&&post.functions&&<div style={{borderRadius:10,border:"1px solid "+T.bdL,overflow:"hidden"}}>
              <div style={{padding:"10px 16px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:12,fontWeight:700,color:T.nv}}>{"QA Test Details (Post-Migration)"}</div>
              <div style={{maxHeight:500,overflowY:"auto"}}>
                {post.functions.map(function(fn,fi){
                  return <div key={fi} style={{borderBottom:"1px solid "+T.bdL,padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:12,fontWeight:800,color:T.nv}}>{fn.name}</span>
                      <span style={{fontSize:9,color:T.txD}}>{fn.file}</span>
                      <span style={{fontSize:8,padding:"1px 6px",borderRadius:3,background:T.blP,color:T.bl}}>{fn.returnType||"void"}</span>
                    </div>
                    <div style={{fontSize:9,color:T.txM,marginBottom:8}}>{fn.description}</div>
                    {fn.tests&&fn.tests.map(function(t,ti){
                      var confColor = t.confidence==="high"?"#059669":t.confidence==="medium"?"#D97706":"#EF4444";
                      return <div key={ti} style={{marginBottom:6,padding:"8px 10px",borderRadius:6,background:T.cBg,border:"1px solid "+T.bdL}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <span style={{fontSize:9,fontWeight:700,color:T.nv}}>{t.label||("Test "+(ti+1))}</span>
                          <span style={{marginLeft:"auto",fontSize:8,fontWeight:700,color:confColor}}>{t.confidence}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:9}}>
                          <div><span style={{color:T.txD}}>{"Input: "}</span><code style={{fontFamily:T.f,color:T.bl,fontSize:8}}>{typeof t.input==="string"?t.input.slice(0,80):JSON.stringify(t.input).slice(0,80)}</code></div>
                          <div><span style={{color:T.txD}}>{"Predicted: "}</span><code style={{fontFamily:T.f,color:"#059669",fontSize:8}}>{typeof t.predicted==="string"?t.predicted.slice(0,80):JSON.stringify(t.predicted).slice(0,80)}</code></div>
                        </div>
                        {t.trace&&<div style={{marginTop:4,fontSize:8,color:T.txD,fontStyle:"italic"}}>{typeof t.trace==="string"?t.trace.slice(0,150):""}</div>}
                        {t.bugs&&t.bugs!=="null"&&t.bugs!==null&&<div style={{marginTop:4,padding:"3px 6px",borderRadius:4,background:T.errBg,fontSize:8,color:T.r}}>{"Bug: "+t.bugs}</div>}
                      </div>
                    })}
                  </div>
                })}
              </div>
            </div>}
          </div>;
        })()}
        {resTab==="risks"&&<div style={S.card}><div style={{padding:"14px 20px",borderBottom:"1px solid "+T.bdL}}><div style={{fontSize:14,fontWeight:800,color:T.nv}}>{"Análisis de Riesgos"+(rsk?" ("+rsk.length+")":"")}</div></div>{rsk&&rsk.length>0?rsk.map(function(r,ri){var lc=r.level==="high"?"#DC2626":r.level==="medium"?"#D97706":"#059669";return <div key={ri} style={{padding:"10px 20px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"flex-start",gap:10}}><span style={{width:8,height:8,borderRadius:"50%",background:lc,flexShrink:0,marginTop:4}}/><div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:T.nv}}>{r.msg||r.risk||""}</div>{r.file&&<div style={{fontSize:9,color:T.txD,fontFamily:T.f,marginTop:2}}>{r.file}</div>}</div><span style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:700,background:lc+"12",color:lc,flexShrink:0}}>{r.level||"low"}</span></div>}):<div style={{padding:30,textAlign:"center",color:T.txD}}>{"Sin riesgos"}</div>}</div>}
      </div>}
    </React.Fragment>;
}

export default ResultsView;
