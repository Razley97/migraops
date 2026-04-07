import { LANGS, LANG_META } from "../config/languages.js";

export default function UploadView(props) {
  var T = props.T;
  var t = props.t;
  var S = props.S;
  var isMobile = props.isMobile;
  var files = props.files;
  var setFiles = props.setFiles;
  var sL = props.sL;
  var setSL = props.setSL;
  var sV = props.sV;
  var setSV = props.setSV;
  var det = props.det;
  var setDet = props.setDet;
  var selF = props.selF;
  var setSelF = props.setSelF;
  var drg = props.drg;
  var setDrg = props.setDrg;
  var fr = props.fr;
  var man = props.man;
  var setMan = props.setMan;
  var hovLang = props.hovLang;
  var setHovLang = props.setHovLang;
  var setHovLangPos = props.setHovLangPos;
  var addF = props.addF;
  var loadProj = props.loadProj;
  var setVw = props.setVw;
  var shTP = props.shTP;
  var setShTP = props.setShTP;
  var prevProj = props.prevProj;
  var setPrevProj = props.setPrevProj;
  var setGhPanel = props.setGhPanel;
  var PROJECTS = props.PROJECTS;
  var dark = props.dark;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Hero drop zone */}
      <div onDragOver={function(e){e.preventDefault();setDrg(true)}} onDragLeave={function(){setDrg(false)}} onDrop={function(e){e.preventDefault();setDrg(false);if(e.dataTransfer.files.length)addF(e.dataTransfer.files)}} onClick={function(){if(fr.current)fr.current.click()}} style={{position:"relative",borderRadius:16,cursor:"pointer",overflow:"hidden",background:drg?"linear-gradient(135deg,#dbeafe,#ede9fe)":T.w,border:"1.5px dashed "+(drg?T.bl:T.bd),padding:files.length>0?"24px 24px 18px":"40px 24px 32px",textAlign:"center",transition:"all .25s ease"}}>
        <input ref={fr} type="file" multiple accept=".py,.js,.mjs,.ts,.tsx,.java,.cs,.go,.rs,.php,.rb,.kt,.kts,.zip" style={{display:"none"}} onChange={function(e){addF(e.target.files)}}/>
        <div style={{position:"absolute",top:0,left:0,width:32,height:32,borderTop:"3px solid "+T.bl,borderLeft:"3px solid "+T.bl,borderRadius:"16px 0 0 0",opacity:drg?1:.3,transition:"opacity .2s"}}/>
        <div style={{position:"absolute",top:0,right:0,width:32,height:32,borderTop:"3px solid "+T.bl,borderRight:"3px solid "+T.bl,borderRadius:"0 16px 0 0",opacity:drg?1:.3,transition:"opacity .2s"}}/>
        <div style={{position:"absolute",bottom:0,left:0,width:32,height:32,borderBottom:"3px solid "+T.bl,borderLeft:"3px solid "+T.bl,borderRadius:"0 0 0 16px",opacity:drg?1:.3,transition:"opacity .2s"}}/>
        <div style={{position:"absolute",bottom:0,right:0,width:32,height:32,borderBottom:"3px solid "+T.bl,borderRight:"3px solid "+T.bl,borderRadius:"0 0 16px 0",opacity:drg?1:.3,transition:"opacity .2s"}}/>

        {files.length===0 ? <div>
          <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div style={{fontSize:18,fontWeight:800,color:T.nv,marginBottom:4,letterSpacing:"-.02em"}}>{t.dropTitle}</div>
          <div style={{fontSize:12,color:T.txM}}>{t.orBrowse}</div>
          <div style={{marginTop:14,display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
            {Object.keys(LANGS).map(function(k){var meta=LANG_META[k];return <div key={k} style={{position:"relative",display:"inline-block"}} onMouseEnter={function(e){var r=e.currentTarget.getBoundingClientRect();setHovLangPos({x:r.left+r.width/2,y:r.bottom+8});setHovLang(k)}} onMouseLeave={function(){setHovLang(null)}}>
                <span style={{padding:"5px 12px",borderRadius:20,fontSize:10,fontWeight:600,background:hovLang===k?LANGS[k].c+"20":LANGS[k].c+"10",color:LANGS[k].c,border:"1.5px solid "+(hovLang===k?LANGS[k].c+"50":LANGS[k].c+"20"),cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,transition:"all .2s ease",transform:hovLang===k?"translateY(-2px)":"none",boxShadow:hovLang===k?"0 4px 12px "+LANGS[k].c+"20":"none"}}>{LANGS[k].i+" "+LANGS[k].n}</span>
              </div>})}
          </div>
        </div> : <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:2}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.bl} strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span style={{fontSize:11,fontWeight:600,color:T.bl}}>{t.orBrowse}</span>
          </div>
        </div>}
      </div>

      {/* GitHub Import */}
      <button onClick={function(){setGhPanel(true)}} style={{width:"100%",padding:"14px 20px",borderRadius:14,border:"1.5px solid "+(dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"),background:dark?"rgba(255,255,255,.03)":"#FAFBFC",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .2s",fontFamily:T.ui}}>
        <div style={{width:36,height:36,borderRadius:10,background:dark?"#161B22":"#24292f",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="20" height="20" viewBox="0 0 16 16" fill={dark?"#fff":"#fff"}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        </div>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontSize:13,fontWeight:700,color:dark?"#fff":T.nv}}>{t.ghRepoL||"GitHub Repository"}</div>
          <div style={{fontSize:10,color:T.txD}}>{t.ghRepoDesc||"Import files directly from any repo"}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.txD} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Loaded files */}
      {files.length>0 && <div style={{display:"flex",flexDirection:"column",gap:12}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 2px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:24,fontWeight:900,fontFamily:T.f,color:T.nv}}>{files.length}</span>
              <span style={{fontSize:11,fontWeight:600,color:T.txM}}>{t.filesSel}</span>
            </div>
            <span style={{width:1,height:16,background:T.bdL}}/>
            <span style={{fontSize:10,color:T.txD,fontFamily:T.f}}>{files.reduce(function(s,f){return s+f.content.split("\n").length},0)+" "+t.linesCode}</span>
          </div>
          <button onClick={function(){setFiles([]);setSL("");setDet(null);setSelF(null)}} style={Object.assign({},S.btn(),{padding:"4px 12px",fontSize:9})}>{"✕ "+t.clean}</button>
        </div>

        <div style={Object.assign({},S.card,{overflow:"hidden"})}>
          <div style={{maxHeight:220,overflowY:"auto"}}>
            {files.map(function(f,i){
              var lc=f.content.split("\n").length;
              return <div key={i} onClick={function(){setSelF(selF===i?null:i)}} style={{padding:"8px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid "+T.bdL,cursor:"pointer",background:selF===i?T.blM:"transparent",transition:"background .15s"}}>
                <span style={{width:8,height:8,borderRadius:2,background:f.lang?(LANGS[f.lang].c||T.txD):T.txD,flexShrink:0}}/>
                <span style={{fontFamily:T.f,fontSize:10,fontWeight:600,color:T.tx,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.path||f.name}</span>
                {f.project&&<span style={{fontSize:7,padding:"2px 6px",borderRadius:4,background:T.blP,color:T.bl,fontWeight:700,flexShrink:0}}>{f.project}</span>}
                <span style={{fontSize:9,color:T.txD,fontFamily:T.f,flexShrink:0}}>{lc+" ln"}</span>
                <span style={{fontSize:9,fontWeight:700,color:(LANGS[f.lang]||{}).c||T.txD,flexShrink:0}}>{f.langN}</span>
              </div>
            })}
          </div>
          {selF!==null&&files[selF]&&<pre style={{padding:12,margin:0,maxHeight:150,overflowY:"auto",fontFamily:T.f,fontSize:10,lineHeight:1.6,color:T.txM,background:"#0f172a",borderTop:"1px solid "+T.bdL,whiteSpace:"pre-wrap"}}><code style={{color:"#e2e8f0"}}>{files[selF].content.slice(0,2000)}</code></pre>}
        </div>

        {det&&sL&&<div style={{borderRadius:12,overflow:"hidden",border:"1px solid "+(det.c>=70?"#a7f3d0":"#fde68a")}}>
          <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",background:det.c>=70?"#f0fdf420":"#fffbeb40"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:(LANGS[sL]||{}).c+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{(LANGS[sL]||{}).i}</div>
              <div>
                <div style={{fontSize:13,fontWeight:800,color:T.nv}}>{(LANGS[sL]||{}).n+" "}<span style={{color:T.bl,fontFamily:T.f}}>{sV}</span></div>
                <div style={{fontSize:9,color:T.txM,fontWeight:500}}>{det.c>=70?"\u2713 "+t.detected+" ("+det.c+"%)":""+t.lowConf+" ("+det.c+"%)"}</div>
              </div>
            </div>
            <button onClick={function(){setMan(!man)}} style={Object.assign({},S.btn(),{padding:"4px 10px",fontSize:9})}>{man?t.auto:"Edit"}</button>
          </div>
          {det.s.length>0&&<div style={{padding:"5px 16px 8px",display:"flex",flexWrap:"wrap",gap:3,background:"transparent"}}>{det.s.slice(0,6).map(function(s,i){return <span key={i} style={{padding:"2px 6px",borderRadius:4,fontSize:8,background:T.cBg,color:T.txM,border:"1px solid "+T.bdL,fontFamily:T.f}}>{s.i+" "+s.t}</span>})}</div>}
          {man&&<div style={{padding:12,display:"flex",gap:10,background:T.blM,borderTop:"1px solid "+T.bdL}}>
            <select value={sL} onChange={function(e){setSL(e.target.value);setDet(null)}} style={Object.assign({},S.sel,{width:130})}>{Object.keys(LANGS).map(function(k){return <option key={k} value={k}>{LANGS[k].n}</option>})}</select>
            <select value={sV} onChange={function(e){setSV(e.target.value)}} style={Object.assign({},S.sel,{width:130})}>{(LANGS[sL]||{v:[]}).v.map(function(v){return <option key={v} value={v}>{v}</option>})}</select>
          </div>}
        </div>}

        <button onClick={function(){setVw("configure")}} style={{width:"100%",padding:"14px 24px",borderRadius:12,border:"none",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:T.ui,background:"linear-gradient(135deg,"+T.nv+","+T.bl+")",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,letterSpacing:"-.01em",boxShadow:"0 4px 14px rgba(10,36,99,.25)"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          {t.readyCfg+" \u2192"}
        </button>
      </div>}

      {/* Sample projects */}
      <div style={{borderRadius:12,border:"1px solid "+T.bdL,overflow:"hidden",background:T.w}}>
        <div onClick={function(){setShTP(!shTP)}} style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:T.cBg}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:13}}>{shTP?"\u25be":"\u203a"}</span>
            <span style={{fontSize:11,fontWeight:700,color:T.txM}}>{t.samples}</span>
            <span style={{fontSize:9,color:T.txD}}>{"— "+t.samplesDesc}</span>
          </div>
          <span style={{fontSize:9,color:T.txD,fontFamily:T.f}}>{PROJECTS.length+" projects"}</span>
        </div>
        {shTP&&<div style={{padding:12,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:8}}>
          {PROJECTS.map(function(p){
            var ld=files.some(function(f){return f.project===p.name});
            return <div key={p.id} style={{borderRadius:12,border:"1px solid "+(ld?T.okBd:prevProj===p.id?T.bl+"40":T.bdL),background:ld?T.okBg:T.w,overflow:"hidden",transition:"all .3s ease",boxShadow:prevProj===p.id?"0 4px 16px rgba(37,99,235,.08)":"none"}}>
              <div onClick={function(){if(ld)return;if(prevProj===p.id){setPrevProj(null)}else{setPrevProj(p.id)}}} style={{padding:10,display:"flex",alignItems:"center",gap:10,cursor:ld?"default":"pointer"}}>
              <span style={{fontSize:20,flexShrink:0}}>{p.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:T.nv,marginBottom:2}}>{p.name}</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  <span style={{padding:"1px 5px",borderRadius:4,fontSize:8,fontWeight:700,background:((LANGS[p.lang]||{}).c||"#999")+"15",color:(LANGS[p.lang]||{}).c||"#999"}}>{(LANGS[p.lang]||{}).n||p.lang}</span>
                  <span style={{fontSize:8,color:T.txD}}>{p.files.length+" files"}</span>
                  {p.suggest&&<span style={{padding:"1px 5px",borderRadius:4,fontSize:7,fontWeight:700,background:T.blP,color:T.bl}}>{"\u2192 "+p.suggest.to}</span>}
                </div>
              </div>
              {ld?<span style={{color:T.g,fontSize:14,flexShrink:0}}>{"\u2713"}</span>:<span style={{color:prevProj===p.id?T.bl:T.txD,fontSize:12,fontWeight:700,transition:"transform .25s ease",display:"inline-block",transform:prevProj===p.id?"rotate(45deg)":"none"}}>{"+"}</span>}
              </div>
              {prevProj===p.id&&!ld&&<div style={{borderTop:"1px solid "+T.bdL,padding:"10px 12px",background:T.cBg,animation:"fadeIn .25s ease"}}>
                <div style={{marginBottom:8}}>{p.files.map(function(f,fi){return <div key={fi} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:fi<p.files.length-1?"1px solid "+T.bdL:"none"}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:(LANGS[p.lang]||{}).c||T.bl,flexShrink:0}}/>
                  <span style={{fontSize:9,fontFamily:T.f,color:T.txM,flex:1}}>{f.name}</span>
                  <span style={{fontSize:8,color:T.txD}}>{f.content?f.content.split("\n").length+" ln":""}</span>
                </div>})}</div>
                <button onClick={function(e){e.stopPropagation();loadProj(p);setPrevProj(null)}} style={{width:"100%",padding:"8px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+T.gradA+","+T.gradB+")",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:T.ui,boxShadow:"0 2px 8px "+T.bl+"30"}}>{"Cargar "+p.files.length+" archivos"}</button>
              </div>}
            </div>})}
        </div>}
      </div>

    </div>
  );
}
