import { useState, useEffect, useRef } from "react";
import { getAllEntries, getEntry, upsertEntry, deleteEntry, getAdmins, addAdmin, removeAdmin, findAdmin } from "./supabase.js";

// ─── COLORS ───────────────────────────────────────────────────────────────────
const BG="#0D1B2A",CARD="#1A2B3C",CARD2="#162436",BORDER="#2A3F55";
const ACCENT="#4A90C4",GOLD="#F5A623",GREEN="#4ade80",RED="#f87171";
const TEXT="#E8F4F8",MUTED="#7A9BB5",ORANGE="#fb923c",PURPLE="#a78bfa";
const OWNER_EMAIL="yumqueentacos@gmail.com";
const OWNER_PASS_HASH=btoa("PLNt123!!$$");

// ─── CYCLE LOGIC ──────────────────────────────────────────────────────────────
// ── CYCLE 1 TIMELINE ─────────────────────────────────────────────────────────
// Jun 20 – Jul 9:   Initial bag window (first submit = baseline, 3-day edit lock)
//                   After initial lock: vanity updates freely, leaderboard live
// Jul 10 – Jul 12 23:50: Final bag window (prompt to submit final, 3-day edit lock)
// Jul 13 – 17:      Prep Week — site locked
// Jul 18+:          Cycle 2 (TBD)

const C1_START          = new Date("2026-06-20T00:00:00");
const C1_VANITY_END     = new Date("2026-07-09T23:59:59");
const C1_FINAL_START    = new Date("2026-07-10T00:00:00");
const C1_FINAL_END      = new Date("2026-07-12T23:50:00");
const C1_PREP_END       = new Date("2026-07-17T23:59:59");
const C2_START          = new Date("2026-07-18T00:00:00");
const C2_END            = new Date("2026-08-09T23:59:59");
const C2_PREP_END       = new Date("2026-08-14T23:59:59");
const THREE_DAYS_MS     = 3 * 24 * 60 * 60 * 1000;

function getPhase(){
  const now = new Date();
  if(now >= C2_END && now <= C2_PREP_END)   return {phase:"locked",     label:"Prep Week — Locked",          cycle:2, until:C2_PREP_END};
  if(now >= C2_START && now <= C2_END)       return {phase:"c2_open",    label:"Cycle 2 Open",                cycle:2, until:C2_END};
  if(now > C1_FINAL_END && now <= C1_PREP_END) return {phase:"locked",  label:"SVS Prep Week — Locked",      cycle:1, until:C1_PREP_END};
  if(now >= C1_FINAL_START && now <= C1_FINAL_END) return {phase:"c1_final", label:"Final Bag Window Open",  cycle:1, until:C1_FINAL_END};
  if(now >= C1_START && now <= C1_VANITY_END)  return {phase:"c1_open",  label:"Bag Submissions Open",       cycle:1, until:C1_VANITY_END};
  if(now < C1_START)                           return {phase:"upcoming",  label:"Opens June 20",             cycle:0, until:C1_START};
  return {phase:"closed", label:"Season Complete", cycle:99};
}

// Per-player state within a phase
// Returns one of: "no_account" | "submit_initial" | "edit_initial" | "vanity" |
//                 "prompt_final" | "submit_final" | "edit_final" | "final_locked" | "locked"
function getPlayerSubmitState(entry, phase){
  if(!entry) return (phase.phase==="c1_open"||phase.phase==="c1_final"||phase.phase==="c2_open") ? "submit_initial" : "locked";
  const now = Date.now();
  // Use cycle1_firstAt as the initial baseline timestamp (set in handleSubmit)
  const initialFirstAt = entry.cycle1_firstAt || entry.initialFirstAt;
  const initialLocked  = initialFirstAt && (now - initialFirstAt) >= THREE_DAYS_MS;
  const finalFirstAt   = entry.cycle1_finalFirstAt || entry.finalFirstAt;
  const finalLocked    = finalFirstAt && (now - finalFirstAt) >= THREE_DAYS_MS;

  if(phase.phase==="c1_open"){
    if(!initialFirstAt) return "submit_initial";
    if(!initialLocked)  return "edit_initial";
    return "vanity";
  }
  if(phase.phase==="c1_final"){
    if(!initialFirstAt) return "submit_initial";
    if(!finalFirstAt)   return "prompt_final";
    if(!finalLocked)    return "edit_final";
    return "final_locked";
  }
  if(phase.phase==="c2_open"){
    if(!entry.c2_firstAt) return "submit_initial";
    if((now - entry.c2_firstAt) < THREE_DAYS_MS) return "edit_initial";
    return "vanity";
  }
  return "locked";
}


