import { useState } from 'react';
import { saveSettings } from '../supabase.js';
import { CYCLE_DATES, DEFAULT_DATES, getPhaseFromDates, setCycleDates } from '../lib/cycles.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, GREEN, MUTED, ORANGE, RED } from '../lib/theme.js';

export function DateSettingsPanel({showToast}){
  const[dates,setDates]=useState({...CYCLE_DATES});
  const[saving,setSaving]=useState(false);

  const fields=[
    {key:"c1_baseline_start",label:"Cycle 1 — Baseline Window Opens",color:GREEN},
    {key:"c1_baseline_end",  label:"Cycle 1 — Baseline Window Closes",color:GREEN},
    {key:"c1_final_start",   label:"Cycle 1 — Final Bag Window Opens",color:GOLD},
    {key:"c1_final_end",     label:"Cycle 1 — Final Bag Window Closes (hard lock)",color:GOLD},
    {key:"c1_prep_end",      label:"Cycle 1 — Prep Week Ends / Site Unlocks",color:RED},
    {key:"c2_start",         label:"Cycle 2 — Opens",color:ACCENT},
    {key:"c2_end",           label:"Cycle 2 — Closes",color:ACCENT},
    {key:"c2_prep_end",      label:"Cycle 2 — Prep Week Ends",color:RED},
  ];

  const handleSave=async()=>{
    setSaving(true);
    try{
      await saveSettings(dates);
      setCycleDates({...dates});
      showToast("Cycle dates saved!");
    }catch{showToast("Failed to save dates.","error");}
    finally{setSaving(false);}
  };

  const resetDefaults=()=>{
    setDates({...DEFAULT_DATES});
    showToast("Reset to defaults — click Save to apply.");
  };

  // Preview what phase would be active with current settings
  const preview=getPhaseFromDates(dates);

  return(
    <div className="fade">
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <h3 style={{fontSize:15,fontWeight:700,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.06em"}}>📅 Cycle Date Settings</h3>
          <div style={{display:"flex",gap:8}}>
            <button className="bg" onClick={resetDefaults}>Reset to Defaults</button>
            <button className="bp" disabled={saving} onClick={handleSave} style={{background:ORANGE}}>
              {saving?"Saving…":"Save Dates ✓"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div style={{background:`${preview.phase==="locked"?RED:GREEN}18`,border:`1px solid ${preview.phase==="locked"?RED:GREEN}44`,borderRadius:8,padding:"10px 14px",marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>{preview.phase==="locked"?"🔒":"✅"}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:preview.phase==="locked"?RED:GREEN}}>Current Phase: {preview.label}</div>
            <div style={{fontSize:11,color:MUTED}}>Based on dates below — updates live as you change them</div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {fields.map(({key,label,color})=>(
            <div key={key} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,alignItems:"center",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:8,padding:"10px 14px"}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
                <div style={{fontSize:11,color:MUTED}}>{new Date(dates[key]).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
              <input
                type="datetime-local"
                className="fi"
                style={{width:200,fontSize:12}}
                value={dates[key].slice(0,16)}
                onChange={e=>setDates(p=>({...p,[key]:e.target.value+":00"}))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
