import { useState, useEffect } from 'react';
import { getCycleArchiveLabels, getCycleArchiveResults } from '../supabase.js';
import { EmptyState } from '../components/EmptyState.jsx';
import { ALL_ITEMS } from '../lib/items.js';
import { BORDER, CARD, GOLD, GREEN, MUTED, RED } from '../lib/theme.js';

export function CycleHistoryPanel({showToast}){
  const[labels,setLabels]=useState([]);
  const[selected,setSelected]=useState(null);
  const[results,setResults]=useState([]);
  const[loading,setLoading]=useState(true);
  const[loadingResults,setLoadingResults]=useState(false);

  useEffect(()=>{ loadLabels(); },[]);

  const loadLabels=async()=>{
    setLoading(true);
    try{
      const list=await getCycleArchiveLabels();
      setLabels(list);
      if(list.length>0) selectCycle(list[0].cycle_label);
    }catch{ showToast("Failed to load cycle history.","error"); }
    finally{ setLoading(false); }
  };

  const selectCycle=async(label)=>{
    setSelected(label);
    setLoadingResults(true);
    try{ setResults(await getCycleArchiveResults(label)); }
    catch{ showToast("Failed to load results.","error"); }
    finally{ setLoadingResults(false); }
  };

  const growthFor=(row)=>{
    if(!row.first_bag) return null;
    let ts=0,te=0;
    const end=row.final_bag||row.latest_bag||{};
    ALL_ITEMS.forEach(({name})=>{
      const s=Number(row.first_bag[name])||0;
      const e=Number(end[name])||0;
      if(s>0){ ts+=s; te+=e; }
    });
    return ts>0?((te-ts)/ts*100).toFixed(1):null;
  };

  if(loading) return <p style={{color:MUTED,padding:20,textAlign:"center"}}>Loading…</p>;
  if(labels.length===0) return <EmptyState icon="📜" text="No past cycles archived yet. Use 'Archive & Start New Cycle' on the Dates tab when a cycle ends."/>;

  const sorted=[...results].sort((a,b)=>{
    const ga=Number(growthFor(a))||-Infinity, gb=Number(growthFor(b))||-Infinity;
    return gb-ga;
  });

  return(
    <div className="fade">
      <h3 style={{fontSize:16,fontWeight:700,color:GOLD,marginBottom:14}}>📜 Past Cycles</h3>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {labels.map(l=>(
          <button
            key={l.cycle_label}
            className="bg"
            style={selected===l.cycle_label?{borderColor:GOLD,color:GOLD}:{}}
            onClick={()=>selectCycle(l.cycle_label)}
          >
            {l.cycle_label}
          </button>
        ))}
      </div>

      {loadingResults?<p style={{color:MUTED,padding:20,textAlign:"center"}}>Loading…</p>:(
        results.length===0?<EmptyState icon="📭" text="No results recorded for this cycle."/>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sorted.map((row,i)=>{
              const growth=growthFor(row);
              return(
                <div key={row.id||row.entry_id} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:700,color:MUTED,width:24}}>#{i+1}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{row.player_name}</div>
                      <div style={{fontSize:11,color:MUTED}}>ID: {row.gamer_id} · {row.alliance_tag}</div>
                    </div>
                  </div>
                  {growth!==null&&<span style={{fontSize:13,fontWeight:700,color:Number(growth)>=0?GREEN:RED}}>{Number(growth)>=0?"+":""}{growth}%</span>}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