function useCountdown(target){
  const[t,setT]=useState({});
  useEffect(()=>{
    if(!target)return;
    const tick=()=>{
      const diff=new Date(target)-Date.now();
      if(diff<=0){setT({expired:true});return;}
      setT({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)});
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[target]);
  return t;
}

// ─── ITEM IMAGE COMPONENT ─────────────────────────────────────────────────────
function ItemImg({name,size=28}){
  const src=ITEM_IMGS[name];
  const isSVS=SVS_PRIORITY.has(name);
  if(!src){
    const colors={"🔥":["#ff6b35","#ff9500"],"⚡":["#60a5fa","#3b82f6"],"🦸":["#a78bfa","#7c3aed"],"🐾":["#34d399","#059669"],"⚙️":["#fbbf24","#d97706"],"🎓":["#f472b6","#db2777"],"🎁":["#94a3b8","#64748b"],"💎":["#38bdf8","#0284c7"]};
    const emoji=Object.keys(colors).find(e=>Object.entries(ITEM_CATEGORIES).find(([k])=>k.startsWith(e)&&ITEM_CATEGORIES[k].includes(name)));
    const[c1,c2]=colors[emoji]||["#4A90C4","#2563eb"];
    return(
      <div style={{width:size,height:size,borderRadius:6,background:`linear-gradient(135deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.42,flexShrink:0,border:isSVS?`1px solid ${GOLD}66`:"none"}}>
        {emoji||"📦"}
      </div>
    );
  }
  return(
    <div style={{width:size,height:size,borderRadius:6,background:"#0a1826",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:isSVS?`1px solid ${GOLD}55`:"none",overflow:"hidden"}}>
      <img src={src} alt={name} width={size} height={size} style={{objectFit:"contain"}}/>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const[page,setPage]=useState("leaderboard");
  const[adminUser,setAdminUser]=useState(null);
  const[playerUser,setPlayerUser]=useState(null);
  const[entries,setEntries]=useState([]);
  const[loading,setLoading]=useState(true);
  const[toast,setToast]=useState(null);
  const phase=getPhase();

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  useEffect(()=>{loadEntries();},[]);
  const loadEntries=async()=>{
    setLoading(true);
    try{
      const items=await getAllEntries();
      setEntries(items);
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:"100vh",background:BG,color:TEXT,fontFamily:"'Century Gothic','CenturyGothic','AppleGothic',sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,textarea{font-family:'Century Gothic','CenturyGothic','AppleGothic',sans-serif!important;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0D1B2A;}::-webkit-scrollbar-thumb{background:#2A3F55;border-radius:3px;}
        .nav-btn{background:none;border:none;color:${MUTED};cursor:pointer;padding:8px 14px;font-family:inherit;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;}
        .nav-btn:hover{color:${TEXT};}
        .nav-btn.active{color:${ACCENT};border-bottom-color:${ACCENT};}
        .fi{width:100%;background:#0A1520;border:1px solid ${BORDER};border-radius:6px;padding:7px 10px;color:${TEXT};font-size:13px;outline:none;font-family:inherit;transition:border 0.2s;}
        .fi:focus{border-color:${ACCENT};}
        .bp{background:${ACCENT};color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.06em;text-transform:uppercase;transition:background 0.2s;}
        .bp:hover:not(:disabled){background:#5AA0D4;}
        .bp:disabled{opacity:0.5;cursor:not-allowed;}
        .bd{background:#7f1d1d;color:${RED};border:1px solid ${RED};border-radius:6px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;}
        .bd:hover{background:#991b1b;}
        .bg{background:none;border:1px solid ${BORDER};color:${MUTED};border-radius:6px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.2s;}
        .bg:hover{border-color:${ACCENT};color:${ACCENT};}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes toastIn{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        .fade{animation:fadeIn 0.3s ease;}
        .lbr:hover{background:#1E3248!important;}
        .m1{color:#FFD700;}.m2{color:#C0C0C0;}.m3{color:#CD7F32;}
        .svs-item{border-color:${GOLD}55!important;background:${GOLD}08!important;}
        .svs-badge{background:${GOLD}22;color:${GOLD};border:1px solid ${GOLD}44;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;letter-spacing:0.05em;margin-left:4px;}
        .pin-input{width:48px;height:52px;text-align:center;font-size:22px;font-weight:700;background:#0A1520;border:2px solid ${BORDER};border-radius:8px;color:${TEXT};font-family:inherit;outline:none;transition:border 0.2s;}
        .pin-input:focus{border-color:${ACCENT};}
        .item-row:hover{background:#1E3248!important;}
      `}</style>
      <Header page={page} setPage={setPage} adminUser={adminUser} setAdminUser={setAdminUser} playerUser={playerUser} setPlayerUser={setPlayerUser} phase={phase}/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"24px 14px 60px"}}>
        {page==="leaderboard"&&<LeaderboardPage entries={entries} loading={loading}/>}
        {page==="submit"&&<SubmitPage entries={entries} loadEntries={loadEntries} showToast={showToast} phase={phase} playerUser={playerUser} setPage={setPage} adminUser={adminUser}/>}
        {page==="howto"&&<HowToPage setPage={setPage} phase={phase}/>}
        {page==="login"&&<PlayerLogin setPlayerUser={setPlayerUser} setPage={setPage} showToast={showToast} loadEntries={loadEntries}/>}
        {page==="admin"&&!adminUser&&<AdminLogin setAdminUser={setAdminUser} setPage={setPage} showToast={showToast}/>}
        {page==="adminPanel"&&adminUser&&<AdminPanel entries={entries} loadEntries={loadEntries} showToast={showToast} adminUser={adminUser} isOwner={adminUser.role==="owner"}/>}
      </main>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,background:toast.type==="error"?"#7f1d1d":"#1a3a2a",border:`1px solid ${toast.type==="error"?RED:GREEN}`,color:toast.type==="error"?RED:GREEN,borderRadius:8,padding:"12px 18px",fontSize:13,fontWeight:600,zIndex:999,animation:"toastIn 0.3s ease",maxWidth:300}}>{toast.msg}</div>}
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({page,setPage,adminUser,setAdminUser,playerUser,setPlayerUser,phase}){
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

// ─── HOW TO PAGE ──────────────────────────────────────────────────────────────
function HowToPage({setPage,phase}){
  return(
    <div className="fade" style={{maxWidth:700,margin:"0 auto"}}>
      <h2 style={{fontSize:24,fontWeight:700,color:TEXT,marginBottom:4}}>📋 How to Submit Your Bag</h2>
      <p style={{color:MUTED,fontSize:14,marginBottom:28}}>Everything you need to know about tracking your bag for SVS prep.</p>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {/* Step 1 */}
        <StepCard num="1" title="Create Your Account" color={ACCENT}>
          <p>Click <strong style={{color:ACCENT}}>Player Login</strong> in the nav. Choose <strong>Create Account</strong> and fill in:</p>
          <ul style={{marginTop:8,paddingLeft:18,display:"flex",flexDirection:"column",gap:4}}>
            <li>Your in-game <strong>Player Name</strong></li>
            <li>Your <strong>Gamer ID</strong> (found in your profile)</li>
            <li>Your <strong>Alliance Tag</strong> (e.g. [ICE])</li>
            <li>A <strong>4-digit PIN</strong> you'll use to log in each time</li>
          </ul>
          <p style={{marginTop:8,color:MUTED,fontSize:12}}>⚠️ Remember your PIN — there's no recovery if you forget it. Contact an admin.</p>
        </StepCard>

        {/* Step 2 */}
        <StepCard num="2" title="Submit Your Bag" color={GREEN}>
          <p>Once logged in, go to <strong style={{color:GREEN}}>Submit Bag</strong>. You can:</p>
          <ul style={{marginTop:8,paddingLeft:18,display:"flex",flexDirection:"column",gap:4}}>
            <li>📸 <strong>Upload a screenshot</strong> of your bag (optional — for verification)</li>
            <li>✏️ <strong>Manually enter quantities</strong> for each item</li>
            <li>Update as often as you like — the site tracks your <strong>first</strong> and <strong>most recent</strong> submission automatically</li>
          </ul>
          <div style={{marginTop:12,background:`${GOLD}10`,border:`1px solid ${GOLD}33`,borderRadius:8,padding:"10px 14px"}}>
            <span style={{color:GOLD,fontWeight:700,fontSize:12}}>⭐ SVS Priority Items</span>
            <p style={{fontSize:12,color:MUTED,marginTop:4}}>Items marked with a gold star are used during SVS prep days. Make sure to fill these in accurately — they count toward your growth score.</p>
          </div>
        </StepCard>

        {/* Step 3 */}
        <StepCard num="3" title="Submission Windows" color={ORANGE}>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
            {[
              {label:"Cycle 1 — Bag Submissions",dates:"June 20 – July 12",color:GREEN,desc:"Submit and update your bag freely."},
              {label:"Prep Week (Locked)",dates:"July 13–17",color:RED,desc:"No submissions during this period. Use your items!"},
              {label:"Cycle 2 — Bag Submissions",dates:"July 18 – August 9",color:GREEN,desc:"Submit again after SVS. Growth is calculated vs Cycle 1."},
              {label:"Prep Week (Locked)",dates:"August 10–14",color:RED,desc:"Locked again for next prep."},
            ].map(r=>(
              <div key={r.dates} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:r.color,display:"inline-block",flexShrink:0,marginTop:5}}/>
                <div>
                  <span style={{fontWeight:700,color:r.color,fontSize:13}}>{r.label}</span>
                  <span style={{color:MUTED,fontSize:12,marginLeft:8}}>{r.dates}</span>
                  <p style={{fontSize:12,color:MUTED,marginTop:2}}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </StepCard>

        {/* Step 4 */}
        <StepCard num="4" title="Leaderboard & Winning" color={GOLD}>
          <p>The <strong style={{color:GOLD}}>Leaderboard</strong> shows players ranked by <strong>overall bag growth %</strong> between Cycle 1 and Cycle 2.</p>
          <ul style={{marginTop:8,paddingLeft:18,display:"flex",flexDirection:"column",gap:4}}>
            <li>🥇🥈 <strong>Top 2 players</strong> by growth % win prizes</li>
            <li>Alliance standings are also tracked</li>
            <li>Only <strong>name and alliance tag</strong> are visible on the public leaderboard</li>
          </ul>
        </StepCard>
      </div>

      {/* Sample form preview */}
      <div style={{marginTop:32,background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:20}}>
        <h3 style={{fontSize:16,fontWeight:700,color:ACCENT,marginBottom:4}}>📝 Sample — Bag Entry Form</h3>
        <p style={{color:MUTED,fontSize:12,marginBottom:16}}>This is what the form looks like. SVS priority items are highlighted in gold.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
          {["Fire Crystal","Refined Fire Crystal","Advanced Wild Mark","Mythic General Hero Shard","Kathy Sigil","Common Wild Mark","Mithril","Essence Stones","Book of Knowledge","Pet Food"].map(item=>(
            <SampleItemRow key={item} name={item} />
          ))}
        </div>
        <p style={{color:MUTED,fontSize:11,marginTop:12,textAlign:"center"}}>Log in and go to Submit Bag to fill in your full bag.</p>
        <div style={{textAlign:"center",marginTop:12}}>
          <button className="bp" onClick={()=>setPage("login")}>Log In to Submit →</button>
        </div>
      </div>
    </div>
  );
}

function StepCard({num,title,color,children}){
  return(
    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:20,display:"flex",gap:16}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:`${color}22`,border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color,flexShrink:0}}>{num}</div>
      <div style={{flex:1}}>
        <h3 style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:10}}>{title}</h3>
        <div style={{fontSize:13,color:MUTED,lineHeight:1.6}}>{children}</div>
      </div>
    </div>
  );
}

