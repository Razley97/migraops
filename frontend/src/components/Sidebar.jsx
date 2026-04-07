import { UILANGS } from "../config/languages.js";

export default function Sidebar(props) {
  var dark = props.dark;
  var sideCol = props.sideCol;
  var setSideCol = props.setSideCol;
  var vw = props.vw;
  var setVw = props.setVw;
  var T = props.T;
  var t = props.t;
  var SII_LOGO = props.SII_LOGO;
  var userName = props.userName;
  var resCount = props.resCount;
  var filesCount = props.filesCount;
  var uiL = props.uiL;
  var changeUiL = props.changeUiL;
  var toggleDark = props.toggleDark;
  var setShCfg = props.setShCfg;

  return (
    <div style={{width:sideCol?56:220,minWidth:sideCol?56:220,background:dark?"rgba(12,20,36,.75)":"rgba(255,255,255,.7)",borderRight:"1px solid "+(dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"),backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",display:"flex",flexDirection:"column",transition:"width .25s,min-width .25s",overflow:"hidden",flexShrink:0}}>
      <div style={{padding:sideCol?"14px":"14px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,.06)",height:52,boxSizing:"border-box"}}>
        <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#2563EB,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:12,fontWeight:900}}>{"M"}</span></div>
        {!sideCol&&<span style={{fontSize:14,fontWeight:800,color:dark?"#fff":"#1E293B",whiteSpace:"nowrap"}}>{"MigraOps"}</span>}{!sideCol&&<img src={SII_LOGO} style={{height:16,opacity:dark?.35:.5,marginLeft:"auto"}} alt=""/>}
      </div>
      <div style={{padding:8,flex:1}}>
        <button onClick={function(){setVw("dashboard")}} className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="dashboard"?"3px solid #60A5FA":"3px solid transparent",background:vw==="dashboard"?"rgba(37,99,235,.15)":"transparent",marginBottom:2}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="dashboard"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="dashboard"?700:500,color:vw==="dashboard"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideDash}</span>}</button>
        <button onClick={function(){setVw("upload")}} className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="upload"||vw==="configure"||vw==="migrating"?"3px solid #60A5FA":"3px solid transparent",background:vw==="upload"||vw==="configure"||vw==="migrating"?"rgba(37,99,235,.15)":"transparent",marginBottom:2}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="upload"||vw==="configure"||vw==="migrating"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M12 4v16M4 12h16"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="upload"||vw==="configure"?700:500,color:vw==="upload"||vw==="configure"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideNew}</span>}</button>
        <button onClick={function(){if(resCount>0)setVw("results")}} style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:resCount>0?"pointer":"default",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="results"?"3px solid #60A5FA":"3px solid transparent",background:vw==="results"?"rgba(37,99,235,.15)":"transparent",marginBottom:2,opacity:resCount>0?1:.35}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="results"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M4 12l5 5L20 7"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="results"?700:500,color:vw==="results"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideResults}</span>}{!sideCol&&resCount>0&&<span style={{marginLeft:"auto",padding:"1px 6px",borderRadius:8,fontSize:8,fontWeight:700,background:T.bl,color:"#fff",minWidth:16,textAlign:"center"}}>{resCount}</span>}</button>
        <button onClick={function(){setVw("history")}} className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="history"?"3px solid #60A5FA":"3px solid transparent",background:vw==="history"?"rgba(37,99,235,.15)":"transparent",marginBottom:2}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="history"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="history"?700:500,color:vw==="history"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{t.sideHist}</span>}</button>
        <button onClick={function(){if(filesCount>0)setVw("chat")}} style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:filesCount>0?"pointer":"default",display:"flex",alignItems:"center",gap:10,borderLeft:vw==="chat"?"3px solid #60A5FA":"3px solid transparent",background:vw==="chat"?"rgba(37,99,235,.15)":"transparent",marginBottom:2,opacity:filesCount>0?1:.35}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={vw==="chat"?"#60A5FA":(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>{!sideCol&&<span style={{fontSize:12,fontWeight:vw==="chat"?700:500,color:vw==="chat"?(dark?"#fff":T.nv):(dark?"rgba(255,255,255,.55)":T.txM)}}>{"Chat IA"}</span>}</button>
        <button onClick={function(){setVw("graph")}} className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",border:"none",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:vw==="graph"?T.selBg:"transparent",color:dark?"#fff":T.nv,fontSize:sideCol?13:11,fontWeight:vw==="graph"?700:500,fontFamily:T.ui,borderLeft:vw==="graph"?"3px solid "+T.bl:"3px solid transparent"}}><svg width={sideCol?18:14} height={sideCol?18:14} viewBox="0 0 24 24" fill="none" stroke={vw==="graph"?T.bl:(dark?"rgba(255,255,255,.4)":T.txD)} strokeWidth="1.8"><circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="12" cy="19" r="3"/><line x1="7.5" y1="6.5" x2="10" y2="17"/><line x1="16.5" y1="6.5" x2="14" y2="17"/><line x1="8" y1="5" x2="16" y2="5"/></svg>{!sideCol&&<span style={{fontFamily:T.ui}}>{"Grafo"}</span>}</button>
        <div style={{borderTop:"1px solid rgba(255,255,255,.06)",margin:"8px 0"}}/>
        <button onClick={function(){setShCfg(true)}} className="hv-glow" style={{width:"100%",padding:sideCol?"8px":"7px 10px",borderRadius:8,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,background:"transparent"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dark?"rgba(255,255,255,.4)":"#94A3B8"} strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10-2.8l-2.8 2.8M1 12h4m14 0h4"/></svg>{!sideCol&&<span style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>{t.sideCfg}</span>}</button>
      </div>
      <div style={{borderTop:"1px solid "+(dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.08)"),padding:sideCol?"10px":"12px 14px"}}>
        {!sideCol&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:28,height:28,borderRadius:8,background:"#334155",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{userName?userName[0].toUpperCase():"U"}</div><div><div style={{fontSize:11,fontWeight:700,color:dark?"#fff":"#1E293B"}}>{userName}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>{"SII Group"}</div></div></div>}
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {UILANGS.map(function(lg){return <button key={lg.code} onClick={function(){changeUiL(lg.code)}} style={{padding:"2px 5px",borderRadius:4,border:uiL===lg.code?"1px solid rgba(96,165,250,.5)":"1px solid transparent",background:uiL===lg.code?"rgba(96,165,250,.1)":"transparent",cursor:"pointer",fontSize:10}}>{lg.flag}</button>})}
          <button onClick={toggleDark} style={{padding:"2px 5px",borderRadius:4,border:"none",background:"transparent",cursor:"pointer",fontSize:10}}>{dark?"Light":"Dark"}</button>
          <button onClick={function(){setSideCol(function(v){return !v})}} style={{padding:"2px 5px",borderRadius:4,border:"none",background:"transparent",cursor:"pointer",fontSize:10,marginLeft:"auto",color:dark?"rgba(255,255,255,.3)":"#475569"}}>{sideCol?"›":"◂"}</button>
        </div>
      </div>
    </div>
  );
}
