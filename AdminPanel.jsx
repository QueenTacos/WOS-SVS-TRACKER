import { useState, useEffect } from 'react';
import { upsertEntry, deleteEntry, getAdmins, addAdmin, removeAdmin } from '../supabase.js';
import { EmptyState } from '../components/EmptyState.jsx';
import { OWNER_EMAIL } from '../lib/auth.js';
import { fmtDate } from '../lib/format.js';
import { ALL_ITEMS } from '../lib/items.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, GREEN, MUTED, ORANGE, RED, TEXT } from '../lib/theme.js';
import { CycleHistoryPanel } from './CycleHistoryPanel.jsx';
import { CyclesPanel } from './CyclesPanel.jsx';
import { DateSettingsPanel } from './DateSettingsPanel.jsx';
import { EditEntry } from './EditEntry.jsx';
import { SiteContentPanel } from './SiteContentPanel.jsx';

export function AdminPanel({entries,loadEntries,showToast,adminUser,isOwner,setSiteContent}){
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
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="bg" onClick={()=>setTab("entries")} style={tab==="entries"?{borderColor:ACCENT,color:ACCENT}:{}}>Entries ({entries.length})</button>
          <button className="bg" onClick={()=>setTab("cycles")} style={tab==="cycles"?{borderColor:GREEN,color:GREEN}:{}}>🔄 Cycles</button>
          <button className="bg" onClick={()=>setTab("dates")} style={tab==="dates"?{borderColor:ORANGE,color:ORANGE}:{}}>📅 Dates</button>
          <button className="bg" onClick={()=>setTab("history")} style={tab==="history"?{borderColor:GOLD,color:GOLD}:{}}>📜 Past Cycles</button>
          <button className="bg" onClick={()=>setTab("content")} style={tab==="content"?{borderColor:ACCENT,color:ACCENT}:{}}>✏️ Site Content</button>
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

      {tab==="cycles"&&<CyclesPanel showToast={showToast} isOwner={isOwner}/>}
      {tab==="dates"&&<DateSettingsPanel showToast={showToast} entries={entries} loadEntries={loadEntries}/>}
      {tab==="history"&&<CycleHistoryPanel showToast={showToast}/>}
      {tab==="content"&&<SiteContentPanel showToast={showToast} setSiteContent={setSiteContent}/>}
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