function SampleItemRow({name}){
  const isSVS=SVS_PRIORITY.has(name);
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":BORDER}`,borderRadius:8,padding:"7px 10px",opacity:0.85}}>
      <ItemImg name={name} size={26}/>
      <div style={{flex:1}}>
        <div style={{fontSize:11,color:isSVS?TEXT:MUTED,fontWeight:isSVS?600:400}}>{name}</div>
        {isSVS&&<span className="svs-badge">SVS ⭐</span>}
      </div>
      <div style={{width:60,height:26,background:"#0A1520",border:`1px solid ${BORDER}`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6,color:BORDER,fontSize:12}}>0</div>
    </div>
  );
}

// ─── PLAYER LOGIN / REGISTER ──────────────────────────────────────────────────
function PlayerLogin({setPlayerUser,setPage,showToast,loadEntries}){
  const[mode,setMode]=useState("login"); // login | register
  const[playerName,setPlayerName]=useState("");
  const[gamerId,setGamerId]=useState("");
  const[allianceTag,setAllianceTag]=useState("");
  const[pin,setPin]=useState(["","","",""]);
  const[loading,setLoading]=useState(false);
  const pinRefs=[useRef(),useRef(),useRef(),useRef()];

  const handlePin=(i,v)=>{
    if(!/^\d*$/.test(v))return;
    const p=[...pin];p[i]=v.slice(-1);setPin(p);
    if(v&&i<3)pinRefs[i+1].current?.focus();
  };
  const handlePinKey=(i,e)=>{if(e.key==="Backspace"&&!pin[i]&&i>0){pinRefs[i-1].current?.focus();}};
  const pinStr=pin.join("");

  const handleLogin=async()=>{
    if(!gamerId.trim()||pinStr.length!==4){showToast("Enter your Gamer ID and 4-digit PIN.","error");return;}
    setLoading(true);
    try{
      const key=`entry:${gamerId.trim().toLowerCase().replace(/\s+/g,"-")}`;
      const data=await getEntry(key);
      if(!data){showToast("Account not found. Please register.","error");return;}
      if(data.pinHash!==btoa(pinStr)){showToast("Incorrect PIN.","error");return;}
      setPlayerUser({playerName:data.playerName,gamerId:data.gamerId,allianceTag:data.allianceTag,entryKey:key});
      setPage("submit");showToast(`Welcome back, ${data.playerName}!`);
    }catch{showToast("Error logging in. Try again.","error");}
    finally{setLoading(false);}
  };

  const handleRegister=async()=>{
    if(!playerName.trim()||!gamerId.trim()||!allianceTag.trim()||pinStr.length!==4){showToast("All fields and a 4-digit PIN are required.","error");return;}
    setLoading(true);
    try{
      const key=`entry:${gamerId.trim().toLowerCase().replace(/\s+/g,"-")}`;
      const existing=await getEntry(key);
      if(existing){showToast("An account with this Gamer ID already exists. Please log in.","error");return;}
      const now=Date.now();
      const entry={id:key,playerName:playerName.trim(),gamerId:gamerId.trim(),allianceTag:allianceTag.trim(),pinHash:btoa(pinStr),createdAt:now,updatedAt:now};
      await upsertEntry(entry);
      await loadEntries();
      setPlayerUser({playerName:entry.playerName,gamerId:entry.gamerId,allianceTag:entry.allianceTag,entryKey:key});
      setPage("submit");showToast(`Account created! Welcome, ${entry.playerName}!`);
    }catch{showToast("Error creating account. Try again.","error");}
    finally{setLoading(false);}
  };

  return(
    <div className="fade" style={{maxWidth:420,margin:"0 auto",paddingTop:16}}>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <button onClick={()=>setMode("login")} style={{flex:1,padding:"10px",borderRadius:8,border:`2px solid ${mode==="login"?ACCENT:BORDER}`,background:mode==="login"?`${ACCENT}18`:"transparent",color:mode==="login"?ACCENT:MUTED,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Log In</button>
        <button onClick={()=>setMode("register")} style={{flex:1,padding:"10px",borderRadius:8,border:`2px solid ${mode==="register"?GREEN:BORDER}`,background:mode==="register"?`${GREEN}18`:"transparent",color:mode==="register"?GREEN:MUTED,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Create Account</button>
      </div>

      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:26}}>
        <h2 style={{fontSize:20,fontWeight:700,color:TEXT,marginBottom:16}}>{mode==="login"?"Player Login":"Create Account"}</h2>

        {mode==="register"&&(
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Player Name *</label>
            <input className="fi" value={playerName} onChange={e=>setPlayerName(e.target.value)} placeholder="Your in-game name"/>
          </div>
        )}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Gamer ID *</label>
          <input className="fi" value={gamerId} onChange={e=>setGamerId(e.target.value)} placeholder="e.g. 84729301"/>
        </div>
        {mode==="register"&&(
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Alliance Tag *</label>
            <input className="fi" value={allianceTag} onChange={e=>setAllianceTag(e.target.value)} placeholder="e.g. [ICE]"/>
          </div>
        )}
        <div style={{marginBottom:22}}>
          <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,fontWeight:600}}>{mode==="login"?"Your PIN":"Choose a 4-Digit PIN"} *</label>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            {pin.map((v,i)=>(
              <input key={i} ref={pinRefs[i]} className="pin-input" type="password" inputMode="numeric" maxLength={1} value={v}
                onChange={e=>handlePin(i,e.target.value)} onKeyDown={e=>handlePinKey(i,e)}/>
            ))}
          </div>
          {mode==="register"&&<p style={{color:MUTED,fontSize:11,textAlign:"center",marginTop:8}}>⚠️ Remember this PIN — it cannot be recovered. Contact an admin if lost.</p>}
        </div>
        <button className="bp" style={{width:"100%"}} disabled={loading} onClick={mode==="login"?handleLogin:handleRegister}>
          {loading?"Please wait…":mode==="login"?"Log In →":"Create Account →"}
        </button>
      </div>
    </div>
  );
}

