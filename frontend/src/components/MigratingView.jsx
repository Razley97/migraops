import React,{useState} from "react";
import { MODELS } from "../config/models.js";
import { LANGS, MODULE_CONVENTIONS } from "../config/languages.js";
import { AGENTS } from "../data/agents.js";
import { _tks } from "../services/claudeClient.js";

export default function MigratingView(props) {
  var tick=props.tick;
  var migStartTs=props.migStartTs;
  var files=props.files;
  var logs=props.logs;
  var res=props.res;
  var prog=props.prog;
  var migPhase=props.migPhase;
  var mod=props.mod;
  var T=props.T;
  var t=props.t;
  var S=props.S;
  var dark=props.dark;
  var sL=props.sL;
  var tL=props.tL;
  var sV=props.sV;
  var tV=props.tV;
  var setCancelled=props.setCancelled;
  var setActiveController=props.setActiveController;
  var _activeController=props._activeController;
  var setVw=props.setVw;
  var setMigPhase=props.setMigPhase;
  var setLogs=props.setLogs;
  var fmtMs=props.fmtMs;
  var cancelRef=props.cancelRef;
  var globalTimerRef=props.globalTimerRef;
  var migGate=props.migGate;
  var resolveGate=props.resolveGate;
  var activeAgent=props.activeAgent;
  var intR=props.intR;
  var setActR=props.setActR;
  var setShR=props.setShR;
  var pwPre=props.pwPre;
  var pwComparison=props.pwComparison;
  var visualQA=props.visualQA;
  var expandedImgState = useState(null);
  var expandedImg = expandedImgState[0];
  var setExpandedImg = expandedImgState[1];

        void tick; // force re-render every 1s for live timers
        var now=Date.now();
        var elapsed=migStartTs>0?now-migStartTs:0;
        var elS=Math.floor(elapsed/1000);
        var elStr=(elS>=3600?Math.floor(elS/3600)+"h ":"")+String(Math.floor((elS%3600)/60)).padStart(2,"0")+"m "+String(elS%60).padStart(2,"0")+"s";
        var fc=files.length||1;
        var fileLogs=logs.filter(function(l){return l.type==="file"});
        var doneFiles=fileLogs.filter(function(l){return l.st==="done"});
        var activeFile=fileLogs.find(function(l){return l.st!=="done"});
        var pendingCount=Math.max(0,fc-doneFiles.length-(activeFile?1:0));
        var phaseLogs=logs.filter(function(l){return l.type==="phase"});
        // Throughput
        var totalDoneMs=doneFiles.reduce(function(s,l){return s+(l.durationMs||0)},0);
        var avgFileMs=doneFiles.length>0?Math.round(totalDoneMs/doneFiles.length):0;
        var fpm=elapsed>10000&&doneFiles.length>0?Math.round(doneFiles.length/(elapsed/60000)*10)/10:0;
        // Lines processed
        var linesProc=doneFiles.reduce(function(s,l){return s+(l.linesMig||l.lines||0)},0);
        if (!linesProc) linesProc=res.reduce(function(s,r){return s+(r.migrated?r.migrated.split("\n").length:0)},0);
        // ETA — smoothed
        var etaMs=0;
        if (prog>3&&prog<100) {
          var linearEta=Math.round(elapsed*((100-prog)/Math.max(prog,1)));
          etaMs=Math.min(linearEta,fc*90*1000);
          if(prog<20) etaMs=Math.min(etaMs,fc*60*1000);
        }
        var etaS=etaMs>0?Math.max(5,Math.round(etaMs/1000)):0;
        var etaStr=etaS>0?((etaS>=60?"~"+Math.ceil(etaS/60)+"m":"~"+etaS+"s")):"";
        // Phase info
        var phDefs=[
          {k:"visual_baseline",ic:"0",l:"Visual Baseline",d:"Capturing pre-migration screenshots...",c:"#8b5cf6"},
          {k:"analysis",ic:"A",l:t.gPhA,d:t.gPhAd,c:"#6366f1"},
          {k:"migration",ic:"›",l:t.gPhB,d:t.gPhBd,c:T.bl},
          {k:"consolidation",ic:"B2",l:t.gPhB2,d:t.gPhB2,c:"#0ea5e9"},
          {k:"integration",ic:"C",l:t.gPhC,d:t.gPhCd,c:"#059669"},
          {k:"qa",ic:"D",l:t.gPhD,d:t.gPhDd,c:"#d97706"},
          {k:"visual_compare",ic:"V",l:"Visual Fidelity",d:"Comparing visual output...",c:"#8b5cf6"}
        ];
        var curPhDef=phDefs.find(function(p){return p.k===migPhase})||phDefs[0];
        var mlObj=MODELS.find(function(m){return m.id===mod});
        // API call count
        var apiCount=phaseLogs.length+doneFiles.length+(activeFile?1:0);

        return <div style={{paddingTop:6,height:"calc(100vh - 90px)",overflowY:"auto",scrollbarWidth:"thin"}}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>

          {/* ═══ HEADER — Dark gradient bar with context + live clock ═══ */}
          <div style={{background:"linear-gradient(135deg,"+T.nv+","+T.nvL+")",borderRadius:12,padding:"10px 16px",color:"#fff"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>{"›"}</span>{t.mgHdr}
                </div>
                <div style={{fontSize:10,opacity:.8,marginTop:2}}>
                  <span style={{fontWeight:700}}>{(LANGS[sL]||{}).n+" "+sV}</span>
                  {" → "}
                  <span style={{fontWeight:700}}>{(LANGS[tL]||{}).n+" "+tV}</span>
                  {" · "+fc+" "+t.files+" · "+(mlObj?mlObj.n:"")}
                  {sL!==tL?<span style={{marginLeft:4,padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:800,background:"rgba(251,191,36,.25)",color:"#fbbf24"}}>{t.crossLang}</span>
                          :<span style={{marginLeft:4,padding:"1px 6px",borderRadius:4,fontSize:7,fontWeight:800,background:"rgba(96,165,250,.25)",color:T.blP}}>{t.verUpg}</span>}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                {/* Live elapsed — monospaced clock */}
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:T.f,fontSize:24,fontWeight:900,letterSpacing:1,lineHeight:1,color:elS>420?"#fca5a5":elS>360?"#fde68a":"inherit"}}>{elStr}</div>
                  <div style={{fontSize:7,opacity:.6,textTransform:"uppercase",letterSpacing:1}}>{t.mgElapsed+" · "+t.timeLimit}</div>
                </div>
                {migPhase!=="done"&&<button onClick={function(){cancelRef.current=true;setCancelled(true);if(_activeController)try{_activeController.abort()}catch(e){}setActiveController(null);if(globalTimerRef.current){clearTimeout(globalTimerRef.current);globalTimerRef.current=null;}setMigPhase("done");setLogs(function(p){return p.concat([{type:"phase",phase:"cancelled",st:"done",ts:Date.now()}])});setTimeout(function(){if(res.length)setVw("results");else setVw("upload")},500)}} style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.25)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.9)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:T.ui}}>{"✕ "+t.cancel}</button>}
              </div>
            </div>
            {/* Sub-bar: overall progress thin line */}
            <div style={{marginTop:10,height:4,borderRadius:2,background:"rgba(255,255,255,.15)",overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:2,background:"rgba(255,255,255,.8)",width:prog+"%",transition:"width .6s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
              <span style={{fontSize:8,opacity:.6}}>{prog+"%"}</span>
              {etaStr&&<span style={{fontSize:8,opacity:.6}}>{"ETA "+etaStr}</span>}
              {prog>0&&<span style={{fontSize:8,opacity:.7,fontWeight:600}}>{prog>=90?t.encourageAlmost:prog>=70?t.encourageGreat:prog>=50?t.encourageHalf:prog>=25?t.encourageProgress:""}</span>}
            </div>
          </div>

          {/* ═══ ACTIVE AGENT BADGE ═══ */}
          {activeAgent&&AGENTS[activeAgent]&&(function(){
            var ag=AGENTS[activeAgent];
            return <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",borderRadius:12,background:ag.color+"12",border:"1px solid "+ag.color+"30",animation:"pulse 2s ease-in-out infinite"}}>
              <span style={{fontSize:18}}>{ag.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12,color:ag.color,fontFamily:T.f}}>{ag.name}</div>
                <div style={{fontSize:9,color:T.txM,fontFamily:T.f}}>working on this phase...</div>
              </div>
              <div style={{width:8,height:8,borderRadius:"50%",background:ag.color,animation:"pulse 1.5s ease-in-out infinite"}}/>
            </div>
          })()}

          {/* ═══ FREE-TIER BANNER — Rate limit warning for free providers ═══ */}
          {mod&&/^(gemini|llama|gemma|mixtral)/i.test(mod)&&<div style={{background:"rgba(59,130,246,0.1)",borderLeft:"3px solid #3b82f6",padding:"8px 12px",borderRadius:6,fontSize:12,color:"#93c5fd",marginBottom:0,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>{"ℹ️"}</span>
            <span>{t.freeTierNote}</span>
          </div>}

          {/* ═══ CROSS-LANGUAGE CONTEXT — Module system mapping (only for cross-lang) ═══ */}
          {sL!==tL&&(function(){
            var srcMod=MODULE_CONVENTIONS[sL]||{};
            var tgtMod=MODULE_CONVENTIONS[tL]||{};
            return <div style={{display:"flex",gap:6,fontSize:9}}>
              <div style={{flex:1,padding:"8px 10px",borderRadius:10,background:T.w,border:"1px solid "+T.bdL}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <span style={{fontSize:11}}>{(LANGS[sL]||{}).i}</span>
                  <span style={{fontWeight:700,color:T.nv}}>{(LANGS[sL]||{}).n}</span>
                </div>
                <div style={{fontSize:8,color:T.txM,lineHeight:1.3}}>{srcMod.system||"—"}</div>
                <div style={{fontSize:7,color:T.txD,marginTop:2}}>{srcMod.naming||""}</div>
              </div>
              <div style={{alignSelf:"center",fontSize:14,color:T.bl}}>{"→"}</div>
              <div style={{flex:1,padding:"8px 10px",borderRadius:10,background:T.blM,border:"1px solid "+T.blP}}>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                  <span style={{fontSize:11}}>{(LANGS[tL]||{}).i}</span>
                  <span style={{fontWeight:700,color:T.nv}}>{(LANGS[tL]||{}).n}</span>
                </div>
                <div style={{fontSize:8,color:T.txM,lineHeight:1.3}}>{tgtMod.system||"—"}</div>
                <div style={{fontSize:7,color:T.txD,marginTop:2}}>{tgtMod.naming||""}</div>
              </div>
            </div>
          })()}

          {/* ═══ PROGRESS RING + ACTIVE PHASE CARD ═══ */}
          <div style={Object.assign({},S.card,{padding:"12px 16px"})}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              {/* Ring */}
              <div style={{position:"relative",width:64,height:64,flexShrink:0}}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="27" fill="none" stroke={dark?"#2d3348":"#e8ecf0"} strokeWidth="4"/>
                  <circle cx="32" cy="32" r="27" fill="none" stroke={curPhDef.c} strokeWidth="4" strokeDasharray={prog*1.7+" 170"} strokeLinecap="round" transform="rotate(-90 32 32)" style={{transition:"stroke-dasharray .6s ease"}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,fontFamily:T.f,color:T.nv,lineHeight:1}}>{prog+"%"}</div>
                  <div style={{fontSize:7,color:T.txD,fontWeight:600}}>{doneFiles.length+"/"+fc}</div>
                </div>
              </div>
              {/* Phase info + what's happening now */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:16}}>{curPhDef.ic}</span>
                  <span style={{fontSize:13,fontWeight:800,color:T.nv}}>{curPhDef.l}</span>
                  {migPhase==="migration"&&<span style={{fontFamily:T.f,fontSize:9,color:T.bl,fontWeight:700}}>{doneFiles.length+"/"+fc}</span>}
                </div>
                <div style={{fontSize:10,color:T.txM,marginBottom:6}}>{curPhDef.d}</div>
                {/* Active file chip — what's being processed RIGHT NOW */}
                {activeFile&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:activeFile.st==="planning"?T.blP:T.blM,border:"1px solid "+(activeFile.st==="planning"?"#c4b5fd":T.blP)}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:activeFile.st==="planning"?"#7c3aed":T.bl,animation:"pulse 1.5s infinite",flexShrink:0}}/>
                  <span style={{fontSize:8,fontWeight:700,color:activeFile.st==="planning"?"#7c3aed":activeFile.st==="qa-validating"?"#6366f1":activeFile.st==="qa-passed"?"#10b981":activeFile.st==="qa-failed"||activeFile.st==="re-migrating"?"#f59e0b":T.bl,textTransform:"uppercase",letterSpacing:.5}}>{activeFile.st==="planning"?t.mgPlanning:activeFile.st==="qa-validating"?"QA Validando":activeFile.st==="qa-passed"?"QA Aprobado":activeFile.st==="qa-failed"?"QA Failed":activeFile.st==="re-migrating"?"Re-migrando":t.mgActive}</span>
                  <span style={{fontFamily:T.f,fontSize:10,fontWeight:600,color:T.nv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeFile.file}</span>
                  {activeFile.targetFile&&activeFile.targetFile!==activeFile.file&&<span style={{color:T.bl,fontSize:8,flexShrink:0}}>{"→ "+activeFile.targetFile}</span>}
                  {activeFile.st==="migrating"&&activeFile.planOk!==undefined&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:activeFile.planOk?"#f0fdf4":"#fffbeb",color:activeFile.planOk?T.g:"#92400e",fontWeight:700}}>{activeFile.planOk?(activeFile.planChanges||0)+" changes":"⚡ sin plan"}</span>}
                  {activeFile.capacity&&<span style={{fontSize:6,padding:"1px 4px",borderRadius:3,background:activeFile.capacity.tier>=3?"#fef2f2":activeFile.capacity.tier>=2?"#fffbeb":"#f0fdf4",color:activeFile.capacity.tier>=3?T.r:activeFile.capacity.tier>=2?T.y:T.g,fontWeight:700}}>{(activeFile.capacity.promoted?"↑ ":"")+activeFile.capacity.label+" "+Math.round(activeFile.capacity.migTokens/1000)+"k tk"}</span>}
                  {activeFile.ts&&<span style={{fontFamily:T.f,fontSize:9,color:activeFile.st==="planning"?"#7c3aed":T.bl,fontWeight:700,marginLeft:"auto",flexShrink:0}}>{fmtMs(now-activeFile.ts)}</span>}
                </div>}
                {/* Phase-level activity when no file active */}
                {!activeFile&&(migPhase==="analysis"||migPhase==="consolidation"||migPhase==="integration"||migPhase==="qa")&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:curPhDef.c+"10",border:"1px solid "+curPhDef.c+"25"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:curPhDef.c,animation:"pulse 1.5s infinite",flexShrink:0}}/>
                  <span style={{fontSize:10,fontWeight:600,color:curPhDef.c}}>{curPhDef.d}</span>
                  {(function(){var phLog=phaseLogs.find(function(l){return l.phase===migPhase&&l.st==="run"});return phLog&&phLog.ts?<span style={{fontFamily:T.f,fontSize:9,color:curPhDef.c,fontWeight:700,marginLeft:"auto"}}>{fmtMs(now-phLog.ts)}</span>:null})()}
                </div>}
              </div>
            </div>
          </div>

          {/* ═══ LIVE METRICS — 5 KPI cards ═══ */}
          {(function(){
            var costUsd=mlObj?((_tks.i*(mlObj.pi||0)+_tks.o*(mlObj.po||0))/1000000):0;
            var costStr=costUsd>0?(costUsd<0.01?"<$0.01":"$"+costUsd.toFixed(3)):"--";
            var tkTotal=_tks.i+_tks.o;
            var tkStr=tkTotal>0?(tkTotal>1000?Math.round(tkTotal/1000)+"k":String(tkTotal)):"--";
            return <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
              {[
                {l:t.mgFiles,v:doneFiles.length+"/"+fc,ic:"",c:T.bl,sub:pendingCount>0?pendingCount+" "+t.mgPending.toLowerCase():""},
                {l:t.mgApiCalls,v:String(_tks.calls||apiCount),ic:"🔌",c:"#6366f1",sub:""},
                {l:t.mgThroughput,v:fpm>0?String(fpm):"--",ic:"›",c:"#059669",sub:fpm>0?t.mgFilesPerMin:""},
                {l:t.mgTokens,v:tkStr,ic:"🔤",c:"#d97706",sub:linesProc>0?linesProc.toLocaleString()+" ln":""},
                {l:t.mgCost,v:costStr,ic:"💰",c:"#dc2626",sub:mlObj?mlObj.n:""}
              ].map(function(m,i){
                return <div key={i} style={{padding:"8px 6px",borderRadius:10,background:T.w,border:"1px solid "+T.bdL,textAlign:"center"}}>
                  <div style={{fontSize:11,marginBottom:2}}>{m.ic}</div>
                  <div style={{fontSize:14,fontWeight:900,color:m.c,fontFamily:T.f,lineHeight:1.1}}>{m.v}</div>
                  <div style={{fontSize:8,color:T.txD,fontWeight:600,textTransform:"uppercase",marginTop:3}}>{m.l}</div>
                  {m.sub&&<div style={{fontSize:7,color:T.txM,marginTop:1}}>{m.sub}</div>}
                </div>
              })}
            </div>
          })()}

          {/* ═══ HUMAN GATE — Approval card when pipeline is waiting ═══ */}
          {migGate&&<div style={{border:"2px solid #f59e0b",borderRadius:12,background:dark?"rgba(245,158,11,.08)":"#fffbeb",animation:"fadeIn .3s ease",overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"10px 14px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:800}}>{migGate.title}</div>
              <div style={{fontSize:8,opacity:.85}}>{"Fase: "+migGate.phase+" · Esperando tu decisión"}</div></div>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"pulse 1.2s infinite",flexShrink:0}}/>
            </div>
            <div style={{padding:"10px 14px",overflowY:"auto",maxHeight:160,flexShrink:1}}>
              <div style={{fontSize:11,color:dark?"#fbbf24":"#92400e",lineHeight:1.5,whiteSpace:"pre-line",fontFamily:T.ui}}>{migGate.message}</div>
              {migGate.data&&migGate.data.migrated&&<details style={{marginTop:8}}>
                <summary style={{fontSize:10,fontWeight:700,color:T.bl,cursor:"pointer"}}>{"Ver código migrado"}</summary>
                <pre style={{maxHeight:150,overflow:"auto",padding:6,borderRadius:6,background:T.cBg,fontSize:9,border:"1px solid "+T.bdL,marginTop:4}}>{migGate.data.migrated.slice(0,2000)}</pre>
              </details>}
            </div>
            <div style={{padding:"8px 14px 12px",flexShrink:0,borderTop:"1px solid "+(dark?"rgba(245,158,11,.2)":"rgba(217,119,6,.15)"),background:dark?"rgba(245,158,11,.04)":"rgba(255,251,235,.8)"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={function(){resolveGate(true,"")}} style={Object.assign({},S.btn("g"),{padding:"8px 18px",fontSize:11,fontWeight:700})}>{(migGate.options&&migGate.options.approveLabel)||"Aprobar"}</button>
                {migGate.options&&migGate.options.skipLabel&&<button onClick={function(){resolveGate(true,"skip_all")}} style={Object.assign({},S.btn(),{padding:"8px 14px",fontSize:10})}>{migGate.options.skipLabel}</button>}
                <button onClick={function(){var reason=prompt("¿Qué cambios necesitas?")||"";if(reason)resolveGate(false,reason);else resolveGate(false,"")}} style={Object.assign({},S.btn("r"),{padding:"8px 16px",fontSize:10,fontWeight:700})}>{(migGate.options&&migGate.options.rejectLabel)||"Rechazar"}</button>
              </div>
            </div>
          </div>}

          {/* ═══ PHASE PIPELINE — Connected stepper ═══ */}
          <div style={Object.assign({},S.card,{padding:"10px 14px"})}>
            <div style={{display:"flex",alignItems:"flex-start",gap:0}}>
              {phDefs.map(function(ph,idx){
                var allPhases=["analysis","migration","consolidation","integration","qa","done"];
                var ci=allPhases.indexOf(migPhase);
                var pi=allPhases.indexOf(ph.k);
                var isDone=ci>pi;
                var isAct=ci===pi;
                var phLog=phaseLogs.find(function(l){return l.phase===ph.k&&(l.st==="done"||l.st==="checked"||l.st==="fixed")});
                var dur=phLog&&phLog.durationMs?fmtMs(phLog.durationMs):"";
                var sc=phLog&&phLog.score!==undefined?phLog.score:null;
                return <div key={ph.k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                  {idx>0&&<div style={{position:"absolute",top:11,right:"50%",width:"100%",height:2,background:isDone?T.g:isAct?"linear-gradient(90deg,"+T.bl+","+T.bdL+")":T.bdL,zIndex:0}}/>}
                  <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone||isAct?9:8,fontWeight:800,position:"relative",zIndex:1,border:"2px solid "+(isDone?T.g:isAct?ph.c:T.bdL),background:isDone?T.g:isAct?ph.c:T.w,color:isDone||isAct?"#fff":T.txD,transition:"all .3s"}}>
                    {isDone?"✓":isAct?ph.ic.slice(0,2):(idx+1)}
                  </div>
                  <div style={{fontSize:7,fontWeight:isAct?800:600,color:isDone?T.g:isAct?T.nv:T.txD,marginTop:3,textAlign:"center",lineHeight:1.1,maxWidth:70}}>{ph.l}</div>
                  {dur&&<div style={{fontSize:7,fontFamily:T.f,color:T.g,fontWeight:700}}>{dur}</div>}
                  {sc!==null&&<div style={{fontSize:7,fontFamily:T.f,fontWeight:700,color:sc>=90?T.g:sc>=70?T.y:T.r}}>{sc+"/100"}</div>}
                </div>
              })}
            </div>
          </div>

          {/* ═══ ACTIVITY LOG — Phase events (compact, auto-scrolled) ═══ */}
          {phaseLogs.length>0&&<div style={S.card}>
            <div style={Object.assign({},S.cH,{padding:"6px 14px"})}><span style={{fontWeight:700,fontSize:10,color:T.nv}}>{t.mgActivity}</span></div>
            <div style={{maxHeight:110,overflowY:"auto"}}>
              {phaseLogs.map(function(l,i){
                var phI=phDefs.find(function(p){return p.k===l.phase})||{ic:"•",l:l.phase,c:T.txM};
                var isDone=l.st==="done"||l.st==="checked"||l.st==="fixed";
                var isErr=l.phase==="rollback"||l.phase==="stall"||l.phase==="cancelled";
                // Consolidation sub-phase labels
                var subLabel=l.subPhase==="audit"?t.gPhB2a:l.subPhase==="fix"?t.gPhB2b:l.subPhase==="security"?"Security Audit":null;
                var displayLabel=subLabel||phI.l;
                // Consolidation sub-phase metrics
                var subMeta="";
                if (l.subPhase==="audit"&&isDone) subMeta=l.connections+" "+t.pConns+(l.broken>0?" · "+l.broken+" "+t.pBroken:"")+(l.issues>0?" · "+l.issues+" "+t.pIssues:"");
                if (l.subPhase==="fix"&&isDone) subMeta=(l.fixed||0)+" fixed"+(l.fixes?" · "+(l.fixes||0)+" "+t.pIssues:"");
                if (l.subPhase==="security"&&isDone) subMeta=(l.findings||0)+" findings";
                return <div key={i} style={{padding:"4px 14px",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:6,fontSize:9,background:isErr?T.errBg+"80":"transparent"}}>
                  <span style={{fontSize:10}}>{isDone?"✅":isErr?"⚠️":l.subPhase?"↳":phI.ic}</span>
                  <span style={{fontWeight:600,color:isErr?T.r:l.subPhase?T.txM:T.nv,flex:1,fontSize:l.subPhase?8:9}}>{displayLabel}{l.iter?" #"+l.iter:""}</span>
                  {subMeta&&<span style={{padding:"0 5px",borderRadius:4,fontSize:7,fontWeight:600,background:T.blP,color:T.bl}}>{subMeta}</span>}
                  {l.score!==undefined&&<span style={{padding:"0 5px",borderRadius:4,fontSize:7,fontWeight:800,background:l.score>=95?T.okBg:l.score>=80?T.warnBg:T.errBg,color:l.score>=95?T.g:l.score>=80?T.y:T.r}}>{l.score+"/100"}</span>}
                  {l.detail&&<span style={{fontSize:7,color:T.txM,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.detail}</span>}
                  {isDone&&l.durationMs&&<span style={{fontFamily:T.f,fontSize:7,fontWeight:700,color:T.g}}>{fmtMs(l.durationMs)}</span>}
                  {!isDone&&!isErr&&l.ts&&<span style={{fontFamily:T.f,fontSize:8,color:T.bl,fontWeight:700}}>{fmtMs(now-l.ts)}</span>}
                  {!isDone&&!isErr&&<div style={{width:18,height:2,borderRadius:1,background:T.bdL,overflow:"hidden"}}><div style={{width:"50%",height:"100%",background:T.bl,animation:"pulse 1.5s infinite"}}/></div>}
                </div>
              })}
            </div>
          </div>}

          {/* ═══ RATE-LIMIT / COOLDOWN / SKIPPED PHASE CARDS ═══ */}
          {(function(){
            var rlLogs=logs.filter(function(l){return l.type==="rate_limit"||l.type==="cooldown"||l.type==="phase_skipped"});
            if(!rlLogs.length) return null;
            return <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {rlLogs.map(function(l,i){
                if(l.type==="rate_limit"){
                  var remaining=Math.max(0,Math.ceil((l.ts+l.waitMs-now)/1000));
                  var progressPct=Math.min(100,((l.waitMs-remaining*1000)/l.waitMs*100));
                  return <div key={"rl-"+i} style={{background:"rgba(245,158,11,0.15)",borderLeft:"3px solid #f59e0b",padding:"10px 14px",borderRadius:8,marginBottom:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:16}}>{"⏳"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#fbbf24"}}>{l.msg}</div>
                        <div style={{fontSize:10,color:"#f59e0b",fontFamily:T.f,fontWeight:600,marginTop:2}}>
                          {remaining>0?(t.rateLimitWait+" "+remaining+"s..."):t.rateLimitWait}
                        </div>
                      </div>
                      {remaining>0&&<div style={{fontFamily:T.f,fontSize:18,fontWeight:900,color:"#f59e0b"}}>{remaining+"s"}</div>}
                    </div>
                    <div style={{marginTop:8,height:3,borderRadius:2,background:"rgba(245,158,11,0.2)",overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:2,background:"#f59e0b",width:progressPct+"%",transition:"width 1s linear"}}/>
                    </div>
                  </div>
                }
                if(l.type==="cooldown"){
                  var cdRemaining=Math.max(0,Math.ceil((l.ts+l.waitMs-now)/1000));
                  return <div key={"cd-"+i} style={{background:"rgba(99,102,241,0.1)",borderLeft:"3px solid #6366f1",padding:"8px 12px",borderRadius:6,marginBottom:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13}}>{"⏸"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:10,fontWeight:600,color:"#a5b4fc"}}>{l.msg}</div>
                        {cdRemaining>0&&<div style={{fontSize:9,color:"#818cf8",fontFamily:T.f,marginTop:1}}>{t.interPhaseCooldown+" "+cdRemaining+"s"}</div>}
                      </div>
                      {cdRemaining>0&&<div style={{fontFamily:T.f,fontSize:14,fontWeight:800,color:"#818cf8"}}>{cdRemaining+"s"}</div>}
                    </div>
                  </div>
                }
                if(l.type==="phase_skipped"){
                  return <div key={"sk-"+i} style={{background:"rgba(156,163,175,0.15)",borderLeft:"3px solid #9ca3af",padding:"8px 12px",borderRadius:6,marginBottom:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13}}>{"⚠️"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:10,fontWeight:600,color:"#9ca3af"}}>{l.msg}</div>
                        <div style={{fontSize:8,color:"#6b7280",marginTop:1}}>{t.phaseSkipped}</div>
                      </div>
                    </div>
                  </div>
                }
                return null;
              })}
            </div>
          })()}

          {/* ═══ VISUAL QA — Screenshot preview + QA summary ═══ */}
          {(pwPre||pwComparison||visualQA)&&(function(){
            var pre=pwPre;
            var comp=pwComparison;
            var vqa=visualQA;
            var preScreenshots=pre&&pre.screenshots?pre.screenshots:[];
            var postScreenshots=comp&&comp.details&&comp.details.diffImages?comp.details.diffImages:[];
            var vd=vqa?vqa.verdict:null;
            var cd=vqa?vqa.comparison:(comp||null);

            return <React.Fragment>
            {/* Expanded image modal */}
            {expandedImg&&<div onClick={function(){setExpandedImg(null)}} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
              <div style={{position:"relative",maxWidth:"95vw",maxHeight:"95vh"}}>
                <img src={expandedImg.src} alt={expandedImg.alt||"Screenshot"} style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:8,border:"2px solid rgba(255,255,255,.2)"}}/>
                <div style={{position:"absolute",top:-30,left:0,right:0,textAlign:"center",color:"#fff",fontSize:12,fontWeight:700}}>{expandedImg.alt||"Screenshot"}</div>
                <div style={{position:"absolute",bottom:-28,left:0,right:0,textAlign:"center",color:"rgba(255,255,255,.5)",fontSize:10}}>{"Click anywhere to close"}</div>
              </div>
            </div>}

            <div style={Object.assign({},S.card,{overflow:"hidden"})}>
              <div style={{padding:"10px 14px",background:"linear-gradient(135deg,#7C3AED,#8B5CF6)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14}}>{"\uD83D\uDCF8"}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:800}}>{"Visual QA \u2014 Playwright Report"}</div>
                    <div style={{fontSize:8,opacity:.7}}>{comp?"Pre + Post comparison complete":pre?"Pre-migration baseline captured":"Capturing..."}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {vd&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:900,background:vd.overall==="PASS"?"rgba(5,150,105,.2)":vd.overall==="WARN"?"rgba(217,119,6,.2)":"rgba(220,38,38,.2)",color:"#fff"}}>{vd.overall}</span>}
                  {cd&&cd.compositeScore!=null&&<div style={{width:32,height:32,borderRadius:"50%",border:"2px solid "+(cd.compositeScore>=80?"#34D399":cd.compositeScore>=60?"#FBBF24":"#F87171"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff"}}>{cd.compositeScore}</div>}
                </div>
              </div>

              <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:12}}>

                {/* ── Test Methodology ── */}
                <div style={{padding:"10px 14px",borderRadius:8,background:T.cBg,border:"1px solid "+T.bdL}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.nv,marginBottom:6}}>{"Test Methodology"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"110px 1fr",gap:"3px 8px",fontSize:9,color:T.txM}}>
                    <span style={{fontWeight:700,color:T.txD}}>{"Engine:"}</span>
                    <span>{"Playwright (headless Chromium)"}</span>
                    <span style={{fontWeight:700,color:T.txD}}>{"Viewport:"}</span>
                    <span>{"1280\u00d7720px desktop"}</span>
                    <span style={{fontWeight:700,color:T.txD}}>{"Comparison:"}</span>
                    <span>{"Pixel diff (pixelmatch) + DOM structural analysis"}</span>
                    <span style={{fontWeight:700,color:T.txD}}>{"Scoring:"}</span>
                    <span>{"Visual 40% + DOM 25% + Functional 20% + Perf 10% + A11y 5%"}</span>
                  </div>
                </div>

                {/* ── Pre-migration screenshots ── */}
                {preScreenshots.length>0&&<div>
                  <div style={{fontSize:10,fontWeight:700,color:T.txD,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#7C3AED"}}/>
                    {"Pre-Migration \u00b7 "+preScreenshots.length+" screenshot"+(preScreenshots.length>1?"s":"")+" captured"}
                  </div>
                  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                    {preScreenshots.map(function(ss,i){
                      return <div key={i} onClick={function(){setExpandedImg({src:"data:image/png;base64,"+ss.png,alt:"Pre-Migration: "+(ss.route||"/")})}} style={{flexShrink:0,borderRadius:8,border:"2px solid "+T.bdL,overflow:"hidden",background:T.cBg,cursor:"zoom-in",transition:"transform .15s",position:"relative"}}>
                        <img src={"data:image/png;base64,"+ss.png} alt={"Pre "+i} style={{width:220,height:140,objectFit:"cover",display:"block"}}/>
                        <div style={{position:"absolute",top:4,right:4,padding:"1px 5px",borderRadius:4,background:"rgba(0,0,0,.6)",color:"#fff",fontSize:7,fontWeight:700}}>{"\uD83D\uDD0D Click to expand"}</div>
                        <div style={{padding:"4px 8px",fontSize:8,color:T.txD,textAlign:"center",fontWeight:600}}>{ss.route||"/"}</div>
                      </div>
                    })}
                  </div>
                </div>}

                {/* ── Pre baseline detailed metrics ── */}
                {pre&&pre.ok&&<div style={{borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                  <div style={{padding:"6px 10px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:9,fontWeight:700,color:T.nv}}>{"Baseline Metrics"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0}}>
                    {[
                      {l:"Routes",v:pre.routes?pre.routes.length:0,c:T.bl},
                      {l:"Load Time",v:pre.metrics&&pre.metrics.loadTime?pre.metrics.loadTime+"ms":"N/A",c:T.nv},
                      {l:"JS Errors",v:pre.jsErrors?pre.jsErrors.length:0,c:pre.jsErrors&&pre.jsErrors.length>0?T.r:T.g},
                      {l:"Capture",v:pre.durationMs?fmtMs(pre.durationMs):"N/A",c:T.nv}
                    ].map(function(m,mi){
                      return <div key={mi} style={{padding:"8px 6px",textAlign:"center",borderRight:mi<3?"1px solid "+T.bdL:"none"}}>
                        <div style={{fontSize:7,fontWeight:700,color:T.txD,textTransform:"uppercase"}}>{m.l}</div>
                        <div style={{fontSize:14,fontWeight:900,fontFamily:T.f,color:m.c,marginTop:2}}>{m.v}</div>
                      </div>
                    })}
                  </div>
                  {pre.domSummary&&<div style={{padding:"6px 10px",borderTop:"1px solid "+T.bdL,fontSize:9,color:T.txM}}>
                    {"DOM: "+pre.domSummary.nodeCount+" nodes, "+pre.domSummary.uniqueTags+" unique tags"+(pre.domSummary.depth?", depth "+pre.domSummary.depth:"")}
                  </div>}
                  {pre.jsErrors&&pre.jsErrors.length>0&&<div style={{padding:"6px 10px",borderTop:"1px solid "+T.bdL,background:T.errBg}}>
                    <div style={{fontSize:8,fontWeight:700,color:T.r,marginBottom:2}}>{"JS Errors Detected:"}</div>
                    {pre.jsErrors.map(function(err,ei){return <div key={ei} style={{fontSize:8,color:T.r,fontFamily:T.f,marginBottom:1}}>{err}</div>})}
                  </div>}
                  {pre.routes&&pre.routes.length>0&&<div style={{padding:"6px 10px",borderTop:"1px solid "+T.bdL,fontSize:9,color:T.txM}}>
                    {"Routes tested: "+pre.routes.join(", ")}
                  </div>}
                </div>}

                {/* ── Interactive QA Test Results ── */}
                {pre&&pre.qaTests&&pre.qaTests.length>0&&<div style={{borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                  <div style={{padding:"8px 12px",background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{fontSize:10,fontWeight:800}}>{"Interactive QA Tests \u2014 "+pre.qaTests.length+" tests"}</div>
                    <div style={{display:"flex",gap:4}}>
                      {(function(){var p=pre.qaTests.filter(function(t){return t.status==="pass"}).length;var w=pre.qaTests.filter(function(t){return t.status==="warn"}).length;var f=pre.qaTests.filter(function(t){return t.status==="fail"}).length;return [p>0&&React.createElement("span",{key:"p",style:{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:"rgba(5,150,105,.3)",color:"#34D399"}},p+" pass"),w>0&&React.createElement("span",{key:"w",style:{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:"rgba(217,119,6,.3)",color:"#FBBF24"}},w+" warn"),f>0&&React.createElement("span",{key:"f",style:{padding:"1px 6px",borderRadius:4,fontSize:8,fontWeight:700,background:"rgba(220,38,38,.3)",color:"#F87171"}},f+" fail")]})()}
                    </div>
                  </div>
                  <div style={{maxHeight:500,overflowY:"auto"}}>
                    {pre.qaTests.map(function(qt,qi){
                      var stColor=qt.status==="pass"?T.g:qt.status==="warn"?"#D97706":qt.status==="fail"?T.r:"#6366F1";
                      var stBg=qt.status==="pass"?T.okBg:qt.status==="warn"?T.warnBg:qt.status==="fail"?T.errBg:T.blP;
                      var catIcons={load:"\uD83D\uDE80",console:"\uD83D\uDCBB",discovery:"\uD83D\uDD0D",interaction:"\uD83D\uDC46",form:"\u270D\uFE0F",scroll:"\u2195\uFE0F",responsive:"\uD83D\uDCF1"};
                      return <div key={qi} style={{borderBottom:"1px solid "+T.bdL,padding:"10px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <span style={{fontSize:12}}>{catIcons[qt.category]||"\uD83E\uDDEA"}</span>
                          <span style={{fontSize:10,fontWeight:700,color:T.nv,flex:1}}>{qt.description}</span>
                          <span style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:800,background:stBg,color:stColor,textTransform:"uppercase"}}>{qt.status}</span>
                        </div>
                        <div style={{fontSize:9,color:T.txM,marginBottom:qt.meta||qt.screenshots&&qt.screenshots.length>0?8:0}}>{qt.findings}</div>
                        {qt.meta&&qt.status==="warn"&&<div style={{background:"rgba(217,119,6,0.08)",border:"1px solid rgba(217,119,6,0.2)",borderRadius:6,padding:"8px 10px",marginBottom:8,fontSize:9}}>
                          {qt.meta.detail&&<div style={{color:"#FBBF24",fontWeight:700,marginBottom:4}}>{qt.meta.detail}</div>}
                          {qt.meta.errors&&qt.meta.errors.length>0&&<div style={{marginBottom:4}}>
                            <div style={{color:T.txD,fontWeight:600,marginBottom:2}}>{"Errores encontrados:"}</div>
                            {qt.meta.errors.map(function(err,ei){return <div key={ei} style={{color:T.txM,padding:"2px 0 2px 8px",borderLeft:"2px solid rgba(217,119,6,0.3)",marginBottom:2,fontFamily:"monospace",fontSize:8,wordBreak:"break-all"}}>{err}</div>})}
                          </div>}
                          {qt.meta.culprits&&qt.meta.culprits.length>0&&<div style={{marginBottom:4}}>
                            <div style={{color:T.txD,fontWeight:600,marginBottom:2}}>{"Elementos que causan overflow:"}</div>
                            {qt.meta.culprits.map(function(c,ci){return <div key={ci} style={{color:T.txM,padding:"2px 0 2px 8px",borderLeft:"2px solid rgba(217,119,6,0.3)",marginBottom:2,fontSize:8}}><span style={{fontFamily:"monospace",color:"#FBBF24"}}>{c.selector}</span>{" \u2014 ancho: "+c.width+"px, overflow: "+c.overflow+"px"}</div>})}
                          </div>}
                          {qt.meta.recommendation&&<div style={{color:"#93C5FD",fontWeight:600,marginTop:4,padding:"4px 8px",background:"rgba(59,130,246,0.08)",borderRadius:4}}>{"\uD83D\uDCA1 "+qt.meta.recommendation}</div>}
                        </div>}
                        {qt.screenshots&&qt.screenshots.length>0&&<div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2}}>
                          {qt.screenshots.map(function(ss,si){
                            return ss.png?<div key={si} onClick={function(){setExpandedImg({src:"data:image/png;base64,"+ss.png,alt:qt.description+" \u2014 "+ss.stage})}} style={{flexShrink:0,borderRadius:6,border:"1px solid "+T.bdL,overflow:"hidden",cursor:"zoom-in"}}>
                              <img src={"data:image/png;base64,"+ss.png} alt={ss.stage} style={{width:180,height:110,objectFit:"cover",display:"block"}}/>
                              <div style={{padding:"2px 6px",fontSize:7,color:T.txD,textAlign:"center",background:T.cBg,fontWeight:600}}>{ss.stage}</div>
                            </div>:null
                          })}
                        </div>}
                      </div>
                    })}
                  </div>
                </div>}

                {/* ── Post-migration diff screenshots ── */}
                {postScreenshots.length>0&&<div>
                  <div style={{fontSize:10,fontWeight:700,color:T.txD,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:"#2563EB"}}/>
                    {"Post-Migration Diff \u00b7 "+postScreenshots.length+" route"+(postScreenshots.length>1?"s":"")}
                  </div>
                  <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
                    {postScreenshots.map(function(di,i){
                      var mc=di.matchPct>=90?T.g:di.matchPct>=70?T.y:T.r;
                      return <div key={i} onClick={function(){setExpandedImg({src:"data:image/png;base64,"+di.diff,alt:"Diff: "+(di.route||"/")+" \u2014 "+di.matchPct+"% match"})}} style={{flexShrink:0,borderRadius:8,border:"2px solid "+T.bdL,overflow:"hidden",background:T.cBg,cursor:"zoom-in"}}>
                        <img src={"data:image/png;base64,"+di.diff} alt={"Diff "+i} style={{width:220,height:140,objectFit:"cover",display:"block"}}/>
                        <div style={{position:"absolute",top:4,right:4,padding:"1px 5px",borderRadius:4,background:"rgba(0,0,0,.6)",color:"#fff",fontSize:7,fontWeight:700}}>{"\uD83D\uDD0D Expand"}</div>
                        <div style={{padding:"4px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:8,color:T.txD,fontWeight:600}}>{di.route||"/"}</span>
                          <span style={{fontSize:9,fontWeight:900,color:mc,fontFamily:T.f}}>{di.matchPct+"%"}</span>
                        </div>
                      </div>
                    })}
                  </div>
                </div>}

                {/* ── QA Summary table ── */}
                {cd&&<div style={{borderRadius:8,border:"1px solid "+T.bdL,overflow:"hidden"}}>
                  <div style={{padding:"6px 10px",background:T.cBg,borderBottom:"1px solid "+T.bdL,fontSize:9,fontWeight:700,color:T.nv}}>{"QA Scoring Summary"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:0}}>
                    {[
                      {l:"Visual",v:cd.visualScore,w:"40%"},
                      {l:"DOM",v:cd.domSimilarity,w:"25%"},
                      {l:"Functional",v:cd.functionalScore,w:"20%"},
                      {l:"Perf",v:cd.perfDelta?cd.perfDelta.score:null,w:"10%"},
                      {l:"A11y",v:cd.a11yDelta?cd.a11yDelta.score:null,w:"5%"}
                    ].map(function(m,i){
                      var val=m.v!=null?m.v:0;
                      var clr=val>=80?T.g:val>=60?T.y:T.r;
                      return <div key={i} style={{padding:"8px 4px",textAlign:"center",borderRight:i<4?"1px solid "+T.bdL:"none"}}>
                        <div style={{fontSize:7,color:T.txD,fontWeight:600}}>{m.l}</div>
                        <div style={{fontSize:14,fontWeight:900,fontFamily:T.f,color:clr}}>{val!=null?val:"--"}</div>
                        <div style={{marginTop:3,height:3,borderRadius:2,background:T.bdL,overflow:"hidden",margin:"0 4px"}}><div style={{width:val+"%",height:"100%",borderRadius:2,background:clr}}/></div>
                        <div style={{fontSize:6,color:T.txD,marginTop:2}}>{m.w}</div>
                      </div>
                    })}
                  </div>
                  {cd.compositeScore!=null&&<div style={{padding:"6px 10px",borderTop:"1px solid "+T.bdL,background:cd.compositeScore>=80?T.okBg:cd.compositeScore>=60?T.warnBg:T.errBg,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:9,fontWeight:700,color:T.nv}}>{"Composite Score"}</span>
                    <span style={{fontSize:14,fontWeight:900,fontFamily:T.f,color:cd.compositeScore>=80?T.g:cd.compositeScore>=60?T.y:T.r}}>{cd.compositeScore+"/100"}</span>
                  </div>}
                  {vd&&<div style={{padding:"4px 10px",borderTop:"1px solid "+T.bdL,background:vd.overall==="PASS"?T.okBg:vd.overall==="WARN"?T.warnBg:T.errBg}}>
                    <div style={{fontSize:8,fontWeight:700,color:vd.overall==="PASS"?T.g:vd.overall==="WARN"?T.y:T.r}}>{vd.overall+" \u2014 "+vd.notes}</div>
                    {vd.regressionAreas&&vd.regressionAreas.length>0&&<div style={{fontSize:7,color:T.txM,marginTop:1}}>{"Regressions: "+vd.regressionAreas.join(", ")}</div>}
                  </div>}
                </div>}
              </div>
            </div>
            </React.Fragment>
          })()}

          {/* ═══ FILE QUEUE — Detailed file status with expandable change preview ═══ */}
          <div style={S.card}>
            <div style={Object.assign({},S.cH,{padding:"8px 14px"})}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontWeight:700,fontSize:11,color:T.nv}}>{"📁 "+t.mgQueue}</span>
                {doneFiles.length>0&&<span style={{padding:"1px 7px",borderRadius:10,fontSize:8,fontWeight:700,background:T.okBg,color:T.g}}>{doneFiles.length+" ✓"}</span>}
                {activeFile&&<span style={{padding:"1px 7px",borderRadius:10,fontSize:8,fontWeight:700,background:T.blP,color:T.bl}}>{"1 ⟳"}</span>}
                {pendingCount>0&&<span style={{padding:"1px 7px",borderRadius:10,fontSize:8,fontWeight:700,background:T.cBg,color:T.txD}}>{pendingCount+" ○"}</span>}
              </div>
              <div style={{width:80,height:5,borderRadius:3,background:T.bdL,overflow:"hidden"}}>
                <div style={{width:Math.round((doneFiles.length/Math.max(fc,1))*100)+"%",height:"100%",background:T.g,borderRadius:3,transition:"width .5s"}}/>
              </div>
            </div>
            <div style={{maxHeight:280,overflowY:"auto"}}>
              {files.map(function(f,fi){
                var fLog=fileLogs.find(function(l){return l.file===f.name});
                var isDone=fLog&&fLog.st==="done";
                var isQA=fLog&&(fLog.st==="qa-validating"||fLog.st==="qa-passed"||fLog.st==="qa-failed"||fLog.st==="re-migrating");
                var isActive=fLog&&fLog.st!=="done"&&fLog;
                var isPending=!fLog;
                var dur=isDone&&fLog.durationMs?fmtMs(fLog.durationMs):"";
                var tgtName=fLog&&fLog.targetFile&&fLog.targetFile!==f.name?fLog.targetFile:null;
                var lc=f.content?f.content.split("\n").length:0;
                var langDef=f.lang?LANGS[f.lang]:null;
                var tgtLangDef=tL?LANGS[tL]:null;
                var hasPreview=isDone&&fLog.preview&&fLog.preview.length>0;
                var qaStColor=fLog&&fLog.st==="qa-validating"?"#6366f1":fLog&&fLog.st==="qa-passed"?"#10b981":fLog&&(fLog.st==="qa-failed"||fLog.st==="re-migrating")?"#f59e0b":null;
                return <div key={fi}>
                  <div style={{padding:"5px 14px",borderBottom:hasPreview?"none":"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:8,background:isActive?T.blM:isDone?T.okBg+"40":"transparent",transition:"background .3s"}}>
                    {/* Status node */}
                    <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"2px solid "+(isDone?T.g:isActive?T.bl:T.bdL),background:isDone?T.g:isActive?"transparent":"transparent",fontSize:8,fontWeight:800,color:isDone?"#fff":isActive?T.bl:T.txD,transition:"all .3s"}}>
                      {isDone?"✓":isActive?"⟳":(fi+1)}
                    </div>
                    {/* File info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {langDef&&<span style={{fontSize:9}}>{langDef.i}</span>}
                        <span style={{fontFamily:T.f,fontSize:9,fontWeight:isDone?600:isActive?700:400,color:isDone?T.nv:isActive?T.nv:T.txD,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.path||f.name}</span>
                        {tgtName&&tgtLangDef&&<span style={{fontSize:7,color:T.bl}}>{"→ "+tgtLangDef.i+" "+tgtName}</span>}
                      </div>
                      {isPending&&<div style={{fontSize:7,color:T.txD,fontStyle:"italic"}}>{t.mgPending+" · "+lc+" "+t.lines}</div>}
                      {isQA&&<div style={{fontSize:7,fontWeight:700,color:qaStColor,display:"flex",alignItems:"center",gap:3}}>
                        {fLog.st==="qa-validating"&&<span>{"QA validando..."}</span>}
                        {fLog.st==="qa-passed"&&<span>{"QA aprobado ("+(fLog.qaScore||0)+"/100)"}</span>}
                        {fLog.st==="qa-failed"&&<span>{"QA: "+(fLog.qaIssues||0)+" issues encontrados"}</span>}
                        {fLog.st==="re-migrating"&&<span>{"Re-migrando con feedback QA..."}</span>}
                      </div>}
                    </div>
                    {/* Right metrics */}
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      {isDone&&fLog.planComplexity&&<span title={fLog.capacity?"Plan: "+fLog.capacity.planTokens+"tk, Migrate: "+fLog.capacity.migTokens+"tk"+(fLog.capacity.promoted?" (promoted from "+fLog.capacity.label.replace(fLog.capacity.label,"tier "+fLog.capacity.originalTier+"→"+fLog.capacity.tier)+")":" (tier "+fLog.capacity.tier+")")+(fLog.capacity.multipliers?", combined: x"+fLog.capacity.multipliers.combined.toFixed(2):""):""} style={{fontSize:6,padding:"1px 4px",borderRadius:3,fontWeight:700,background:fLog.planComplexity==="complex"?"#fef2f2":fLog.planComplexity==="moderate"?"#fffbeb":"#f0fdf4",color:fLog.planComplexity==="complex"?T.r:fLog.planComplexity==="moderate"?T.y:T.g}}>{(fLog.capacity&&fLog.capacity.promoted?"↑ ":"")+fLog.planComplexity+(fLog.capacity?" "+Math.round(fLog.capacity.migTokens/1000)+"k":"")}</span>}
                      {isDone&&fLog.linesOrig&&<span style={{fontSize:7,color:T.txD,fontFamily:T.f}}>{fLog.linesOrig+"→"+fLog.linesMig+" ln"}</span>}
                      {isDone&&<span style={{fontSize:8,color:T.txM}}>{(fLog.ch||0)+" "+t.changes}</span>}
                      {isDone&&dur&&<span style={{fontFamily:T.f,fontSize:8,fontWeight:700,color:T.g,padding:"1px 6px",borderRadius:4,background:T.okBg}}>{dur}</span>}
                      {isDone&&fLog.tkI&&<span style={{fontSize:6,color:T.txD,fontFamily:T.f}}>{Math.round((fLog.tkI+fLog.tkO)/1000)+"k tk"}</span>}
                      {isActive&&<span style={{fontFamily:T.f,fontSize:9,fontWeight:700,color:T.bl}}>{fmtMs(now-(isActive.ts||now))}</span>}
                      {isActive&&<div style={{width:20,height:3,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:"60%",height:"100%",background:T.bl,borderRadius:2,animation:"pulse 1.5s infinite"}}/></div>}
                    </div>
                  </div>
                  {/* ── Change Preview (inline, always visible for done files) ── */}
                  {hasPreview&&<div style={{padding:"3px 14px 5px 42px",borderBottom:"1px solid "+T.bdL,background:T.cBg}}>
                    {fLog.preview.map(function(ch,ci){
                      return <div key={ci} style={{fontSize:8,color:T.txM,fontFamily:T.f,lineHeight:1.4,display:"flex",gap:4}}>
                        <span style={{color:T.g,flexShrink:0}}>{"+"}</span>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch}</span>
                      </div>
                    })}
                  </div>}
                </div>
              })}
            </div>
            {avgFileMs>0&&<div style={{padding:"4px 14px",borderTop:"1px solid "+T.bdL,background:T.cBg,display:"flex",justifyContent:"space-between",fontSize:8,color:T.txD}}>
              <span>{"⌀ "+fmtMs(avgFileMs)+" / "+t.files}</span>
              {linesProc>0&&<span>{linesProc.toLocaleString()+" "+t.mgLinesProcessed}</span>}
            </div>}
          </div>

          {/* ═══ REPORT CARD — Auto-generated when pipeline finishes (no extra API call) ═══ */}
          {migPhase==="done"&&(function(){
            var finalPhLog=phaseLogs.find(function(l){return l.phase==="integration"&&(l.st==="done"||l.st==="fixed")});
            var finalScore=finalPhLog&&finalPhLog.score!==undefined?finalPhLog.score:null;
            var totalIter=phaseLogs.filter(function(l){return l.phase==="qa"}).length;
            var fixCount=phaseLogs.filter(function(l){return l.phase==="qa"&&l.st==="done"}).length;
            var stallLog=phaseLogs.find(function(l){return l.phase==="stall"});
            var cancelLog=phaseLogs.find(function(l){return l.phase==="cancelled"});
            var costUsd=mlObj?((_tks.i*(mlObj.pi||0)+_tks.o*(mlObj.po||0))/1000000):0;
            var costStr=costUsd>0?(costUsd<0.01?"<$0.01":"$"+costUsd.toFixed(3)):"$0.00";
            // Grade: A(90+ with strict scoring ≈ old 95), B(80+), C(70+), D(50+), F(<50)
            var grade=finalScore===null?"?":(finalScore>=90?"A":finalScore>=80?"B":finalScore>=70?"C":finalScore>=50?"D":"F");
            var gradeClr=grade==="A"||grade==="B"?T.g:grade==="C"?T.y:T.r;
            var totalLines=doneFiles.reduce(function(s,l){return s+(l.linesMig||0)},0);
            return <div style={Object.assign({},S.card,{overflow:"hidden",border:"2px solid "+(finalScore>=95?T.g+"60":finalScore>=70?T.y+"60":T.r+"60")})}>
              {/* Header with grade */}
              <div style={{padding:"14px 20px",background:finalScore>=95?T.okBg:finalScore>=70?T.warnBg:T.errBg,display:"flex",alignItems:"center",gap:14,borderBottom:"1px solid "+T.bdL}}>
                <div style={{width:52,height:52,borderRadius:12,border:"3px solid "+gradeClr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:gradeClr,background:T.w}}>{grade}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:T.nv}}>{t.rcTitle}</div>
                  <div style={{fontSize:10,color:T.txM}}>
                    {(LANGS[sL]||{}).n+" "+sV+" → "+(LANGS[tL]||{}).n+" "+tV+" · "+fc+" "+t.files}
                    {sL!==tL&&<span style={{marginLeft:4,fontSize:8,fontWeight:700,color:T.y}}>{t.crossLang}</span>}
                  </div>
                </div>
                {finalScore!==null&&<div style={{textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:900,fontFamily:T.f,color:gradeClr}}>{finalScore}</div>
                  <div style={{fontSize:7,color:T.txD,fontWeight:600}}>{"/ 100"}</div>
                </div>}
              </div>
              {/* Key metrics grid */}
              <div style={{padding:"10px 20px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.rcTime}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:T.nv}}>{fmtMs(elapsed)}</div></div>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.rcIter}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:T.bl}}>{totalIter||1}</div></div>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.mgTokens}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:"#d97706"}}>{(_tks.i+_tks.o)>1000?Math.round((_tks.i+_tks.o)/1000)+"k":(_tks.i+_tks.o)}</div></div>
                <div><div style={{fontSize:7,color:T.txD,fontWeight:600,textTransform:"uppercase"}}>{t.mgCost}</div><div style={{fontSize:13,fontWeight:900,fontFamily:T.f,color:"#dc2626"}}>{costStr}</div></div>
              </div>
              {/* 8-layer quality breakdown (from integration check) */}
              {intR&&intR.ok&&intR.result.layers&&intR.result.layers.length>0&&<div style={{padding:"8px 20px 6px",borderTop:"1px solid "+T.bdL}}>
                <div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:6,textTransform:"uppercase"}}>{"Quality Layers"}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 12px"}}>
                  {intR.result.layers.map(function(ly,i){
                    var sc=ly.score||0;
                    var clr=sc>=90?T.g:sc>=70?T.y:T.r;
                    return <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:clr,flexShrink:0}}/>
                      <span style={{fontSize:7,fontWeight:600,color:T.tx,width:65,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ly.name}</span>
                      <div style={{flex:1,height:4,borderRadius:2,background:T.bdL,overflow:"hidden"}}><div style={{width:sc+"%",height:"100%",borderRadius:2,background:clr}}/></div>
                      <span style={{fontSize:7,fontWeight:800,fontFamily:T.f,color:clr,width:18,textAlign:"right"}}>{sc}</span>
                    </div>
                  })}
                </div>
                {intR.result.scoreBreakdown&&<div style={{marginTop:4,fontSize:7,fontFamily:T.f,color:T.txD,lineHeight:1.3}}>{"📐 "+intR.result.scoreBreakdown}</div>}
              </div>}
              {/* Pipeline summary — compact phase list */}
              <div style={{padding:"6px 20px 10px",borderTop:"1px solid "+T.bdL}}>
                <div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:4,textTransform:"uppercase"}}>{t.rcPipeline}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {phaseLogs.filter(function(l){return l.st==="done"||l.st==="checked"||l.st==="fixed"}).map(function(l,i){
                    var ph=phDefs.find(function(p){return p.k===l.phase})||{ic:"•",l:l.phase};
                    var bg=l.score!==undefined?(l.score>=95?T.okBg:l.score>=70?T.warnBg:T.errBg):T.cBg;
                    var clr=l.score!==undefined?(l.score>=95?T.g:l.score>=70?T.y:T.r):T.txM;
                    return <span key={i} style={{padding:"2px 8px",borderRadius:6,fontSize:7,fontWeight:700,background:bg,color:clr,display:"inline-flex",alignItems:"center",gap:3}}>
                      {ph.ic+" "+ph.l}{l.iter?" #"+l.iter:""}
                      {l.score!==undefined&&<span style={{fontFamily:T.f}}>{l.score}</span>}
                      {l.durationMs&&<span style={{fontFamily:T.f,opacity:.7}}>{fmtMs(l.durationMs)}</span>}
                    </span>
                  })}
                  {stallLog&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:7,fontWeight:700,background:T.warnBg,color:T.y}}>{"⏸ Stall "+stallLog.score+"/100"}</span>}
                  {cancelLog&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:7,fontWeight:700,background:T.errBg,color:T.r}}>{"✕ "+t.cancel}</span>}
                </div>
              </div>
              {/* File summary table */}
              <div style={{padding:"6px 20px 12px",borderTop:"1px solid "+T.bdL}}>
                <div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:4,textTransform:"uppercase"}}>{t.mgFiles+" ("+doneFiles.length+")"}</div>
                {doneFiles.map(function(fl,i){
                  var origF=files.find(function(f){return f.name===fl.file});
                  return <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"2px 0",fontSize:8}}>
                    <span style={{color:T.g,fontSize:9}}>{"✓"}</span>
                    <span style={{fontFamily:T.f,fontWeight:600,color:T.nv,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fl.file}{fl.targetFile&&fl.targetFile!==fl.file?<span style={{color:T.bl}}>{" → "+fl.targetFile}</span>:null}</span>
                    {fl.linesOrig&&<span style={{color:T.txD,fontFamily:T.f,fontSize:7}}>{fl.linesOrig+"→"+fl.linesMig}</span>}
                    <span style={{color:T.txM}}>{(fl.ch||0)+" "+t.changes}</span>
                    {fl.durationMs&&<span style={{fontFamily:T.f,color:T.g,fontWeight:700}}>{fmtMs(fl.durationMs)}</span>}
                  </div>
                })}
                {totalLines>0&&<div style={{marginTop:4,fontSize:7,color:T.txD,textAlign:"right"}}>{totalLines.toLocaleString()+" "+t.mgLinesProcessed+" · "+_tks.calls+" API calls · "+costStr}</div>}
              </div>
              {/* Action button */}
              <div style={{padding:"8px 20px 12px",textAlign:"center"}}>
                <button onClick={function(){setVw("results");setActR(0);setShR(true)}} style={Object.assign({},S.btn("p"),{padding:"10px 24px",fontSize:12})}>{"→ "+t.results}</button>
              </div>
            </div>
          })()}

        </div>
        </div>
}
