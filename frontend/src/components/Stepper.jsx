export default function Stepper(props) {
  var vw = props.vw;
  var T = props.T;
  var t = props.t;
  var isMobile = props.isMobile;

  var steps = [{k:"upload",n:"1",l:t.step1},{k:"configure",n:"2",l:t.step2},{k:"migrating",n:"3",l:t.step3},{k:"results",n:"4",l:t.step4}];
  var stepKeys = ["upload","configure","migrating","results"];
  var curIdx = stepKeys.indexOf(vw);

  return (
    <div style={{marginBottom:16,padding:"12px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        {steps.map(function(st,i){
          var stIdx = i;
          var isActive = st.k === vw;
          var isDone = stIdx < curIdx;
          var isFuture = stIdx > curIdx;
          return <div key={st.k} style={{display:"flex",alignItems:"center"}}>
            <div className="hv-grow" style={{display:"flex",flexDirection:"column",alignItems:"center",opacity:isFuture?.4:1,transition:"all .3s"}}>
              <div style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?14:13,fontWeight:700,background:isActive?"linear-gradient(135deg,"+T.gradA+","+T.gradB+")":isDone?T.g:"transparent",color:isActive?"#fff":isDone?"#fff":T.txD,border:isActive||isDone?"2px solid transparent":"2px solid "+T.bdL,boxShadow:isActive?"0 3px 10px "+T.bl+"35":"none"}}>{isDone?"\u2713":st.n}</div>
              <span style={{fontSize:9,fontWeight:isActive?700:500,color:isActive?T.nv:isDone?T.g:T.txD,marginTop:5}}>{st.l}</span>
            </div>
            {i<3&&<div style={{width:isMobile?16:44,height:2,background:isDone?T.g:T.bdL,margin:"0 6px 18px 6px",borderRadius:1}}/>}
          </div>})}
      </div>
    </div>
  );
}
