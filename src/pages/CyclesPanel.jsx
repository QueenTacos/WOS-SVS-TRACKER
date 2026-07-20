import { useState, useEffect } from 'react';
import { getCycles, upsertCycle, deleteCycle } from '../supabase.js';
import { CycleCard } from '../components/CycleCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ACCENT, CARD, GOLD, GREEN, MUTED, RED, TEXT } from '../lib/theme.js';

export function CyclesPanel({showToast,isOwner}){
  const[cycles,setCycles]=useState([]);
  const[loading,setLoading]=useState(true);
  const[expanded,setExpanded]=useState(null);
  const[adding,setAdding]=useState(false);
  const[saving,setSaving]=useState(null);
  const[deleteConfirm,setDeleteConfirm]=useState(null);

  useEffect(()=>{ loadCycles(); },[]);

  const loadCycles=async()=>{
    setLoading(true);
    try{ const list=await getCycles(); setCycles(list); }
    catch{ showToast("Failed to load cycles.","error"); }
    finally{ setLoading(false); }
  };

  const newCycle=()=>({
    id:`cycle_${Date.now()}`,
    name:"New SVS Cycle",
    hidden:false,
    c1_baseline_start:"",
    c1_baseline_end:"",
    c1_final_start:"",
    c1_final_end:"",
    c1_prep_end:"",
    created_at:new Date().toISOString(),
  });

  const handleSave=async(cycle)=>{
    setSaving(cycle.id);
    try{
      await upsertCycle(cycle);
      await loadCycles();
      showToast("Cycle saved!");
      if(adding) setAdding(false);
    }catch{ showToast("Failed to save.","error"); }
    finally{ setSaving(null); }
  };

  const handleDelete=async(id)=>{
    try{
      await deleteCycle(id);
      await loadCycles();
      setDeleteConfirm(null);
      setExpanded(null);
      showToast("Cycle deleted.");
    }catch{ showToast("Failed to delete.","error"); }
  };

  const toggleHide=async(cycle)=>{
    const updated={...cycle,hidden:!cycle.hidden};
    await handleSave(updated);
  };

  const cycleStatus=(cycle)=>{
    if(cycle.hidden) return {label:"Hidden",color:MUTED};
    const now=new Date();
    if(cycle.c1_final_end && now > new Date(cycle.c1_prep_end||cycle.c1_final_end)) return {label:"Completed",color:ACCENT};
    if(cycle.c1_baseline_start && now >= new Date(cycle.c1_baseline_start)) return {label:"Active",color:GREEN};
    if(cycle.c1_baseline_start && now < new Date(cycle.c1_baseline_start)) return {label:"Upcoming",color:GOLD};
    return {label:"Draft",color:MUTED};
  };

  const DATE_FIELDS=[
    {key:"c1_baseline_start",label:"Baseline Opens",color:GREEN},
    {key:"c1_baseline_end",  label:"Baseline Closes",color:GREEN},
    {key:"c1_final_start",   label:"Final Bag Opens",color:GOLD},
    {key:"c1_final_end",     label:"Final Bag Closes (hard lock)",color:GOLD},
    {key:"c1_prep_end",      label:"Prep Week Ends / Unlocks",color:RED},
  ];

  return(
    <div className="fade">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <h3 style={{fontSize:16,fontWeight:700,color:GREEN}}>🔄 SVS Cycles</h3>
        <button className="bp" style={{background:GREEN}} onClick={()=>{setAdding(true);setExpanded("new");}}>+ Add Cycle</button>
      </div>

      {loading?<p style={{color:MUTED,padding:20,textAlign:"center"}}>Loading…</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>

          {/* New cycle form */}
          {adding&&(
            <CycleCard
              cycle={newCycle()} isNew={true}
              dateFields={DATE_FIELDS}
              expanded={true}
              saving={saving}
              onSave={handleSave}
              onCancel={()=>setAdding(false)}
              onToggleHide={null}
              onDelete={null}
              cycleStatus={cycleStatus}
              showToast={showToast}
              isOwner={isOwner}
            />
          )}

          {cycles.length===0&&!adding?<EmptyState icon="🔄" text="No cycles yet. Add one to get started."/>:(
            cycles.map(cycle=>(
              <CycleCard
                key={cycle.id}
                cycle={cycle} isNew={false}
                dateFields={DATE_FIELDS}
                expanded={expanded===cycle.id}
                saving={saving}
                onToggle={()=>setExpanded(expanded===cycle.id?null:cycle.id)}
                onSave={handleSave}
                onCancel={()=>setExpanded(null)}
                onToggleHide={isOwner?toggleHide:null}
                onDelete={isOwner?()=>setDeleteConfirm(cycle.id):null}
                cycleStatus={cycleStatus}
                showToast={showToast}
                isOwner={isOwner}
              />
            ))
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:CARD,border:`1px solid ${RED}`,borderRadius:12,padding:28,maxWidth:380,width:"100%"}}>
            <h3 style={{fontSize:18,fontWeight:700,color:RED,marginBottom:8}}>Delete Cycle?</h3>
            <p style={{color:MUTED,fontSize:13,marginBottom:20}}>This removes the cycle from the list. Player bag data for this cycle is <strong style={{color:TEXT}}>not deleted</strong> — it stays in the database.</p>
            <div style={{display:"flex",gap:10}}>
              <button className="bg" style={{flex:1}} onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button className="bd" style={{flex:1}} onClick={()=>handleDelete(deleteConfirm)}>Delete Cycle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