// ─── SUBMIT PAGE ──────────────────────────────────────────────────────────────
function SubmitPage({entries,loadEntries,showToast,phase,playerUser,setPage,adminUser}){
  const[bag,setBag]=useState(emptyBag());
  const[imageData,setImageData]=useState(null);
  const[imagePreview,setImagePreview]=useState(null);
  const[saving,setSaving]=useState(false);
  const[activeCat,setActiveCat]=useState(Object.keys(ITEM_CATEGORIES)[0]);
  const[showSVSOnly,setShowSVSOnly]=useState(false);
  const[done,setDone]=useState(false);
  const[showFinalPrompt,setShowFinalPrompt]=useState(false);
  const fileRef=useRef();

  const existingEntry = playerUser ? entries.find(e=>e.id===playerUser.entryKey) : null;
  const playerState   = getPlayerSubmitState(existingEntry, phase);
  const isFinalWindow = phase.phase==="c1_final";
  const cycleKey      = `cycle${phase.cycle}`;

  // Pre-fill bag with latest saved bag
  useEffect(()=>{
    if(!playerUser) return;
    const load=async()=>{
      try{
        const d=await getEntry(playerUser.entryKey);
        if(d){
          const latest=d.cycle1_latestBag||d.latestBag||d.startBag||{};
          setBag({...emptyBag(),...latest});
        }
      }catch{}
    };
    load();
  },[playerUser]);

  if(!playerUser&&!adminUser) return(
    <div className="fade" style={{textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔐</div>
      <h2 style={{fontSize:22,fontWeight:700,color:TEXT,marginBottom:8}}>Login Required</h2>
      <p style={{color:MUTED,fontSize:14,marginBottom:24}}>Log in or create an account to submit your bag.</p>
      <button className="bp" onClick={()=>setPage("login")}>Go to Player Login →</button>
    </div>
  );

  if(!adminUser){
    if(phase.phase==="upcoming") return(
      <div className="fade" style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:52,marginBottom:16}}>📅</div>
        <h2 style={{fontSize:20,fontWeight:700,color:MUTED,marginBottom:8}}>Opens June 20</h2>
        <p style={{color:MUTED,fontSize:14}}>Submissions open June 20.</p>
      </div>
    );
    if(phase.phase==="locked") return(
      <div className="fade" style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:52,marginBottom:16}}>🔒</div>
        <h2 style={{fontSize:22,fontWeight:700,color:RED,marginBottom:8}}>SVS Prep Week — Locked</h2>
        <p style={{color:MUTED,fontSize:14,marginBottom:6}}>Use your items during prep week!</p>
        <p style={{color:ORANGE,fontSize:13,fontWeight:600}}>Cycle 2 opens July 18.</p>
      </div>
    );
    if(playerState==="final_locked"){
      const lockedBag=existingEntry?.cycle1_finalLatestBag||existingEntry?.cycle1_finalFirstBag||{};
      const lockedItems=Object.entries(lockedBag).filter(([,v])=>v!==""&&Number(v)>0);
      return(
        <div className="fade">
          <div style={{textAlign:"center",padding:"28px 20px 16px"}}>
            <div style={{fontSize:44,marginBottom:10}}>🏆</div>
            <h2 style={{fontSize:20,fontWeight:700,color:GOLD,marginBottom:6}}>Final Bag Locked In!</h2>
            <p style={{color:MUTED,fontSize:13}}>Your contest entry is complete. Check the leaderboard for your growth %.</p>
          </div>
          <LockedBagView items={lockedItems} label="Your Final Bag"/>
        </div>
      );
    }
  }

  // Admin override banner
  const showAdminBanner = adminUser && (phase.phase==="locked" || playerState==="final_locked" || playerState==="vanity");

  const handleFile=(file)=>{
    if(!file||!file.type.startsWith("image/")){showToast("Please select an image file.","error");return;}
    if(file.size>4.5*1024*1024){showToast("Image must be under 4.5MB.","error");return;}
    const reader=new FileReader();
    reader.onload=e=>{setImageData(e.target.result);setImagePreview(e.target.result);};
    reader.readAsDataURL(file);
  };

  const handleSubmit=async(asFinal=false)=>{
    setSaving(true);
    try{
      const existing=await getEntry(playerUser.entryKey)||{};
      const now=Date.now();
      const updated={
        ...existing,
        playerName:playerUser.playerName,
        gamerId:playerUser.gamerId,
        allianceTag:playerUser.allianceTag,
        updatedAt:now,
      };
      // Always save as latest bag (vanity/live leaderboard)
      updated.cycle1_latestBag=bag;
      updated.cycle1_latestAt=now;
      if(imageData) updated.cycle1_latestScreenshot=imageData;

      // Initial baseline (first ever submit)
      if(!existing.cycle1_firstAt){
        updated.cycle1_firstBag=bag;
        updated.cycle1_firstAt=now;
        if(imageData) updated.cycle1_firstScreenshot=imageData;
      }

      // Final bag submission
      if(asFinal || phase.phase==="c1_final"){
        if(!existing.cycle1_finalFirstAt){
          updated.cycle1_finalFirstBag=bag;
          updated.cycle1_finalFirstAt=now;
          if(imageData) updated.cycle1_finalFirstScreenshot=imageData;
        }
        updated.cycle1_finalLatestBag=bag;
        updated.cycle1_finalLatestAt=now;
      }

      await upsertEntry(updated);
      await loadEntries();
      setShowFinalPrompt(false);
      setDone(true);
    }catch{showToast("Failed to save. Try again.","error");}
    finally{setSaving(false);}
  };

  // Done / confirmation screen
  if(done){
    const filledItems=Object.entries(bag).filter(([,v])=>v!==""&&Number(v)>0);
    const isInitial=playerState==="submit_initial"||playerState==="edit_initial";
    return(
      <div className="fade">
        <div style={{textAlign:"center",padding:"28px 20px 20px"}}>
          <div style={{fontSize:46,marginBottom:10}}>✅</div>
          <h2 style={{fontSize:21,fontWeight:700,color:GREEN,marginBottom:6}}>Bag Saved!</h2>
          <p style={{color:MUTED,marginBottom:4}}>Recorded for <strong style={{color:ACCENT}}>{playerUser?.playerName}</strong></p>
          <p style={{color:MUTED,fontSize:12,marginBottom:20}}>{filledItems.length} items · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
          <button className="bp" onClick={()=>setDone(false)}>Update Bag</button>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:16}}>
          <h3 style={{fontSize:13,fontWeight:700,color:ACCENT,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>Your Submitted Bag</h3>
          {filledItems.length===0?<p style={{color:MUTED,fontSize:13,textAlign:"center",padding:"16px 0"}}>No items entered.</p>:(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:7}}>
              {filledItems.map(([name,val])=>{
                const isSVS=SVS_PRIORITY.has(name);
                return(
                  <div key={name} style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":BORDER}`,borderRadius:8,padding:"6px 9px"}}>
                    <ItemImg name={name} size={24}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:isSVS?TEXT:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                      {isSVS&&<span className="svs-badge">SVS ⭐</span>}
                    </div>
                    <span style={{fontWeight:700,fontSize:13,color:TEXT,flexShrink:0,marginRight:3}}>{Number(val).toLocaleString()}</span>
                    <button onClick={()=>setBag(p=>({...p,[name]:""}))} title="Remove"
                      style={{background:"none",border:"none",color:BORDER,fontSize:15,cursor:"pointer",padding:"0 1px",flexShrink:0,transition:"color 0.15s"}}
                      onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=BORDER}>×</button>
                  </div>
                );
              })}
            </div>
          )}
          {filledItems.length>0&&<p style={{color:MUTED,fontSize:11,textAlign:"center",marginTop:9}}>Hit × to remove an item, then click <strong>Update Bag</strong> to save.</p>}
        </div>
      </div>
    );
  }

  // Final bag prompt overlay
  if(showFinalPrompt) return(
    <div className="fade" style={{textAlign:"center",padding:"48px 20px"}}>
      <div style={{fontSize:48,marginBottom:14}}>🎯</div>
      <h2 style={{fontSize:22,fontWeight:700,color:GOLD,marginBottom:8}}>Submit as Final Bag?</h2>
      <p style={{color:MUTED,fontSize:14,maxWidth:440,margin:"0 auto 8px"}}>This will lock in your <strong style={{color:GOLD}}>official contest ending bag</strong>. You'll have 3 days to make edits, then it's final.</p>
      <p style={{color:MUTED,fontSize:13,marginBottom:28}}>Your bag will still save normally for the leaderboard regardless.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="bg" style={{padding:"10px 24px"}} onClick={()=>{setShowFinalPrompt(false);handleSubmit(false);}}>
          {saving?"Saving…":"Just Save (No Final)"}
        </button>
        <button className="bp" style={{background:GOLD,padding:"10px 24px"}} disabled={saving} onClick={()=>handleSubmit(true)}>
          {saving?"Saving…":"✓ Yes, Submit as Final Bag"}
        </button>
      </div>
    </div>
  );

  const filledCount=Object.values(bag).filter(v=>v!==""&&Number(v)>0).length;
  const cats=showSVSOnly?{"⭐ SVS Priority":ALL_ITEMS.filter(({name})=>SVS_PRIORITY.has(name)).map(({name})=>name)}:ITEM_CATEGORIES;
  const currentCatItems=cats[activeCat]||[];

  const getStatusBanner=()=>{
    if(playerState==="submit_initial") return {color:GREEN, msg:"📦 Submit your initial bag — this becomes your baseline for the contest."};
    if(playerState==="edit_initial"){
      const exp=(existingEntry?.cycle1_firstAt||existingEntry?.initialFirstAt||Date.now())+THREE_DAYS_MS;
      const d=Math.floor(Math.max(0,exp-Date.now())/86400000);
      const h=Math.floor((Math.max(0,exp-Date.now())%86400000)/3600000);
      return {color:ORANGE, msg:`✏️ Initial bag edit window — ${d}d ${h}h remaining. After this it locks as your baseline.`};
    }
    if(playerState==="vanity") return {color:ACCENT, msg:"🏆 Vanity period — keep adding items to climb the live leaderboard! Final bag opens Jul 10."};
    if(playerState==="prompt_final") return {color:GOLD, msg:"🎯 Final bag window is open! Save your bag and choose to submit it as your official final entry."};
    if(playerState==="edit_final"){
      const exp=(existingEntry?.cycle1_finalFirstAt||existingEntry?.finalFirstAt||Date.now())+THREE_DAYS_MS;
      const d=Math.floor(Math.max(0,exp-Date.now())/86400000);
      const h=Math.floor((Math.max(0,exp-Date.now())%86400000)/3600000);
      return {color:GOLD, msg:`🎯 Final bag edit window — ${d}d ${h}h remaining until locked.`};
    }
    return null;
  };
  const banner=getStatusBanner();

  return(
    <div className="fade">
      {showAdminBanner&&(
        <div style={{background:`${GOLD}12`,border:`1px solid ${GOLD}44`,borderRadius:8,padding:"9px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🔓</span>
          <span style={{fontSize:13,color:GOLD,fontWeight:600}}>Admin View — full access regardless of submission window.</span>
        </div>
      )}
      {playerUser&&(
        <BagPreviewBar playerUser={playerUser} phase={phase} filledCount={filledCount} bag={bag} setBag={setBag} playerState={playerState} existingEntry={existingEntry}/>
      )}
      {adminUser&&!playerUser&&(
        <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,padding:"10px 16px",marginBottom:16}}>
          <span style={{fontSize:13,color:MUTED}}>Viewing as admin — <span style={{color:ACCENT}}>{adminUser.email}</span></span>
        </div>
      )}
      {banner&&(
        <div style={{background:`${banner.color}12`,border:`1px solid ${banner.color}44`,borderRadius:8,padding:"9px 14px",marginBottom:14,fontSize:13,color:banner.color,fontWeight:600}}>
          {banner.msg}
        </div>
      )}

      {/* Screenshot upload */}
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:14,marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>📸 Bag Screenshot <span style={{color:MUTED,fontSize:11,textTransform:"none",fontWeight:400}}>(optional)</span></h3>
        <div onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()} onClick={()=>fileRef.current.click()}
          style={{border:`2px dashed ${imagePreview?ACCENT:BORDER}`,borderRadius:8,padding:"12px",textAlign:"center",cursor:"pointer",background:imagePreview?"#0f2030":"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:10,minHeight:60,transition:"all 0.2s"}}>
          {imagePreview?(<><img src={imagePreview} alt="preview" style={{maxHeight:100,maxWidth:160,borderRadius:5,objectFit:"contain"}}/><span style={{color:MUTED,fontSize:12}}>Click to replace</span></>)
          :(<><span style={{fontSize:22}}>📸</span><span style={{color:MUTED,fontSize:13}}>Drop or <span style={{color:ACCENT}}>click to browse</span> — PNG/JPG/WEBP up to 4.5MB</span></>)}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>

      {/* Category filters */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <button onClick={()=>{setShowSVSOnly(true);setActiveCat("⭐ SVS Priority");}}
          style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${showSVSOnly?GOLD:BORDER}`,background:showSVSOnly?`${GOLD}22`:"transparent",color:showSVSOnly?GOLD:MUTED,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>⭐ SVS Priority</button>
        <span style={{color:BORDER,fontSize:11}}>|</span>
        {Object.keys(ITEM_CATEGORIES).map(cat=>(
          <button key={cat} onClick={()=>{setShowSVSOnly(false);setActiveCat(cat);}}
            style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${!showSVSOnly&&activeCat===cat?ACCENT:BORDER}`,background:!showSVSOnly&&activeCat===cat?`${ACCENT}22`:"transparent",color:!showSVSOnly&&activeCat===cat?ACCENT:MUTED,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
          <h3 style={{fontSize:13,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.06em"}}>{showSVSOnly?"⭐ SVS Priority":activeCat}</h3>
          <span style={{fontSize:11,color:MUTED}}>{filledCount} items filled</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))",gap:7}}>
          {currentCatItems.map(item=>{
            const isSVS=SVS_PRIORITY.has(item);
            return(
              <div key={item} className="item-row" style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:bag[item]?`${ACCENT}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":bag[item]?ACCENT+"33":BORDER}`,borderRadius:8,padding:"6px 9px",transition:"background 0.15s"}}>
                <ItemImg name={item} size={26}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:isSVS?TEXT:MUTED,fontWeight:isSVS?600:400,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item}</div>
                  {isSVS&&<span className="svs-badge">SVS ⭐</span>}
                </div>
                <input type="number" min="0" className="fi" style={{width:76,textAlign:"right",padding:"4px 7px",fontSize:13,flexShrink:0}}
                  value={bag[item]} onChange={e=>setBag(p=>({...p,[item]:e.target.value}))} placeholder="0"/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button — shows final prompt during final window */}
      {playerState==="prompt_final"||playerState==="edit_final" ? (
        <div style={{display:"flex",gap:10}}>
          <button className="bp" style={{flex:1,background:CARD,border:`1px solid ${BORDER}`,color:MUTED}} disabled={saving} onClick={()=>handleSubmit(false)}>
            {saving?"Saving…":"Save (Vanity Only)"}
          </button>
          <button className="bp" style={{flex:2,background:GOLD}} disabled={saving} onClick={()=>setShowFinalPrompt(true)}>
            {saving?"Saving…":"🎯 Submit as Final Bag"}
          </button>
        </div>
      ):(
        <button className="bp" style={{width:"100%",padding:"12px"}} disabled={saving} onClick={()=>handleSubmit(false)}>
          {saving?"Saving…":playerState==="submit_initial"?"Submit Initial Bag ✓":"Save Bag Update ✓"}
        </button>
      )}
      <p style={{color:MUTED,fontSize:11,textAlign:"center",marginTop:8}}>
        {playerState==="submit_initial"?"Your first submission becomes your baseline. You have 3 days to edit it."
        :playerState==="edit_initial"?"Still within your 3-day edit window — updates replace your baseline."
        :playerState==="vanity"?"Vanity period — updates show on the live leaderboard but don't affect your contest score."
        :playerState==="prompt_final"?"Final window — submit as Final Bag for the official contest score, or just save for the leaderboard."
        :"Updates save to your bag and the leaderboard."}
      </p>
    </div>
  );
}

function LockedBagView({items,label}){
  return(
    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:16,marginTop:12}}>
      <div style={{fontSize:12,fontWeight:700,color:ACCENT,marginBottom:11,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label} ({items.length} items)</div>
      {items.length===0?<p style={{color:MUTED,fontSize:13}}>No items recorded.</p>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:6}}>
          {items.map(([name,val])=>{
            const isSVS=SVS_PRIORITY.has(name);
            return(
              <div key={name} style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"33":BORDER}`,borderRadius:7,padding:"5px 9px"}}>
                <ItemImg name={name} size={22}/>
                <span style={{flex:1,fontSize:11,color:isSVS?TEXT:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                <span style={{fontWeight:700,fontSize:13,color:TEXT}}>{Number(val).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPage({entries,loading}){
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:700,color:GOLD}}>🏆 Leaderboard</h2>
          <p style={{color:MUTED,fontSize:13,marginTop:3}}>Growth % updates live as players add items · Top 2 win prizes</p>
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

// ─── PLAYER WINDOW BADGE ──────────────────────────────────────────────────────
function PlayerWindowBadge({phase,playerState,existingEntry}){
  const isEdit=playerState==="edit_initial"||playerState==="edit_final";
  const isLocked=playerState==="baseline_locked"||playerState==="final_locked";
  const isSubmit=playerState==="submit_initial"||playerState==="submit_final";
  const isFinal=phase.phase==="c1_final";
  const[,setTick]=useState(0);
  useEffect(()=>{const id=setInterval(()=>setTick(t=>t+1),60000);return()=>clearInterval(id);},[]);

  if(isEdit){
    const firstAtKey=isFinal?"cycle1_finalFirstAt":"cycle1_firstAt";
    const firstAt=(existingEntry?.[firstAtKey]||existingEntry?.initialFirstAt);
    const expiresAt=firstAt?firstAt+THREE_DAYS_MS:null;
    const cd=expiresAt?Math.max(0,expiresAt-Date.now()):0;
    const d=Math.floor(cd/86400000),h=Math.floor((cd%86400000)/3600000),m=Math.floor((cd%3600000)/60000);
    return <span style={{fontSize:11,background:`${ORANGE}18`,color:ORANGE,border:`1px solid ${ORANGE}44`,borderRadius:4,padding:"2px 8px",fontWeight:600}}>✏️ Edit: {d}d {h}h {m}m left</span>;
  }
  if(playerState==="vanity") return <span style={{fontSize:11,background:`${ACCENT}18`,color:ACCENT,border:`1px solid ${ACCENT}44`,borderRadius:4,padding:"2px 8px",fontWeight:600}}>📊 Vanity — Live Leaderboard</span>;
  if(playerState==="prompt_final"||playerState==="edit_final") return <span style={{fontSize:11,background:`${GOLD}18`,color:GOLD,border:`1px solid ${GOLD}44`,borderRadius:4,padding:"2px 8px",fontWeight:600}}>🎯 Final Bag Window</span>;
  if(playerState==="final_locked") return <span style={{fontSize:11,background:`${GREEN}18`,color:GREEN,border:`1px solid ${GREEN}44`,borderRadius:4,padding:"2px 8px",fontWeight:600}}>✅ Final Locked</span>;
  if(isSubmit) return <span style={{fontSize:11,background:`${GREEN}18`,color:GREEN,border:`1px solid ${GREEN}44`,borderRadius:4,padding:"2px 8px",fontWeight:600}}>📦 Submit Initial Bag</span>;
  return <span style={{fontSize:11,background:CARD,color:MUTED,border:`1px solid ${BORDER}`,borderRadius:4,padding:"2px 8px",fontWeight:600}}>Cycle {phase.cycle}</span>;
}

// ─── BAG PREVIEW BAR ─────────────────────────────────────────────────────────
function BagPreviewBar({playerUser,phase,filledCount,bag,setBag,playerState,existingEntry}){
  const[open,setOpen]=useState(false);
  const filledItems=Object.entries(bag).filter(([,v])=>v!==""&&Number(v)>0);
  return(
    <>
      <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontWeight:700,color:ACCENT}}>{playerUser.playerName}</span>
          <span style={{background:`${ACCENT}18`,color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"1px 7px",fontSize:11}}>{playerUser.allianceTag}</span>
          <span style={{color:MUTED,fontSize:12}}>ID: {playerUser.gamerId}</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setOpen(o=>!o)}
            style={{fontSize:12,color:filledCount>0?ACCENT:MUTED,background:filledCount>0?`${ACCENT}18`:"transparent",border:`1px solid ${filledCount>0?ACCENT+"44":BORDER}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
            {filledCount} item{filledCount!==1?"s":""} {filledCount>0?(open?"▲":"▼"):""}</button>
          <PlayerWindowBadge phase={phase} playerState={playerState} existingEntry={existingEntry}/>
        </div>
      </div>
      {open&&filledItems.length>0&&(
        <div style={{background:CARD,border:`1px solid ${ACCENT}44`,borderRadius:10,padding:12,marginBottom:14,animation:"fadeIn 0.2s ease"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.08em"}}>Current Bag ({filledItems.length} items)</span>
            <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",color:MUTED,fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:6}}>
            {filledItems.map(([name,val])=>{
              const isSVS=SVS_PRIORITY.has(name);
              return(
                <div key={name} style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"33":BORDER}`,borderRadius:7,padding:"5px 8px"}}>
                  <ItemImg name={name} size={22}/>
                  <div style={{flex:1,minWidth:0,fontSize:11,color:isSVS?TEXT:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                  <span style={{fontWeight:700,fontSize:13,color:TEXT,flexShrink:0,marginRight:3}}>{Number(val).toLocaleString()}</span>
                  <button onClick={()=>setBag(p=>({...p,[name]:""}))} style={{background:"none",border:"none",color:BORDER,fontSize:15,cursor:"pointer",lineHeight:1,flexShrink:0,transition:"color 0.15s"}}
                    onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=BORDER}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({setAdminUser,setPage,showToast}){
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[loading,setLoading]=useState(false);
  const handle=async()=>{
    setLoading(true);
    try{
      if(email.trim().toLowerCase()===OWNER_EMAIL&&btoa(pass)===OWNER_PASS_HASH){setAdminUser({email:OWNER_EMAIL,role:"owner"});setPage("adminPanel");showToast("Welcome, Owner!");return;}
      const found=await findAdmin(email.trim().toLowerCase(),btoa(pass));
      if(found){setAdminUser({email:found.email,role:"admin"});setPage("adminPanel");showToast(`Welcome, ${found.email}!`);return;}
      showToast("Invalid email or password.","error");
    }finally{setLoading(false);}
  };
  return(
    <div className="fade" style={{maxWidth:400,margin:"0 auto",paddingTop:16}}>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:26}}>
        <h2 style={{fontSize:20,fontWeight:700,color:TEXT,marginBottom:4}}>Admin Login</h2>
        <p style={{color:MUTED,fontSize:13,marginBottom:20}}>Owner & admins only</p>
        <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Email</label>
        <input className="fi" style={{marginBottom:12}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" onKeyDown={e=>e.key==="Enter"&&handle()}/>
        <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Password</label>
        <input className="fi" style={{marginBottom:20}} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()}/>
        <button className="bp" style={{width:"100%"}} disabled={loading} onClick={handle}>{loading?"Checking…":"Log In"}</button>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({entries,loadEntries,showToast,adminUser,isOwner}){
  const[tab,setTab]=useState("entries");
  const[editEntry,setEditEntry]=useState(null);
  const[admins,setAdmins]=useState([]);
  const[newEmail,setNewEmail]=useState("");const[newPass,setNewPass]=useState("");
  const[loadingA,setLoadingA]=useState(false);

  useEffect(()=>{if(isOwner)loadAdmins();},[isOwner]);
  const loadAdmins=async()=>{setLoadingA(true);try{const list=await getAdmins();setAdmins(list);}catch{setAdmins([]);}finally{setLoadingA(false);}};
  const addAdminHandler=async()=>{
    if(!newEmail.trim()||!newPass.trim()){showToast("Email and password required.","error");return;}
    if(admins.find(a=>a.email.toLowerCase()===newEmail.trim().toLowerCase())){showToast("Already exists.","error");return;}
    await addAdmin(newEmail.trim().toLowerCase(),btoa(newPass));
    await loadAdmins();
    setNewEmail("");setNewPass("");showToast("Admin added!");
  };
  const deleteEntryHandler=async(entry)=>{try{await deleteEntry(entry.id);await loadEntries();showToast("Entry deleted.");}catch{showToast("Failed.","error");}};

  if(editEntry) return<EditEntry entry={editEntry} onSave={async(updated)=>{try{await upsertEntry(updated);await loadEntries();setEditEntry(null);showToast("Saved!");}catch{showToast("Failed.","error");}}} onCancel={()=>setEditEntry(null)}/>;

  const fmtDate=ts=>ts?new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"—";

  return(
    <div className="fade">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:700,color:TEXT}}>Admin Panel</h2>
          <p style={{color:MUTED,fontSize:13}}>Logged in as <span style={{color:ACCENT}}>{adminUser.email}</span> · <span style={{color:GOLD,textTransform:"capitalize"}}>{adminUser.role}</span></p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="bg" onClick={()=>setTab("entries")} style={tab==="entries"?{borderColor:ACCENT,color:ACCENT}:{}}>Entries ({entries.length})</button>
          {isOwner&&<button className="bg" onClick={()=>setTab("admins")} style={tab==="admins"?{borderColor:GOLD,color:GOLD}:{}}>Manage Admins</button>}
        </div>
      </div>

      {tab==="entries"&&(entries.length===0?<EmptyState icon="📋" text="No entries yet."/>:(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {entries.map(entry=>{
            const start=entry.cycle1_firstBag||entry.startBag||{};
            const end=entry.cycle1_finalLatestBag||entry.cycle1_latestBag||entry.latestBag||{};
            let ts=0,te=0;
            ALL_ITEMS.forEach(({name})=>{const s=Number(start[name])||0;const e=Number(end[name])||0;if(s>0){ts+=s;te+=e;}});
            const growth=ts>0?((te-ts)/ts*100).toFixed(1):null;
            const hasFinal=!!entry.cycle1_finalLatestBag;
            return(
              <div key={entry.id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{entry.playerName}</div>
                    <div style={{fontSize:11,color:MUTED}}>ID: {entry.gamerId} · {entry.allianceTag}</div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {entry.cycle1_firstBag&&<span style={{background:`${GREEN}15`,color:GREEN,border:`1px solid ${GREEN}33`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>✓ Initial</span>}
                    {entry.cycle1_latestBag&&<span style={{background:`${ACCENT}15`,color:ACCENT,border:`1px solid ${ACCENT}33`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>✓ Latest</span>}
                    {hasFinal&&<span style={{background:`${GOLD}15`,color:GOLD,border:`1px solid ${GOLD}33`,borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:600}}>✓ Final</span>}
                  </div>
                  {growth!==null&&<span style={{fontSize:13,fontWeight:700,color:Number(growth)>=0?(hasFinal?GREEN:ACCENT):RED}}>{Number(growth)>=0?"+":""}{growth}% {hasFinal?"":"(live)"}</span>}
                  <span style={{fontSize:10,color:MUTED}}>Updated: {fmtDate(entry.updatedAt)}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button className="bg" onClick={()=>setEditEntry(entry)}>Edit</button>
                  <button className="bd" onClick={()=>deleteEntryHandler(entry)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tab==="admins"&&isOwner&&(
        <div>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:20,marginBottom:16,maxWidth:480}}>
            <h3 style={{fontSize:14,fontWeight:700,color:GOLD,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>Add Admin</h3>
            <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,fontWeight:600}}>Email</label>
            <input className="fi" style={{marginBottom:10}} type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="admin@example.com"/>
            <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,fontWeight:600}}>Password</label>
            <input className="fi" style={{marginBottom:12}} type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="••••••••"/>
            <button className="bp" onClick={addAdminHandler}>Add Admin</button>
          </div>
          <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"9px 16px",background:CARD2,fontSize:10,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600}}>Admins</div>
            <div style={{padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${BORDER}`}}>
              <span style={{fontWeight:600}}>{OWNER_EMAIL}</span>
              <span style={{background:`${GOLD}20`,color:GOLD,border:`1px solid ${GOLD}33`,borderRadius:4,padding:"1px 7px",fontSize:10}}>Owner</span>
            </div>
            {loadingA?<p style={{color:MUTED,padding:14}}>Loading…</p>:admins.length===0?<p style={{color:MUTED,padding:14,fontSize:13}}>No admins added yet.</p>:admins.map(a=>(
              <div key={a.email} style={{padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${BORDER}`}}>
                <span style={{fontWeight:600}}>{a.email}</span>
                <button className="bd" onClick={async()=>{await removeAdmin(a.email);await loadAdmins();showToast("Removed.");}}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EDIT ENTRY ───────────────────────────────────────────────────────────────
function EditEntry({entry,onSave,onCancel}){
  const[data,setData]=useState({...entry});
  const getDefaultTab=()=>{
    const tabs=["cycle1_firstBag","cycle1_latestBag","cycle1_finalLatestBag","startBag","latestBag"];
    return tabs.find(t=>entry[t]&&Object.values(entry[t]).some(v=>v!==""&&Number(v)>0))||"cycle1_firstBag";
  };
  const[bagTab,setBagTab]=useState(getDefaultTab());
  const[activeCat,setActiveCat]=useState(Object.keys(ITEM_CATEGORIES)[0]);
  const[saving,setSaving]=useState(false);
  const bag=data[bagTab]||{};
  const setBV=(k,item,val)=>setData(p=>({...p,[k]:{...(p[k]||{}),[item]:val}}));
  const bagTabs=[
    {key:"cycle1_firstBag",label:"Initial Bag"},
    {key:"cycle1_latestBag",label:"Latest/Vanity"},
    {key:"cycle1_finalLatestBag",label:"Final Bag"},
  ];
  return(
    <div className="fade">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
        <button className="bg" onClick={onCancel}>← Back</button>
        <div><h2 style={{fontSize:18,fontWeight:700,color:TEXT}}>Edit: {entry.playerName}</h2><p style={{color:MUTED,fontSize:12}}>ID: {entry.gamerId} · {entry.allianceTag}</p></div>
      </div>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:16,marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[["playerName","Player Name"],["gamerId","Gamer ID"],["allianceTag","Alliance Tag"]].map(([k,l])=>(
          <div key={k}>
            <label style={{display:"block",fontSize:10,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4,fontWeight:600}}>{l}</label>
            <input className="fi" value={data[k]||""} onChange={e=>setData(p=>({...p,[k]:e.target.value}))}/>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {bagTabs.map(t=>(
          <button key={t.key} onClick={()=>setBagTab(t.key)} style={{padding:"6px 14px",borderRadius:8,border:`2px solid ${bagTab===t.key?ACCENT:BORDER}`,background:bagTab===t.key?`${ACCENT}18`:"transparent",color:bagTab===t.key?ACCENT:MUTED,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
        {Object.keys(ITEM_CATEGORIES).map(cat=>(
          <button key={cat} onClick={()=>setActiveCat(cat)} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${activeCat===cat?ACCENT:BORDER}`,background:activeCat===cat?`${ACCENT}22`:"transparent",color:activeCat===cat?ACCENT:MUTED,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{cat}</button>
        ))}
      </div>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))",gap:7}}>
          {ITEM_CATEGORIES[activeCat].map(item=>{
            const isSVS=SVS_PRIORITY.has(item);
            return(
              <div key={item} style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":BORDER}`,borderRadius:8,padding:"6px 9px"}}>
                <ItemImg name={item} size={24}/>
                <div style={{flex:1,fontSize:11,color:isSVS?TEXT:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item}</div>
                <input type="number" min="0" className="fi" style={{width:76,textAlign:"right",padding:"4px 7px",fontSize:13}} value={bag[item]||""} onChange={e=>setBV(bagTab,item,e.target.value)} placeholder="0"/>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="bg" onClick={onCancel}>Cancel</button>
        <button className="bp" style={{flex:1}} disabled={saving} onClick={async()=>{setSaving(true);await onSave(data);setSaving(false);}}>{saving?"Saving…":"Save Changes ✓"}</button>
      </div>
    </div>
  );
}

function ScheduleBlock(){
  return(
    <div style={{display:"inline-block",background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 20px",marginTop:16,textAlign:"left"}}>
      {[{l:"Baseline Window",d:"Jun 20 – Jul 1",c:GREEN},{l:"Vanity Period",d:"Jul 2 – Jul 9",c:ACCENT},{l:"Final Bag Window",d:"Jul 10 – 12",c:GOLD},{l:"Prep Week (Locked)",d:"Jul 13 – 17",c:RED}].map(r=>(
        <div key={r.d} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:r.c,flexShrink:0,display:"inline-block"}}/>
          <span style={{fontSize:13,color:r.c,fontWeight:600}}>{r.l}</span>
          <span style={{fontSize:12,color:MUTED,marginLeft:"auto",paddingLeft:16}}>{r.d}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({icon,text}){
  return(<div style={{textAlign:"center",padding:"52px 0",color:MUTED}}><div style={{fontSize:42,marginBottom:12}}>{icon}</div><p style={{fontSize:14}}>{text}</p></div>);
}
