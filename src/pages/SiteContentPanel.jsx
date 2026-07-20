import { useState, useEffect } from 'react';
import { getSiteContent, saveSiteContent } from '../supabase.js';
import { DEFAULT_SITE_CONTENT } from '../lib/siteContent.js';
import { ACCENT, BORDER, CARD, CARD2, MUTED, ORANGE } from '../lib/theme.js';

export function SiteContentPanel({showToast,setSiteContent}){
  const[c,setC]=useState({...DEFAULT_SITE_CONTENT});
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[newRule,setNewRule]=useState("");

  useEffect(()=>{
    getSiteContent().then(saved=>{ if(saved) setC({...DEFAULT_SITE_CONTENT,...saved,rules:saved.rules||DEFAULT_SITE_CONTENT.rules}); })
    .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const handleSave=async()=>{
    setSaving(true);
    try{
      await saveSiteContent(c);
      if(setSiteContent) setSiteContent(c); // update App state so pages refresh immediately
      showToast("Site content saved!");
    }
    catch{ showToast("Failed to save.","error"); }
    finally{ setSaving(false); }
  };

  const addRule=()=>{
    if(!newRule.trim()) return;
    setC(p=>({...p,rules:[...p.rules,newRule.trim()]}));
    setNewRule("");
  };

  const removeRule=(i)=>setC(p=>({...p,rules:p.rules.filter((_,j)=>j!==i)}));
  const moveRule=(i,dir)=>{
    const rules=[...c.rules];
    const j=i+dir;
    if(j<0||j>=rules.length) return;
    [rules[i],rules[j]]=[rules[j],rules[i]];
    setC(p=>({...p,rules}));
  };

  if(loading) return <p style={{color:MUTED,padding:20,textAlign:"center"}}>Loading…</p>;

  const fields=[
    {key:"title",label:"🏆 Competition Title",rows:1,section:"Leaderboard Page"},
    {key:"description",label:"Description",rows:3,section:"Leaderboard Page"},
    {key:"how_it_works",label:"How It Works",rows:4,section:"Leaderboard Page"},
    {key:"prize",label:"The Prize",rows:2,section:"Leaderboard Page"},
    {key:"what_counts",label:"What Counts",rows:3,section:"Leaderboard Page"},
    {key:"footer",label:"Footer Text",rows:1,section:"Leaderboard Page"},
    {key:"howto_intro",label:"📋 How To Page — Intro",rows:2,section:"How To Page"},
    {key:"step1_title",label:"Step 1 Title",rows:1,section:"How To Page"},
    {key:"step1_text",label:"Step 1 Text",rows:4,section:"How To Page"},
    {key:"step2_title",label:"Step 2 Title",rows:1,section:"How To Page"},
    {key:"step2_text",label:"Step 2 Text",rows:4,section:"How To Page"},
    {key:"step3_title",label:"Step 3 Title",rows:1,section:"How To Page"},
    {key:"step3_text",label:"Step 3 Text",rows:4,section:"How To Page"},
    {key:"step4_title",label:"Step 4 Title",rows:1,section:"How To Page"},
    {key:"step4_text",label:"Step 4 Text",rows:4,section:"How To Page"},
  ];

  return(
    <div className="fade">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <h3 style={{fontSize:16,fontWeight:700,color:ACCENT}}>✏️ Site Content</h3>
        <div style={{display:"flex",gap:8}}>
          <button className="bg" onClick={()=>setC({...DEFAULT_SITE_CONTENT})}>Reset to Defaults</button>
          <button className="bp" disabled={saving} onClick={handleSave}>{saving?"Saving…":"Save Content ✓"}</button>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {fields.reduce((acc,field,i)=>{
          const prev=fields[i-1];
          if(!prev||prev.section!==field.section){
            acc.push(<div key={`section_${field.section}`} style={{fontSize:12,fontWeight:700,color:ORANGE,textTransform:"uppercase",letterSpacing:"0.1em",marginTop:i>0?8:0,marginBottom:4}}>{field.section}</div>);
          }
          acc.push(
            <div key={field.key} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:14}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{field.label}</label>
              {field.rows===1?(
                <input className="fi" value={c[field.key]||""} onChange={e=>setC(p=>({...p,[field.key]:e.target.value}))}/>
              ):(
                <textarea className="fi" rows={field.rows} value={c[field.key]||""} onChange={e=>setC(p=>({...p,[field.key]:e.target.value}))}
                  style={{resize:"vertical",lineHeight:1.6}}/>
              )}
            </div>
          );
          return acc;
        },[])}

        {/* Rules editor */}
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:14}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>📋 Rules</label>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
            {(c.rules||[]).map((rule,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"center",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:7,padding:"7px 10px"}}>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <button onClick={()=>moveRule(i,-1)} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:10,lineHeight:1,padding:"1px 4px"}}>▲</button>
                  <button onClick={()=>moveRule(i,1)} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:10,lineHeight:1,padding:"1px 4px"}}>▼</button>
                </div>
                <input className="fi" value={rule} onChange={e=>{const r=[...c.rules];r[i]=e.target.value;setC(p=>({...p,rules:r}));}} style={{flex:1}}/>
                <button className="bd" onClick={()=>removeRule(i)} style={{padding:"4px 10px",fontSize:12}}>×</button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input className="fi" value={newRule} onChange={e=>setNewRule(e.target.value)} placeholder="Add a new rule…" onKeyDown={e=>e.key==="Enter"&&addRule()} style={{flex:1}}/>
            <button className="bp" onClick={addRule} style={{padding:"7px 16px"}}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
