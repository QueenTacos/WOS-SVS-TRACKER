import { useState, useEffect } from 'react';
import { THREE_DAYS_MS } from '../lib/cycles.js';
import { ACCENT, BORDER, CARD, GOLD, GREEN, MUTED, ORANGE } from '../lib/theme.js';

export function PlayerWindowBadge({phase,playerState,existingEntry}){
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
