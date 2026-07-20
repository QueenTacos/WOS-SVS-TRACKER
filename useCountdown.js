import { useState } from 'react';
import { BORDER, CARD, CARD2, GREEN, MUTED, TEXT } from '../lib/theme.js';

export function CycleCard({cycle,isNew,dateFields,expanded,saving,onToggle,onSave,onCancel,onToggleHide,onDelete,cycleStatus,isOwner}){
  const[data,setData]=useState({...cycle});
  const status=cycleStatus(data);
  const isSaving=saving===data.id;

  return(
    <div style={{background:CARD,border:`1px solid ${data.hidden?BORDER:status.color+"44"}`,borderRadius:10,overflow:"hidden"}}>
      {/* Header row */}
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,cursor:isNew?"default":"pointer",flexWrap:"wrap"}}
        onClick={isNew?undefined:onToggle}>
        <div style={{flex:1,minWidth:0}}>
          {expanded?(
            <input className="fi" value={data.name} onChange={e=>setData(p=>({...p,name:e.target.value}))}
              onClick={e=>e.stopPropagation()}
              style={{fontSize:15,fontWeight:700,marginBottom:4}}/>
          ):(
            <div style={{fontWeight:700,fontSize:15,color:data.hidden?MUTED:TEXT}}>{data.name}</div>
          )}
          <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
            <span style={{background:`${status.color}20`,color:status.color,border:`1px solid ${status.color}44`,borderRadius:4,padding:"1px 8px",fontSize:11,fontWeight:700}}>{status.label}</span>
            {data.c1_baseline_start&&<span style={{fontSize:11,color:MUTED}}>{new Date(data.c1_baseline_start).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} – {data.c1_final_end?new Date(data.c1_final_end).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"?"}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
          {!isNew&&isOwner&&onToggleHide&&(
            <button className="bg" onClick={()=>onToggleHide(data)}
              style={{fontSize:12,borderColor:data.hidden?GREEN:MUTED,color:data.hidden?GREEN:MUTED}}>
              {data.hidden?"👁 Show":"🙈 Hide"}
            </button>
          )}
          {!isNew&&isOwner&&onDelete&&<button className="bd" onClick={onDelete}>Delete</button>}
          {!isNew&&!isOwner&&<span style={{fontSize:10,color:MUTED,fontStyle:"italic"}}>Owner only: hide/delete</span>}
          {!isNew&&<span style={{color:MUTED,fontSize:16}}>{expanded?"▲":"▼"}</span>}
        </div>
      </div>

      {/* Expanded date fields */}
      {expanded&&(
        <div style={{borderTop:`1px solid ${BORDER}`,padding:16}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            {dateFields.map(({key,label,color})=>(
              <div key={key} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"center",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:7,padding:"8px 12px"}}>
                <div style={{fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
                <input type="datetime-local" className="fi" style={{width:190,fontSize:12}}
                  value={data[key]?data[key].slice(0,16):""}
                  onChange={e=>setData(p=>({...p,[key]:e.target.value+":00"}))}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="bg" onClick={isNew?onCancel:onToggle}>Cancel</button>
            <button className="bp" style={{flex:1,background:GREEN}} disabled={isSaving}
              onClick={()=>onSave(data)}>
              {isSaving?"Saving…":"Save Cycle ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
