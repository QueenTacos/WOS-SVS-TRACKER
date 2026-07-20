import { useState } from 'react';
import { ItemImg } from './ItemImg.jsx';
import { PlayerWindowBadge } from './PlayerWindowBadge.jsx';
import { SVS_PRIORITY } from '../lib/items.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, MUTED, RED, TEXT } from '../lib/theme.js';

export function BagPreviewBar({playerUser,phase,filledCount,bag,setBag,playerState,existingEntry}){
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
