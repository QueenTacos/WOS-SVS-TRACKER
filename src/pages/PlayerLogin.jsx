import { useState, useRef } from 'react';
import { getEntry, upsertEntry } from '../supabase.js';
import { ACCENT, BORDER, CARD, GREEN, MUTED, TEXT } from '../lib/theme.js';

export function PlayerLogin({setPlayerUser,setPage,showToast,loadEntries}){
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
