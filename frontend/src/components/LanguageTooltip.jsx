import { LANGS, LANG_META } from "../config/languages.js";

export default function LanguageTooltip(props) {
  var hovLang = props.hovLang;
  var hovLangPos = props.hovLangPos;
  var setHovLang = props.setHovLang;
  var dark = props.dark;
  var T = props.T;
  var t = props.t;
  var setSL = props.setSL;
  var setTL = props.setTL;
  var setVw = props.setVw;
  var filesCount = props.filesCount;

  if (!hovLang || !LANG_META[hovLang]) return null;

  return (
    <div style={{position:"fixed",top:hovLangPos.y,left:hovLangPos.x,transform:"translateX(-50%)",width:280,borderRadius:14,background:dark?"#1A2236":"#fff",border:"1px solid "+(dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)"),boxShadow:"0 12px 40px rgba(0,0,0,"+(dark?".4":".15")+")",zIndex:99999,animation:"fadeIn .15s ease"}} onMouseLeave={function(){setHovLang(null)}}>
      <div style={{position:"absolute",top:-5,left:"50%",transform:"translateX(-50%) rotate(45deg)",width:10,height:10,background:dark?"#1A2236":"#fff",borderTop:"1px solid "+(dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)"),borderLeft:"1px solid "+(dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)")}}/>
      <div style={{padding:"12px 16px",background:(LANGS[hovLang]||{}).c+"10",borderBottom:"1px solid "+(dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.05)"),borderRadius:"14px 14px 0 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{(LANGS[hovLang]||{}).i}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:dark?"#fff":T.nv}}>{(LANGS[hovLang]||{}).n}</div><div style={{fontSize:9,color:T.txD}}>{LANG_META[hovLang].desc}</div></div>
        </div>
      </div>
      <div style={{padding:"10px 16px"}}>
        <div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{t.strengths2||"Strengths"}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{LANG_META[hovLang].strengths.map(function(s,si){return <span key={si} style={{padding:"2px 8px",borderRadius:6,fontSize:8,fontWeight:600,background:dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",color:T.txM}}>{s}</span>})}</div>
        <div style={{fontSize:8,fontWeight:700,color:T.txD,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{t.migrateTo2||"Migrate to"}</div>
        <div style={{display:"flex",gap:3}}>{LANG_META[hovLang].migrateTo.slice(0,4).map(function(tgt){var tl2=LANGS[tgt];return tl2?<div key={tgt} onClick={function(){setSL(hovLang);setTL(tgt);setHovLang(null);if(filesCount>0)setVw("configure")}} style={{flex:1,padding:"6px 4px",borderRadius:8,background:tl2.c+"08",border:"1px solid "+tl2.c+"15",textAlign:"center",cursor:"pointer"}}><div style={{fontSize:12}}>{tl2.i}</div><div style={{fontSize:7,fontWeight:700,color:tl2.c,marginTop:2}}>{tl2.n}</div></div>:null})}</div>
        <div style={{marginTop:8,fontSize:8,color:T.txD,textAlign:"center"}}>{LANG_META[hovLang].ecosystem}</div>
      </div>
    </div>
  );
}
