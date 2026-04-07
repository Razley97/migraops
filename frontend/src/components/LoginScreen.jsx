export default function LoginScreen(props) {
  var dark = props.dark;
  var isMobile = props.isMobile;
  var APP = props.APP;
  var SII_LOGO_LG = props.SII_LOGO_LG;
  var t = props.t;
  var loginInput = props.loginInput;
  var setLoginInput = props.setLoginInput;
  var onLogin = props.onLogin;

  return (
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",background:dark?"#0B1120":"#F8FAFC",overflow:"hidden"}}>
      {/* Aurora mesh */}
      <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-15%",left:"-10%",width:"55vw",height:"55vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(99,102,241,.25) 0%,transparent 65%)":"radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 65%)",animation:"float2 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"-15%",right:"-10%",width:"50vw",height:"50vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(37,99,235,.22) 0%,transparent 65%)":"radial-gradient(circle,rgba(37,99,235,.12) 0%,transparent 65%)",animation:"float1 22s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:"25%",right:"5%",width:"35vw",height:"35vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(14,165,233,.15) 0%,transparent 65%)":"radial-gradient(circle,rgba(14,165,233,.08) 0%,transparent 65%)",animation:"float3 26s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"15%",left:"10%",width:"30vw",height:"30vw",borderRadius:"50%",background:dark?"radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 65%)":"radial-gradient(circle,rgba(139,92,246,.08) 0%,transparent 65%)",animation:"float1 20s ease-in-out infinite reverse"}}/>
        {/* Subtle grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient("+(dark?"rgba(255,255,255,.03)":"rgba(0,0,0,.03)")+" 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
        {/* Wire shapes */}
        <div style={{position:"absolute",top:"8%",left:"12%",width:120,height:120,borderRadius:24,border:"1px solid "+(dark?"rgba(255,255,255,.06)":"rgba(99,102,241,.1)"),animation:"float1 20s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"12%",right:"14%",width:80,height:80,borderRadius:"50%",border:"1px solid "+(dark?"rgba(255,255,255,.04)":"rgba(37,99,235,.08)"),animation:"float3 24s ease-in-out infinite reverse"}}/>
      </div>
      {/* Content */}
      <div style={{position:"relative",zIndex:1,width:400,maxWidth:"90vw",textAlign:"center",animation:"fadeIn .6s ease"}}>
        {/* Logo mark */}
        <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:52,height:52,borderRadius:15,background:dark?"rgba(99,102,241,.12)":"rgba(99,102,241,.08)",border:"1px solid "+(dark?"rgba(99,102,241,.2)":"rgba(99,102,241,.15)"),marginBottom:28}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dark?"#A5B4FC":"#6366F1"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/><path d="M14 4l-4 16"/></svg></div>
        {/* Brand */}
        <h1 className={dark?"gtd":"gtl"} style={{fontSize:isMobile?38:52,fontWeight:800,letterSpacing:"-.05em",lineHeight:1.1,margin:"0 0 8px",padding:"4px 0",color:dark?"#E0E7FF":"#4338CA"}}>{APP.n}</h1>
        {/* Tagline */}
        <p style={{fontSize:15,color:dark?"rgba(255,255,255,.35)":"#64748B",fontWeight:400,margin:"0 0 36px",letterSpacing:"-.01em"}}>{"Code intelligence platform"}</p>
        {/* Login card */}
        <div style={{background:dark?"rgba(255,255,255,.04)":"#fff",borderRadius:16,padding:"28px",border:"1px solid "+(dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)"),boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,.04),0 8px 30px rgba(0,0,0,.04)",textAlign:"left"}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:dark?"rgba(255,255,255,.4)":"#64748B",marginBottom:8,textTransform:"uppercase",letterSpacing:".04em"}}>{"Name"}</label>
          <input value={loginInput} onChange={function(e){setLoginInput(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter"&&loginInput.trim()){onLogin(loginInput.trim())}}} placeholder={t.loginName} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid "+(dark?"rgba(255,255,255,.08)":"#E2E8F0"),background:dark?"rgba(255,255,255,.03)":"#F8FAFC",color:dark?"#fff":"#1E293B",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"Outfit,sans-serif"}}/>
          <button onClick={function(){if(loginInput.trim()){onLogin(loginInput.trim())}}} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",marginTop:14,background:loginInput.trim()?(dark?"#6366F1":"#4338CA"):(dark?"rgba(255,255,255,.04)":"#F1F5F9"),color:loginInput.trim()?"#fff":(dark?"rgba(255,255,255,.15)":"#94A3B8"),fontSize:14,fontWeight:600,cursor:loginInput.trim()?"pointer":"default",fontFamily:"Outfit,sans-serif",transition:"all .25s",boxShadow:loginInput.trim()?"0 4px 14px "+(dark?"rgba(99,102,241,.3)":"rgba(67,56,202,.25)"):"none"}}>{t.loginBtn}</button>
        </div>
        {/* Tech badges */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginTop:24}}>
          {["Python","JavaScript","Java","TypeScript","Go","Rust"].map(function(lang,li){return <span key={li} style={{padding:"3px 9px",borderRadius:12,fontSize:9,fontWeight:500,background:dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.03)",color:dark?"rgba(255,255,255,.3)":"rgba(0,0,0,.3)",border:"1px solid "+(dark?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)")}}>{lang}</span>})}
        </div>
        {/* Footer */}
        <div style={{marginTop:28,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <img src={SII_LOGO_LG} style={{height:32,opacity:dark?.25:.5}} alt="SII Group Chile"/>
          <span style={{fontSize:10,color:dark?"rgba(255,255,255,.18)":"rgba(0,0,0,.2)",letterSpacing:".02em"}}>{"v"+APP.v}</span>
        </div>
      </div>
    </div>
  );
}
