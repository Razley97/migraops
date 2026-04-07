export default function DashboardView(props) {
  var T = props.T;
  var t = props.t;
  var S = props.S;
  var isMobile = props.isMobile;
  var userName = props.userName;
  var uiL = props.uiL;
  var hist = props.hist;
  var dashS = props.dashS;
  var setVw = props.setVw;

  var ScoreTrend = function(sp) {
    var data = sp.data || [];
    if (data.length < 2) return null;
    var items = data.slice(0, 12).reverse();
    return <div style={{padding:"12px 16px"}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:70}}>
        {items.map(function(h, i) {
          var sc = h.audit && h.audit.finalScore ? h.audit.finalScore : 0;
          var clr = sc >= 90 ? "#059669" : sc >= 70 ? "#D97706" : sc > 0 ? "#DC2626" : T.bdL;
          return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{width:"100%",background:clr,borderRadius:"3px 3px 0 0",height:Math.max(4,sc*0.65),transition:"height .3s",opacity:.85}}/>
            <span style={{fontSize:7,color:T.txD,fontFamily:T.f}}>{sc||"-"}</span>
          </div>
        })}
      </div>
    </div>;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .4s ease"}}>
      <div style={{marginBottom:4}}><h1 style={{fontSize:28,fontWeight:800,color:T.nv,letterSpacing:"-.03em",margin:0}}>{(function(){var h=new Date().getHours();return h<12?("Buenos d\u00edas, "):h<19?("Buenas tardes, "):("Buenas noches, ")})()+userName}</h1><p style={{fontSize:12,color:T.txD,margin:"4px 0 0"}}>{new Date().toLocaleDateString(uiL==="en"?"en-US":uiL==="pt"?"pt-BR":"es-CL",{weekday:"long",day:"numeric",month:"long"})+" \u00b7 "+(hist.length>0?hist.length+" migrations":"")}</p></div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        {[{l:t.dashTotalMig,v:dashS.mig,c:"#2563EB",d:"M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"},{l:t.dashAvgScore,v:dashS.score,c:"#059669",d:"M22 11.08V12a10 10 0 11-5.93-9.14"},{l:t.dashFilesProc,v:dashS.files,c:"#7C3AED",d:"M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7"},{l:"QA",v:dashS.tests,c:"#D97706",d:"M9 2h6l3 7H6L9 2zM6 9v11a2 2 0 002 2h8a2 2 0 002-2V9"}].map(function(st2,si4){return <div key={si4} className="hv-lift" style={{borderRadius:14,border:"1px solid "+T.bdL,background:T.w,overflow:"hidden"}}><div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}><div style={{width:42,height:42,borderRadius:11,background:st2.c+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={st2.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={st2.d}/></svg></div><div><div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{st2.l}</div><div style={{fontSize:26,fontWeight:800,color:T.nv,lineHeight:1,fontFamily:T.f,animation:"fadeIn .6s ease"}}>{st2.v}</div></div></div><div style={{height:3,background:"linear-gradient(90deg,"+st2.c+","+st2.c+"50)"}}/></div>})}
      </div>

      {hist.length>=2&&<div style={Object.assign({},S.card,{marginBottom:8})}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.scoreTrend}</span><span style={{fontSize:9,color:T.txD}}>{hist.length+" migrations"}</span></div><ScoreTrend data={hist}/></div>}
      <button onClick={function(){setVw("upload")}} style={Object.assign({},S.btn("p"),{padding:"12px 24px",fontSize:13,alignSelf:"flex-start"})}>{t.dashNewMig}</button>
      <div style={S.card}><div style={S.cH}><span style={{fontWeight:700,color:T.nv}}>{t.dashRecent}</span></div>
        {hist.length===0?<div style={{padding:32,textAlign:"center",color:T.txD,fontSize:13}}>{t.dashNoData}</div>
        :<div style={{maxHeight:250,overflow:"auto"}}>{hist.slice(0,8).map(function(h,i){var sc=h.audit&&h.audit.finalScore?h.audit.finalScore:null;var scClr=sc>=90?T.g:sc>=70?T.y:sc!==null?T.r:T.txD;return <div key={i} onClick={function(){setVw("history")}} style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid "+T.bdL,cursor:"pointer"}}><div><div style={{fontSize:12,fontWeight:700,color:T.tx}}>{h.from+" > "+h.to}</div><div style={{fontSize:10,color:T.txD}}>{h.date}</div></div>{sc!==null&&<div style={{fontSize:16,fontWeight:800,color:scClr}}>{sc}</div>}</div>})}</div>}
      </div>
    </div>
  );
}
