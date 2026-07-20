import { useCountdown } from '../hooks/useCountdown.js';
import { ACCENT, BORDER, CARD2, GOLD, GREEN, MUTED, ORANGE, RED, TEXT } from '../lib/theme.js';

export function Header({page,setPage,adminUser,setAdminUser,playerUser,setPlayerUser,phase}){
  const target=phase.phase==="open"?phase.until:phase.phase==="locked"?phase.until:phase.until;
  const cd=useCountdown(target);
  const phaseColor=phase.phase==="locked"?RED:phase.phase==="between"?ORANGE:phase.phase.includes("open")||phase.phase.includes("baseline")||phase.phase.includes("final")?GREEN:MUTED;
  const phaseLabel=phase.label||"";
  return(
    <header style={{background:"linear-gradient(160deg,#0D1B2A 55%,#132436)",borderBottom:`1px solid ${BORDER}`,position:"sticky",top:0,zIndex:50}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6,padding:"12px 0 0"}}>
          <div>
            <h1 style={{fontSize:"clamp(13px,2.5vw,20px)",fontWeight:700,letterSpacing:"0.04em",color:TEXT}}>❄️ WOS BAG UPDATES — SVS PREP WEEK</h1>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:phaseColor,display:"inline-block",animation:phase.phase==="locked"?"pulse 1.4s infinite":"none"}}/>
              <span style={{fontSize:11,color:phaseColor,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase"}}>{phaseLabel}</span>
              {!cd.expired&&cd.d!==undefined&&<span style={{fontSize:11,color:MUTED}}>— {phase.phase==="locked"?"reopens in":"closes in"} <strong style={{color:phaseColor}}>{cd.d}d {cd.h}h {cd.m}m {cd.s}s</strong></span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {playerUser&&<span style={{fontSize:12,color:ACCENT,fontWeight:600}}>👤 {playerUser.playerName}</span>}
          </div>
        </div>
        {/* Cycle timeline */}
        <div style={{display:"flex",gap:4,alignItems:"center",padding:"6px 0 2px",flexWrap:"wrap"}}>
          {[
            {l:"Initial Bag",d:"Jun 20–Jul 1+3d",phases:["c1_open"],col:GREEN},
            {l:"Vanity 🏆",d:"After lock–Jul 9",phases:["c1_open"],col:ACCENT},
            {l:"Final Bag",d:"Jul 10–12",phases:["c1_final"],col:GOLD},
            {l:"Prep 🔒",d:"Jul 13–17",phases:["locked"],col:RED},
            {l:"Cycle 2",d:"Jul 18–Aug 9",phases:["c2_open"],col:GREEN},
          ].map((seg,i)=>{
            const isActive=seg.phases.includes(phase.phase);
            return(<span key={i} style={{display:"inline-flex",alignItems:"center",gap:3}}>
              {i>0&&<span style={{color:BORDER,fontSize:9}}>›</span>}
              <span style={{background:isActive?`${seg.col}20`:CARD2,border:`1px solid ${isActive?seg.col:BORDER}`,borderRadius:5,padding:"2px 6px",textAlign:"center",display:"inline-block"}}>
                <div style={{fontSize:9,fontWeight:700,color:isActive?seg.col:MUTED,letterSpacing:"0.04em"}}>{seg.l}</div>
                <div style={{fontSize:8,color:isActive?seg.col:BORDER}}>{seg.d}</div>
              </span>
            </span>);
          })}
        </div>
        <nav style={{display:"flex",gap:2,marginTop:4,flexWrap:"wrap"}}>
          <button className={`nav-btn${page==="leaderboard"?" active":""}`} onClick={()=>setPage("leaderboard")}>Leaderboard</button>
          <button className={`nav-btn${page==="howto"?" active":""}`} onClick={()=>setPage("howto")}>How To Submit</button>
          <button className={`nav-btn${page==="submit"?" active":""}`} onClick={()=>setPage("submit")}>Submit Bag</button>
          {playerUser?(
            <button className="nav-btn" onClick={()=>{setPlayerUser(null);setPage("leaderboard");}}>Log Out ({playerUser.playerName})</button>
          ):(
            <button className={`nav-btn${page==="login"?" active":""}`} onClick={()=>setPage("login")}>Player Login</button>
          )}
          {adminUser?(
            <><button className={`nav-btn${page==="adminPanel"?" active":""}`} onClick={()=>setPage("adminPanel")}>Admin Panel</button>
            <button className="nav-btn" onClick={()=>{setAdminUser(null);setPage("leaderboard");}}>Admin Logout</button></>
          ):(
            <button className={`nav-btn${page==="admin"?" active":""}`} onClick={()=>setPage("admin")}>Admin</button>
          )}
        </nav>
      </div>
    </header>
  );
}
