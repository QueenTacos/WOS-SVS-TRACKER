import { useState } from 'react';
import { ItemImg } from '../components/ItemImg.jsx';
import { ITEM_CATEGORIES, SVS_PRIORITY } from '../lib/items.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, MUTED, TEXT } from '../lib/theme.js';

export function EditEntry({entry,onSave,onCancel}){
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
