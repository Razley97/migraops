export default function DependencyGraph({files,res,dark,T,S,isMobile,graphSel,setGraphSel}){
      return <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <h2 style={{fontSize:18,fontWeight:800,color:T.nv,letterSpacing:"-.03em"}}>{"Grafo de Dependencias"}</h2>
        {files.length===0&&res.length===0?<div style={Object.assign({},S.card,{padding:40,textAlign:"center"})}><div style={{fontSize:32,marginBottom:8}}>{"◎"}</div><div style={{color:T.txD,fontSize:13}}>{"Sube archivos o realiza una migración para visualizar el grafo"}</div></div>
        :(function(){
          var codeFiles=(res.length>0?res:[]).concat(files.filter(function(f){return !res.some(function(r){return r.name===f.name})}));
          if(codeFiles.length===0)codeFiles=files;
          var nodes=[];var links=[];var nodeMap={};
          codeFiles.forEach(function(f,i){
            var code=f.migrated||f.original||f.content||"";
            var name=f.targetName||f.name||("file_"+i);
            var lineCount=code?code.split("\n").length:0;
            var lang=f.lang||(name.endsWith(".py")?"python":name.endsWith(".js")||name.endsWith(".jsx")?"javascript":name.endsWith(".ts")||name.endsWith(".tsx")?"typescript":name.endsWith(".java")?"java":name.endsWith(".kt")?"kotlin":name.endsWith(".cs")?"csharp":name.endsWith(".go")?"go":name.endsWith(".rs")?"rust":name.endsWith(".rb")?"ruby":name.endsWith(".php")?"php":"unknown");
            var funcs=[];var classes=[];var imports=[];
            code.split("\n").forEach(function(line){
              var l=line.trim();
              if(/^import\s/.test(l)||/^from\s/.test(l)||/require\s*\(/.test(l)||/^using\s/.test(l)){imports.push(l)}
              if(/^(export\s+)?(async\s+)?function\s+(\w+)/.test(l)){var m=l.match(/function\s+(\w+)/);if(m)funcs.push(m[1])}
              if(/^(export\s+)?(default\s+)?class\s+(\w+)/.test(l)){var m2=l.match(/class\s+(\w+)/);if(m2)classes.push(m2[1])}
              if(/^\s*def\s+(\w+)/.test(l)){var m3=l.match(/def\s+(\w+)/);if(m3)funcs.push(m3[1])}
            });
            nodeMap[name]={idx:nodes.length};
            nodes.push({id:name,type:"file",lang:lang,lines:lineCount,funcs:funcs.slice(0,8),classes:classes,imports:imports,r:Math.max(22,Math.min(40,lineCount/5))});
            classes.forEach(function(cls){
              var cid=name+"."+cls;
              nodeMap[cid]={idx:nodes.length};
              nodes.push({id:cid,type:"class",lang:lang,lines:0,funcs:[],classes:[],imports:[],r:6,parent:name,label:cls});
              links.push({source:name,target:cid,type:"contains"});
            });
          });
          codeFiles.forEach(function(f){
            var name=f.targetName||f.name;
            var code=f.migrated||f.original||f.content||"";
            (code.match(/(?:import|from|require)\s*[(]?\s*['"]([^'"]+)['"]/g)||[]).forEach(function(imp){
              var m=imp.match(/['"]([^'"]+)['"]/);if(!m)return;
              var target=m[1];var resolved=null;
              Object.keys(nodeMap).forEach(function(k){if(k.indexOf(target.replace(/^\.\/|^\.\.\//,""))>=0||k.replace(/\.\w+$/,"")===target.replace(/^\.\/|^\.\.\//,""))resolved=k});
              if(resolved&&resolved!==name){links.push({source:name,target:resolved,type:"imports"})}
              else if(!resolved&&target.indexOf(".")<0){
                if(!nodeMap[target]){nodeMap[target]={idx:nodes.length};nodes.push({id:target,type:"lib",lang:"external",lines:0,funcs:[],classes:[],imports:[],r:10,label:target})}
                links.push({source:name,target:target,type:"depends"});
              }
            });
          });
          var W=Math.min(1000,typeof window!=="undefined"?window.innerWidth-280:800);
          var H=650;
          var langColors=dark?{python:"#3D8B6E",javascript:"#A8842E",typescript:"#4A7AA8",java:"#B85450",kotlin:"#7C7FBF",csharp:"#3D8B6E",go:"#3E7E9A",rust:"#B85450",ruby:"#B85450",php:"#7C7FBF",external:"#4F5D73",unknown:"#4F5D73"}:{python:"#059669",javascript:"#D97706",typescript:"#2563EB",java:"#DC2626",kotlin:"#6366F1",csharp:"#059669",go:"#0EA5E9",rust:"#DC2626",ruby:"#DC2626",php:"#6366F1",external:"#94A3B8",unknown:"#94A3B8"};
          var sim=nodes.map(function(n,i){return{x:W/2+Math.cos(i*2.1)*W*0.4,y:H/2+Math.sin(i*2.1)*H*0.4,vx:0,vy:0}});
          var alpha=0.9;
          for(var tick=0;tick<250;tick++){
            alpha*=0.97;
            sim.forEach(function(a,i){
              sim.forEach(function(b,j){
                if(i===j)return;
                var dx=a.x-b.x;var dy=a.y-b.y;var d=Math.sqrt(dx*dx+dy*dy)||1;
                var minDist=(nodes[i].type==="class"&&nodes[j].type==="class")?60:(nodes[i].type==="class"||nodes[j].type==="class")?70:150;
                var force=d<minDist?4000/(d*d):1200/(d*d);
                a.vx+=dx/d*force*alpha;a.vy+=dy/d*force*alpha;
              });
              a.vx+=(W/2-a.x)*0.004*alpha;a.vy+=(H/2-a.y)*0.004*alpha;
            });
            links.forEach(function(lk){
              var si=nodeMap[lk.source]?nodeMap[lk.source].idx:0;
              var ti=nodeMap[lk.target]?nodeMap[lk.target].idx:0;
              var s=sim[si];var t2=sim[ti];if(!s||!t2)return;
              var dx=t2.x-s.x;var dy=t2.y-s.y;var d=Math.sqrt(dx*dx+dy*dy)||1;
              var ideal=lk.type==="contains"?60:220;
              var str=lk.type==="contains"?0.03:0.003;
              var force2=(d-ideal)*str*alpha;
              s.vx+=dx/d*force2;s.vy+=dy/d*force2;
              t2.vx-=dx/d*force2;t2.vy-=dy/d*force2;
            });
            sim.forEach(function(n2){
              n2.vx*=0.82;n2.vy*=0.82;
              n2.x+=n2.vx;n2.y+=n2.vy;
              n2.x=Math.max(50,Math.min(W-50,n2.x));
              n2.y=Math.max(50,Math.min(H-50,n2.y));
            });
          }
          var selNode=graphSel;
          var selLinks=selNode?links.filter(function(lk){return lk.source===selNode||lk.target===selNode}):[];
          var selConnected=selNode?selLinks.reduce(function(acc,lk){acc[lk.source]=true;acc[lk.target]=true;return acc},{}):{};
          return <div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8,alignItems:"center"}}>
              <span style={{fontSize:9,color:T.txD}}>{nodes.length+" nodos · "+links.length+" conexiones"}</span>
              {["file","class","lib"].map(function(t3){var c2=nodes.filter(function(n){return n.type===t3}).length;if(!c2)return null;var ic=t3==="file"?"":t3==="class"?"":"";return <span key={t3} style={{padding:"2px 8px",borderRadius:6,fontSize:9,fontWeight:600,background:T.cBg,color:T.txM}}>{ic+" "+c2+" "+(t3==="file"?"archivos":t3==="class"?"clases":"libs")}</span>})}
              {selNode&&<button onClick={function(){setGraphSel(null)}} style={{marginLeft:"auto",padding:"3px 10px",borderRadius:6,border:"1px solid "+T.bdL,background:T.w,fontSize:9,cursor:"pointer",color:T.txM}}>{"✕ Deseleccionar"}</button>}
            </div>
            <div style={Object.assign({},S.card,{overflow:"hidden",position:"relative"})}>
              <svg width={W} height={H} style={{display:"block",background:dark?"#0C1018":"#FAFBFC",cursor:"pointer"}} onClick={function(e){if(e.target.tagName==="svg")setGraphSel(null)}}>
                <defs>
                  <marker id="arwI" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#4A7AA8":"#2563EB"}/></marker>
                  <marker id="arwD" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="9" markerHeight="6" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#4F5D73":"#94A3B8"}/></marker>
                  <marker id="arwC" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="7" markerHeight="5" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#3D8B6E":"#059669"}/></marker>
                  <marker id="arwH" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="12" markerHeight="8" orient="auto"><path d={"M0,0 L10,3 L0,6 Z"} fill={dark?"#7DB5F5":"#1D4ED8"}/></marker>
                </defs>
                {links.map(function(lk,li){
                  var si2=nodeMap[lk.source]?nodeMap[lk.source].idx:0;
                  var ti2=nodeMap[lk.target]?nodeMap[lk.target].idx:0;
                  var s2=sim[si2];var t3b=sim[ti2];if(!s2||!t3b)return null;
                  var sr=nodes[si2]?nodes[si2].r:15;var tr=nodes[ti2]?nodes[ti2].r:15;
                  var dx2=t3b.x-s2.x;var dy2=t3b.y-s2.y;var d2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
                  var sx=s2.x+dx2/d2*(sr+2);var sy=s2.y+dy2/d2*(sr+2);
                  var tx=t3b.x-dx2/d2*(tr+4);var ty=t3b.y-dy2/d2*(tr+4);
                  var isHi=selNode&&(lk.source===selNode||lk.target===selNode);
                  var isDim=selNode&&!isHi;
                  var clr2=isHi?(dark?"#7DB5F5":"#1D4ED8"):lk.type==="imports"?(dark?"#4A7AA8":"#2563EB"):lk.type==="depends"?(dark?"#4F5D73":"#94A3B8"):(dark?"#3D8B6E":"#059669");
                  var mkr=isHi?"url(#arwH)":lk.type==="imports"?"url(#arwI)":lk.type==="depends"?"url(#arwD)":"url(#arwC)";
                  return <line key={li} x1={sx} y1={sy} x2={tx} y2={ty} stroke={clr2} strokeWidth={isHi?2.5:lk.type==="imports"?1.8:lk.type==="contains"?.8:1.2} opacity={isDim?.1:isHi?1:lk.type==="contains"?.25:.55} markerEnd={mkr} strokeDasharray={lk.type==="contains"?"3,2":"none"}/>
                })}
                {nodes.map(function(nd,ni){
                  var pos=sim[ni];if(!pos)return null;
                  var clr3=langColors[nd.lang]||langColors.unknown;
                  var isSel=selNode===nd.id;
                  var isConn=selNode&&selConnected[nd.id];
                  var isDim2=selNode&&!isSel&&!isConn;
                  var fillOp=nd.type==="class"?.15:nd.type==="lib"?0:.12;
                  return <g key={ni} onClick={function(e){e.stopPropagation();setGraphSel(selNode===nd.id?null:nd.id)}} style={{cursor:"pointer"}}>
                    {isSel&&<circle cx={pos.x} cy={pos.y} r={nd.r+6} fill="none" stroke={dark?"#7DB5F5":"#1D4ED8"} strokeWidth="2" opacity=".5" strokeDasharray="4,2"/>}
                    <circle cx={pos.x} cy={pos.y} r={nd.r} fill={nd.type==="lib"?(dark?"#0C1018":"#FAFBFC"):clr3} fillOpacity={isDim2?.05:fillOp} stroke={isSel?(dark?"#7DB5F5":"#1D4ED8"):clr3} strokeWidth={nd.type==="file"?2.5:1.5} strokeDasharray={nd.type==="lib"?"4,2":"none"} opacity={isDim2?.25:1}/>
                    <text x={nd.type==="file"?pos.x:pos.x+nd.r+5} y={nd.type==="file"?pos.y+(nd.r+14):pos.y+3} textAnchor={nd.type==="file"?"middle":"start"} fill={isDim2?(dark?"#2A3040":"#CBD5E1"):dark?"#94A3B8":"#334155"} fontSize={nd.type==="file"?10:7} fontWeight={nd.type==="file"?700:500} fontFamily="'Fira Code',monospace" opacity={isDim2?.3:1}>{nd.label||nd.id}</text>
                    {nd.type==="file"&&<text x={pos.x} y={pos.y+3} textAnchor="middle" fill={isDim2?(dark?"#1A2030":"#E2E8F0"):clr3} fontSize="9" fontWeight="800" opacity={isDim2?.3:1}>{nd.lines+"L"}</text>}
                    {nd.type==="lib"&&<text x={pos.x} y={pos.y+3} textAnchor="middle" fill={dark?"#4F5D73":"#94A3B8"} fontSize="7" opacity={isDim2?.2:1}>{"pkg"}</text>}
                    {nd.type==="class"&&<text x={pos.x} y={pos.y+3} textAnchor="middle" fill={clr3} fontSize="6" fontWeight="700" opacity={isDim2?.2:.7}>{"C"}</text>}
                  </g>
                })}
              </svg>
              <div style={{position:"absolute",bottom:8,right:8,display:"flex",gap:10,background:(dark?"rgba(12,16,24,.85)":"rgba(255,255,255,.9)"),padding:"4px 10px",borderRadius:6,backdropFilter:"blur(4px)"}}>
                {[{l:"Archivo",c:dark?"#4A7AA8":"#2563EB",s:"solid"},{l:"Clase",c:dark?"#3D8B6E":"#059669",s:"solid"},{l:"Librería",c:dark?"#4F5D73":"#94A3B8",s:"dashed"}].map(function(lg,li){return <span key={li} style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,color:T.txD}}><span style={{width:8,height:8,borderRadius:"50%",border:"2px "+(lg.s==="dashed"?"dashed":"solid")+" "+lg.c,background:lg.s==="dashed"?"none":lg.c+"20"}}/>{lg.l}</span>})}
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,color:T.txD}}>{"→ import"}</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:8,color:T.txD}}>{"⤍ contains"}</span>
              </div>
            </div>
            {selNode&&(function(){var nd3=nodes.find(function(n){return n.id===selNode});if(!nd3)return null;var out=links.filter(function(lk){return lk.source===selNode&&lk.type!=="contains"});var inc=links.filter(function(lk){return lk.target===selNode&&lk.type!=="contains"});var cls=links.filter(function(lk){return lk.source===selNode&&lk.type==="contains"});var clr5=langColors[nd3.lang]||langColors.unknown;return <div style={Object.assign({},S.card,{marginTop:8,border:"2px solid "+clr5+"40",overflow:"hidden"})}>
              <div style={{padding:"10px 16px",background:clr5+"10",borderBottom:"1px solid "+T.bdL,display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:12,height:12,borderRadius:"50%",background:clr5}}/>
                <span style={{fontSize:13,fontWeight:800,fontFamily:T.f,color:T.nv}}>{nd3.id}</span>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:T.cBg,color:T.txM}}>{nd3.type}</span>
                {nd3.lines>0&&<span style={{fontSize:9,color:T.txD}}>{nd3.lines+" líneas"}</span>}
              </div>
              <div style={{padding:"10px 16px",display:"flex",gap:16,flexWrap:"wrap"}}>
                {nd3.classes.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"CLASES"}</div>{nd3.classes.map(function(c3,ci){return <span key={ci} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:clr5+"12",color:clr5,fontFamily:T.f}}>{c3}</span>})}</div>}
                {nd3.funcs.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"FUNCIONES"}</div>{nd3.funcs.map(function(fn,fi){return <span key={fi} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:T.cBg,color:T.txM,fontFamily:T.f}}>{fn+"()"}</span>})}</div>}
                {out.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"IMPORTA →"}</div>{out.map(function(lk3,li3){return <span key={li3} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:T.blP,color:T.bl,fontFamily:T.f}}>{lk3.target}</span>})}</div>}
                {inc.length>0&&<div><div style={{fontSize:8,fontWeight:700,color:T.txD,marginBottom:3}}>{"← IMPORTADO POR"}</div>{inc.map(function(lk4,li4){return <span key={li4} style={{display:"inline-block",marginRight:4,marginBottom:2,padding:"1px 6px",borderRadius:4,fontSize:9,background:T.okBg,color:T.g,fontFamily:T.f}}>{lk4.source}</span>})}</div>}
              </div>
            </div>})()}
            {!selNode&&nodes.filter(function(n){return n.type==="file"}).length>0&&<div style={Object.assign({},S.card,{marginTop:8})}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid "+T.bdL}}><span style={{fontSize:11,fontWeight:700,color:T.nv}}>{"Detalle de Archivos"}</span></div>
              <div style={{padding:10,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8}}>
                {nodes.filter(function(n){return n.type==="file"}).map(function(nd2,ni2){
                  var clr4=langColors[nd2.lang]||langColors.unknown;
                  var outL=links.filter(function(lk2){return lk2.source===nd2.id&&lk2.type!=="contains"});
                  var inL=links.filter(function(lk2){return lk2.target===nd2.id&&lk2.type!=="contains"});
                  return <div key={ni2} onClick={function(){setGraphSel(nd2.id)}} style={{padding:"8px 10px",borderRadius:8,border:"1px solid "+T.bdL,background:T.w,cursor:"pointer",transition:"all .2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:clr4}}/>
                      <span style={{fontSize:10,fontWeight:700,color:T.nv,fontFamily:T.f}}>{nd2.id}</span>
                      <span style={{fontSize:8,color:T.txD,marginLeft:"auto"}}>{nd2.lines+" ln"}</span>
                    </div>
                    {nd2.classes.length>0&&<div style={{fontSize:8,color:T.txM,marginBottom:2}}>{"Clases: "+nd2.classes.join(", ")}</div>}
                    {nd2.funcs.length>0&&<div style={{fontSize:8,color:T.txM,marginBottom:2}}>{"Func: "+nd2.funcs.slice(0,4).join(", ")+(nd2.funcs.length>4?" +"+String(nd2.funcs.length-4):"")}</div>}
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      {outL.length>0&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:T.blP,color:T.bl}}>{"→ "+outL.length}</span>}
                      {inL.length>0&&<span style={{fontSize:7,padding:"1px 5px",borderRadius:4,background:T.okBg,color:T.g}}>{"← "+inL.length}</span>}
                    </div>
                  </div>
                })}
              </div>
            </div>}
          </div>
        })()}
      </div>
}