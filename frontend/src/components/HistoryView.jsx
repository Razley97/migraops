export default function HistoryView(props) {
  var T = props.T;
  var t = props.t;
  var S = props.S;
  var isMobile = props.isMobile;
  var hist = props.hist;
  var dashS = props.dashS;
  var histSearch = props.histSearch;
  var onHistSearch = props.onHistSearch;
  var histQ = props.histQ;
  var histSort = props.histSort;
  var setHistSort = props.setHistSort;
  var fmtMs = props.fmtMs;
  var dlF = props.dlF;
  var dlN = props.dlN;
  var setRes = props.setRes;
  var setRsk = props.setRsk;
  var setActR = props.setActR;
  var setShR = props.setShR;
  var setIntR = props.setIntR;
  var setAuditTrail = props.setAuditTrail;
  var setAudTab = props.setAudTab;
  var setAudExpand = props.setAudExpand;
  var setVw = props.setVw;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:18,fontWeight:800,color:T.nv,letterSpacing:"-.03em"}}>{t.history+" ("+hist.length+")"}</h2>
        {hist.length>0&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
          <input value={histSearch} onChange={function(e){onHistSearch(e.target.value)}} placeholder={"\ud83d\udd0d "+t.origin+", "+t.dest+", "+t.model+"..."} aria-label="Search history" style={Object.assign({},S.input,{width:isMobile?180:260,fontSize:11})}/>
          <div style={{display:"flex",gap:2,background:T.cBg,borderRadius:8,padding:2,border:"1px solid "+T.bdL}}>
            {[{k:"date",l:"\ud83d\udcc5"},{k:"score",l:"\ud83c\udfaf"},{k:"files",l:""}].map(function(sb){return <button key={sb.k} onClick={function(){setHistSort(sb.k)}} style={{padding:"4px 8px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,background:histSort===sb.k?T.bl:"transparent",color:histSort===sb.k?"#fff":T.txD,transition:"all .15s"}}>{sb.l}</button>})}
          </div>
        </div>}
      </div>
      {hist.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{padding:"8px 14px",borderRadius:8,background:T.blM,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18,fontWeight:800,color:T.bl}}>{hist.length}</span><span style={{fontSize:10,color:T.txD}}>{t.dashTotalMig}</span></div>
        <div style={{padding:"8px 14px",borderRadius:8,background:T.okBg,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18,fontWeight:800,color:T.g}}>{dashS.score}</span><span style={{fontSize:10,color:T.txD}}>{t.dashAvgScore}</span></div>
        <div style={{padding:"8px 14px",borderRadius:8,background:T.cBg,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18,fontWeight:800,color:T.tx}}>{dashS.files}</span><span style={{fontSize:10,color:T.txD}}>{t.dashFilesProc}</span></div>
      </div>}
      {(function(){
        var filtered=hist.filter(function(h){
          if (!histQ) return true;
          var q=histQ.toLowerCase();
          return (h.from+" "+h.to+" "+h.ml+" "+h.date).toLowerCase().indexOf(q)>=0;
        });
        if (hist.length===0) return <div style={Object.assign({},S.card,{padding:30,textAlign:"center"})}><p style={{color:T.txD,fontSize:12}}>{t.noHist}</p></div>;
        if (filtered.length===0) return <div style={Object.assign({},S.card,{padding:20,textAlign:"center"})}><p style={{color:T.txD,fontSize:12}}>{"Sin resultados para \""+histSearch+"\""}</p></div>;
        var sorted=filtered.slice().sort(function(a,b){if(histSort==="score"){var sa=a.audit&&a.audit.finalScore?a.audit.finalScore:0;var sb2=b.audit&&b.audit.finalScore?b.audit.finalScore:0;return sb2-sa}if(histSort==="files")return(b.fc||0)-(a.fc||0);return 0});return sorted.map(function(h){return <div key={h.id} style={Object.assign({},S.card,{animation:"fadeIn .3s ease"})}>
            <div style={{padding:"10px 16px",display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",flexDirection:isMobile?"column":"row",gap:8}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.nv}}>{h.from+" \u2192 "+h.to}</div>
                <div style={{fontSize:9,color:T.txD}}>{h.date+" \u00b7 "+h.fc+" arch. \u00b7 "+h.ml}</div>
                {h.audit&&h.audit.finalScore!=null&&<div style={{display:"flex",gap:4,marginTop:3}}>
                  <span style={{padding:"1px 6px",borderRadius:6,fontSize:9,fontWeight:800,background:h.audit.finalScore>=95?T.okBg:h.audit.finalScore>=70?T.warnBg:T.errBg,color:h.audit.finalScore>=95?T.g:h.audit.finalScore>=70?T.y:T.r}}>{h.audit.finalScore+"/100"}</span>
                  {h.visualQA&&<span style={{padding:"1px 6px",borderRadius:6,fontSize:9,fontWeight:800,background:h.visualQA.verdict.overall==="PASS"?T.okBg:h.visualQA.verdict.overall==="WARN"?T.warnBg:T.errBg,color:h.visualQA.verdict.overall==="PASS"?T.g:h.visualQA.verdict.overall==="WARN"?T.y:T.r}}>{"VQA: "+h.visualQA.verdict.overall}</span>}
                </div>}
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                {h.audit&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:T.blP,color:T.bl,fontFamily:T.f}}>{"\u23f1 "+fmtMs(h.audit.totalDurationMs)}</span>}
                {h.audit&&<span style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:700,background:T.cBg,color:T.txM,fontFamily:T.f}}>{h.audit.apiCalls+" API"}</span>}
                {h.audit&&<button onClick={function(){dlF(JSON.stringify(h.audit,null,2),"migraops_audit_"+h.audit.id+".json")}} style={Object.assign({},S.btn(),{padding:"3px 8px",fontSize:8})}>{"\ud83d\udccb JSON"}</button>}
                <button onClick={function(){h.results.forEach(function(r,i){setTimeout(function(){dlF(r.migrated,dlN(r.name,r.targetName))},i*300)})}} style={S.btn("g")}>{"\u2b07"}</button>
                <button onClick={function(){setRes(h.results);setRsk(h.risks);setActR(0);setShR(false);setIntR(h.integration||null);setAuditTrail(h.audit||null);setAudTab("pipeline");setAudExpand({});if(props.setVisualQA)props.setVisualQA(h.visualQA||null);if(props.setPwComparison)props.setPwComparison(null);setVw("results")}} style={S.btn()}>{t.view+" \u2192"}</button>
              </div>
            </div>
            {h.audit&&h.audit.phases&&<div style={{padding:"6px 16px 8px",borderTop:"1px solid "+T.bdL,background:T.cBg}}>
              <div style={{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"}}>
                {h.audit.phases.map(function(ph,i){
                  var colors={A:"#6366f1",B:"#2563EB",C1:"#059669",C2:"#059669",D1:"#d97706",D2:"#d97706"};
                  var clr=colors[ph.id]||(ph.id.startsWith("C")?T.g:ph.id.startsWith("D")?T.y:T.bl);
                  var pct=h.audit.totalDurationMs>0?Math.max(8,Math.round((ph.durationMs/h.audit.totalDurationMs)*100)):10;
                  return <div key={i} title={ph.name+": "+fmtMs(ph.durationMs)} style={{height:18,borderRadius:3,background:clr,flex:pct,display:"flex",alignItems:"center",justifyContent:"center",minWidth:28}}>
                    <span style={{fontSize:6,fontWeight:800,color:"#fff"}}>{ph.id+" "+fmtMs(ph.durationMs)}</span>
                  </div>
                })}
              </div>
            </div>}
          </div>});
      })()}
    </div>
  );
}
