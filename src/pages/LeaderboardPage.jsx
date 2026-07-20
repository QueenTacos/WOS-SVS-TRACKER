import { useState } from 'react';
import { EmptyState } from '../components/EmptyState.jsx';
import { ALL_ITEMS } from '../lib/items.js';
import { DEFAULT_SITE_CONTENT } from '../lib/siteContent.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, GREEN, MUTED, RED, TEXT } from '../lib/theme.js';

export function LeaderboardPage({entries,loading,siteContent}){
  const[tab,setTab]=useState("players");

  const calcGrowth=(entry)=>{
    const start=entry.cycle1_firstBag||entry.startBag||{};
    // Use final bag if submitted, otherwise latest vanity/current bag
    const end=entry.cycle1_finalLatestBag||entry.cycle1_latestBag||entry.latestBag||entry.endBag||{};
    let ts=0,te=0;
    ALL_ITEMS.forEach(({name})=>{
      const s=Number(start[name])||0;
      const e=Number(end[name])||0;
      if(s>0){ts+=s;te+=e;}
    });
    const isVanity=!entry.cycle1_finalLatestBag;
    return ts>0?{growth:((te-ts)/ts*100),hasData:true,isVanity}:{growth:null,hasData:false};
  };

  const playerLB=entries.map(e=>({...e,...calcGrowth(e)})).filter(e=>e.hasData).sort((a,b)=>b.growth-a.growth);

  const allianceMap={};
  playerLB.forEach(e=>{
    const tag=e.allianceTag||"None";
    if(!allianceMap[tag])allianceMap[tag]={tag,growths:[],members:[],vanity:[]};
    allianceMap[tag].growths.push(e.growth);
    allianceMap[tag].members.push(e.playerName);
    allianceMap[tag].vanity.push(e.isVanity);
  });
  const allianceLB=Object.values(allianceMap).map(a=>({
    ...a,count:a.growths.length,
    avg:a.growths.reduce((s,v)=>s+v,0)/a.growths.length,
    allVanity:a.vanity.every(v=>v)
  })).sort((a,b)=>b.avg-a.avg);

  const mi=i=>i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
  const mc=i=>i===0?"m1":i===1?"m2":i===2?"m3":"";

  return(
    <div className="fade">
      {/* Competition Banner — dynamic */}
      {(()=>{
        const c={...DEFAULT_SITE_CONTENT,...(siteContent||{})};
        const rules=Array.isArray(c.rules)?c.rules:DEFAULT_SITE_CONTENT.rules;
        return(
          <div style={{background:"linear-gradient(135deg,#1E0F3A,#2A1A55)",border:`1px solid ${ACCENT}44`,borderRadius:12,padding:"20px 24px",marginBottom:24}}>
            <h2 style={{fontSize:20,fontWeight:700,color:TEXT,marginBottom:6}}>{c.title}</h2>
            <p style={{color:MUTED,fontSize:13,lineHeight:1.7,marginBottom:16}}>{c.description}</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginBottom:16}}>
              <div style={{background:`${ACCENT}12`,border:`1px solid ${ACCENT}33`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>⚙️ How It Works</div>
                <p style={{fontSize:12,color:MUTED,lineHeight:1.7}}>{c.how_it_works}</p>
              </div>
              <div style={{background:`${GOLD}12`,border:`1px solid ${GOLD}44`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:GOLD,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>🏆 The Prize</div>
                <p style={{fontSize:12,color:MUTED,lineHeight:1.7}}>{c.prize}</p>
              </div>
              <div style={{background:`${GREEN}10`,border:`1px solid ${GREEN}33`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:GREEN,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>⭐ What Counts</div>
                <p style={{fontSize:12,color:MUTED,lineHeight:1.7}}>{c.what_counts}</p>
              </div>
              <div style={{background:`#1a0f3a`,border:`1px solid ${BORDER}`,borderRadius:8,padding:"12px 14px"}}>
                <div style={{fontSize:12,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>📋 Rules</div>
                <ul style={{fontSize:12,color:MUTED,lineHeight:1.8,paddingLeft:14}}>
                  {rules.map((r,i)=><li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
            <p style={{fontSize:13,color:ACCENT,fontWeight:600,textAlign:"center"}}>{c.footer}</p>
          </div>
        );
      })()}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:700,color:GOLD}}>🏆 Leaderboard</h2>
          <p style={{color:MUTED,fontSize:13,marginTop:3}}>Growth % updates live as players add items · Top 2 win Frost Stars</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="bg" onClick={()=>setTab("players")} style={tab==="players"?{borderColor:ACCENT,color:ACCENT}:{}}>Players</button>
          <button className="bg" onClick={()=>setTab("alliances")} style={tab==="alliances"?{borderColor:GOLD,color:GOLD}:{}}>Alliances</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:16,marginBottom:14,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:MUTED,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:GREEN,display:"inline-block"}}/>Contest score (final bag submitted)</span>
        <span style={{fontSize:11,color:MUTED,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:ACCENT,display:"inline-block"}}/>Live score (vanity updates)</span>
      </div>

      {loading?<p style={{color:MUTED,textAlign:"center",padding:40}}>Loading…</p>:tab==="players"?(
        playerLB.length===0?<EmptyState icon="📊" text="No growth data yet — players need an initial bag submitted to appear here."/>:(
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden"}}>
            {playerLB.length>=2&&(
              <div style={{background:`linear-gradient(90deg,${GOLD}18,${GOLD}06)`,borderBottom:`1px solid ${GOLD}33`,padding:"10px 16px",display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>🏆 Current Leaders:</span>
                {playerLB.slice(0,2).map((e,i)=>(
                  <span key={e.id} style={{fontSize:13,color:GOLD}}>{i===0?"🥇":"🥈"} {e.playerName} <span style={{color:MUTED,fontSize:11}}>({e.allianceTag}) {e.growth>=0?"+":""}{e.growth.toFixed(1)}% {e.isVanity?"📊":""}</span></span>
                ))}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"44px 1fr 130px 130px",background:CARD2,padding:"9px 14px",fontSize:10,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>
              <span>Rank</span><span>Player</span><span style={{textAlign:"center"}}>Alliance</span><span style={{textAlign:"right"}}>Growth</span>
            </div>
            {playerLB.map((e,i)=>(
              <div key={e.id} className="lbr" style={{display:"grid",gridTemplateColumns:"44px 1fr 130px 130px",padding:"12px 14px",borderTop:`1px solid ${BORDER}`,alignItems:"center",background:i<2?`${GOLD}05`:"transparent",transition:"background 0.15s"}}>
                <span style={{fontSize:17,fontWeight:700}} className={mc(i)}>{mi(i)}</span>
                <div style={{fontWeight:700,fontSize:14,color:i<2?GOLD:TEXT}}>{e.playerName}</div>
                <div style={{textAlign:"center"}}><span style={{background:"#0D1B2A",color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"2px 7px",fontSize:11,fontWeight:600}}>{e.allianceTag}</span></div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,fontSize:15,color:e.growth>=0?(e.isVanity?ACCENT:GREEN):RED}}>{e.growth>=0?"+":""}{e.growth.toFixed(1)}%</div>
                  <div style={{fontSize:9,color:MUTED,letterSpacing:"0.04em"}}>{e.isVanity?"LIVE":"FINAL"}</div>
                </div>
              </div>
            ))}
          </div>
        )
      ):(
        allianceLB.length===0?<EmptyState icon="🛡️" text="No alliance data yet."/>:(
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden"}}>
            {allianceLB[0]&&(
              <div style={{background:`linear-gradient(90deg,${GOLD}18,${GOLD}06)`,borderBottom:`1px solid ${GOLD}33`,padding:"10px 16px"}}>
                <span style={{fontSize:11,color:GOLD,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>🛡️ Leading Alliance: </span>
                <span style={{fontSize:15,color:GOLD,fontWeight:700}}>{allianceLB[0].tag}</span>
                <span style={{color:MUTED,fontSize:12,marginLeft:8}}>avg {allianceLB[0].avg>=0?"+":""}{allianceLB[0].avg.toFixed(1)}% · {allianceLB[0].count} player{allianceLB[0].count!==1?"s":""}</span>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"44px 1fr 80px 80px 110px",background:CARD2,padding:"9px 14px",fontSize:10,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>
              <span>Rank</span><span>Alliance</span><span style={{textAlign:"center"}}>Members</span><span style={{textAlign:"center"}}>Entries</span><span style={{textAlign:"right"}}>Avg Growth</span>
            </div>
            {allianceLB.map((a,i)=>(
              <div key={a.tag} className="lbr" style={{display:"grid",gridTemplateColumns:"44px 1fr 80px 80px 110px",padding:"12px 14px",borderTop:`1px solid ${BORDER}`,alignItems:"center",background:i===0?`${GOLD}05`:"transparent",transition:"background 0.15s"}}>
                <span style={{fontSize:17,fontWeight:700}} className={mc(i)}>{mi(i)}</span>
                <div style={{fontWeight:700,fontSize:14,color:i===0?GOLD:TEXT}}>{a.tag}</div>
                <div style={{textAlign:"center",color:MUTED,fontSize:13}}>{a.members.length}</div>
                <div style={{textAlign:"center",color:MUTED,fontSize:13}}>{a.count}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,fontSize:15,color:a.avg>=0?(a.allVanity?ACCENT:GREEN):RED}}>{a.avg>=0?"+":""}{a.avg.toFixed(1)}%</div>
                  <div style={{fontSize:9,color:MUTED}}>{a.allVanity?"LIVE":"FINAL"}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
