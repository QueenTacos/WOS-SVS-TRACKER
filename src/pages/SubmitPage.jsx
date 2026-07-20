import { useState, useEffect, useRef } from 'react';
import { getEntry, upsertEntry } from '../supabase.js';
import { BagPreviewBar } from '../components/BagPreviewBar.jsx';
import { ItemImg } from '../components/ItemImg.jsx';
import { LockedBagView } from '../components/LockedBagView.jsx';
import { THREE_DAYS_MS, getPlayerSubmitState } from '../lib/cycles.js';
import { ALL_ITEMS, ITEM_CATEGORIES, SVS_PRIORITY, emptyBag } from '../lib/items.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, GREEN, MUTED, ORANGE, RED, TEXT } from '../lib/theme.js';

export function SubmitPage({entries,loadEntries,showToast,phase,playerUser,setPage,adminUser}){
  const[bag,setBag]=useState(emptyBag());
  const[images,setImages]=useState([]); // [{data, preview}]
  const[saving,setSaving]=useState(false);
  const[activeCat,setActiveCat]=useState(Object.keys(ITEM_CATEGORIES)[0]);
  const[showSVSOnly,setShowSVSOnly]=useState(false);
  const[done,setDone]=useState(false);
  const[showFinalPrompt,setShowFinalPrompt]=useState(false);
  const fileRef=useRef();

  const existingEntry = playerUser ? entries.find(e=>e.id===playerUser.entryKey) : null;
  const playerState   = getPlayerSubmitState(existingEntry, phase);
  const isFinalWindow = phase.phase==="c1_final";
  const cycleKey      = `cycle${phase.cycle}`;

  // Pre-fill bag with latest saved bag
  useEffect(()=>{
    if(!playerUser) return;
    const load=async()=>{
      try{
        const d=await getEntry(playerUser.entryKey);
        if(d){
          const latest=d.cycle1_latestBag||d.latestBag||d.startBag||{};
          setBag({...emptyBag(),...latest});
        }
      }catch{}
    };
    load();
  },[playerUser]);

  if(!playerUser&&!adminUser) return(
    <div className="fade" style={{textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔐</div>
      <h2 style={{fontSize:22,fontWeight:700,color:TEXT,marginBottom:8}}>Login Required</h2>
      <p style={{color:MUTED,fontSize:14,marginBottom:24}}>Log in or create an account to submit your bag.</p>
      <button className="bp" onClick={()=>setPage("login")}>Go to Player Login →</button>
    </div>
  );

  if(!adminUser){
    if(phase.phase==="upcoming") return(
      <div className="fade" style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:52,marginBottom:16}}>📅</div>
        <h2 style={{fontSize:20,fontWeight:700,color:MUTED,marginBottom:8}}>Opens June 20</h2>
        <p style={{color:MUTED,fontSize:14}}>Submissions open June 20.</p>
      </div>
    );
    if(phase.phase==="locked") return(
      <div className="fade" style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:52,marginBottom:16}}>🔒</div>
        <h2 style={{fontSize:22,fontWeight:700,color:RED,marginBottom:8}}>SVS Prep Week — Locked</h2>
        <p style={{color:MUTED,fontSize:14,marginBottom:6}}>Use your items during prep week!</p>
        <p style={{color:ORANGE,fontSize:13,fontWeight:600}}>Cycle 2 opens July 18.</p>
      </div>
    );
    if(playerState==="final_locked"){
      const lockedBag=existingEntry?.cycle1_finalLatestBag||existingEntry?.cycle1_finalFirstBag||{};
      const lockedItems=Object.entries(lockedBag).filter(([,v])=>v!==""&&Number(v)>0);
      return(
        <div className="fade">
          <div style={{textAlign:"center",padding:"28px 20px 16px"}}>
            <div style={{fontSize:44,marginBottom:10}}>🏆</div>
            <h2 style={{fontSize:20,fontWeight:700,color:GOLD,marginBottom:6}}>Final Bag Locked In!</h2>
            <p style={{color:MUTED,fontSize:13}}>Your contest entry is complete. Check the leaderboard for your growth %.</p>
          </div>
          <LockedBagView items={lockedItems} label="Your Final Bag"/>
        </div>
      );
    }
  }

  // Admin override banner
  const showAdminBanner = adminUser && (phase.phase==="locked" || playerState==="final_locked" || playerState==="vanity");

  const handleFile=(files)=>{
    const arr=Array.from(files);
    arr.forEach(file=>{
      if(!file.type.startsWith("image/")){showToast(`${file.name} is not an image.`,"error");return;}
      if(file.size>4.5*1024*1024){showToast(`${file.name} exceeds 4.5MB.`,"error");return;}
      const reader=new FileReader();
      reader.onload=e=>setImages(prev=>[...prev,{data:e.target.result,preview:e.target.result,name:file.name}]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit=async(asFinal=false)=>{
    setSaving(true);
    try{
      const existing=await getEntry(playerUser.entryKey)||{};
      const now=Date.now();
      const updated={
        ...existing,
        playerName:playerUser.playerName,
        gamerId:playerUser.gamerId,
        allianceTag:playerUser.allianceTag,
        updatedAt:now,
      };
      // Always save as latest bag (vanity/live leaderboard)
      updated.cycle1_latestBag=bag;
      updated.cycle1_latestAt=now;
      if(images.length>0) updated.cycle1_latestScreenshot=images.map(i=>i.data);

      // Initial baseline (first ever submit)
      if(!existing.cycle1_firstAt){
        updated.cycle1_firstBag=bag;
        updated.cycle1_firstAt=now;
        if(images.length>0) updated.cycle1_firstScreenshot=images.map(i=>i.data);
      }

      // Final bag submission
      if(asFinal || phase.phase==="c1_final"){
        if(!existing.cycle1_finalFirstAt){
          updated.cycle1_finalFirstBag=bag;
          updated.cycle1_finalFirstAt=now;
          if(images.length>0) updated.cycle1_finalFirstScreenshot=images.map(i=>i.data);
        }
        updated.cycle1_finalLatestBag=bag;
        updated.cycle1_finalLatestAt=now;
      }

      await upsertEntry(updated);
      await loadEntries();
      setShowFinalPrompt(false);
      setDone(true);
    }catch{showToast("Failed to save. Try again.","error");}
    finally{setSaving(false);}
  };

  // Done / confirmation screen
  if(done){
    const filledItems=Object.entries(bag).filter(([,v])=>v!==""&&Number(v)>0);
    const isInitial=playerState==="submit_initial"||playerState==="edit_initial";
    return(
      <div className="fade">
        <div style={{textAlign:"center",padding:"28px 20px 20px"}}>
          <div style={{fontSize:46,marginBottom:10}}>✅</div>
          <h2 style={{fontSize:21,fontWeight:700,color:GREEN,marginBottom:6}}>Bag Saved!</h2>
          <p style={{color:MUTED,marginBottom:4}}>Recorded for <strong style={{color:ACCENT}}>{playerUser?.playerName}</strong></p>
          <p style={{color:MUTED,fontSize:12,marginBottom:20}}>{filledItems.length} items · {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
          <button className="bp" onClick={()=>setDone(false)}>Update Bag</button>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:16}}>
          <h3 style={{fontSize:13,fontWeight:700,color:ACCENT,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.06em"}}>Your Submitted Bag</h3>
          {filledItems.length===0?<p style={{color:MUTED,fontSize:13,textAlign:"center",padding:"16px 0"}}>No items entered.</p>:(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:7}}>
              {filledItems.map(([name,val])=>{
                const isSVS=SVS_PRIORITY.has(name);
                return(
                  <div key={name} style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":BORDER}`,borderRadius:8,padding:"6px 9px"}}>
                    <ItemImg name={name} size={24}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:isSVS?TEXT:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                      {isSVS&&<span className="svs-badge">SVS ⭐</span>}
                    </div>
                    <span style={{fontWeight:700,fontSize:13,color:TEXT,flexShrink:0,marginRight:3}}>{Number(val).toLocaleString()}</span>
                    <button onClick={()=>setBag(p=>({...p,[name]:""}))} title="Remove"
                      style={{background:"none",border:"none",color:BORDER,fontSize:15,cursor:"pointer",padding:"0 1px",flexShrink:0,transition:"color 0.15s"}}
                      onMouseEnter={e=>e.target.style.color=RED} onMouseLeave={e=>e.target.style.color=BORDER}>×</button>
                  </div>
                );
              })}
            </div>
          )}
          {filledItems.length>0&&<p style={{color:MUTED,fontSize:11,textAlign:"center",marginTop:9}}>Hit × to remove an item, then click <strong>Update Bag</strong> to save.</p>}
        </div>
      </div>
    );
  }

  // Final bag prompt overlay
  if(showFinalPrompt) return(
    <div className="fade" style={{textAlign:"center",padding:"48px 20px"}}>
      <div style={{fontSize:48,marginBottom:14}}>🎯</div>
      <h2 style={{fontSize:22,fontWeight:700,color:GOLD,marginBottom:8}}>Submit as Final Bag?</h2>
      <p style={{color:MUTED,fontSize:14,maxWidth:440,margin:"0 auto 8px"}}>This will lock in your <strong style={{color:GOLD}}>official contest ending bag</strong>. You'll have 3 days to make edits, then it's final.</p>
      <p style={{color:MUTED,fontSize:13,marginBottom:28}}>Your bag will still save normally for the leaderboard regardless.</p>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button className="bg" style={{padding:"10px 24px"}} onClick={()=>{setShowFinalPrompt(false);handleSubmit(false);}}>
          {saving?"Saving…":"Just Save (No Final)"}
        </button>
        <button className="bp" style={{background:GOLD,padding:"10px 24px"}} disabled={saving} onClick={()=>handleSubmit(true)}>
          {saving?"Saving…":"✓ Yes, Submit as Final Bag"}
        </button>
      </div>
    </div>
  );

  const filledCount=Object.values(bag).filter(v=>v!==""&&Number(v)>0).length;
  const cats=showSVSOnly?{"⭐ SVS Priority":ALL_ITEMS.filter(({name})=>SVS_PRIORITY.has(name)).map(({name})=>name)}:ITEM_CATEGORIES;
  const currentCatItems=cats[activeCat]||[];

  const getStatusBanner=()=>{
    if(playerState==="submit_initial") return {color:GREEN, msg:"📦 Submit your initial bag — this becomes your baseline for the contest."};
    if(playerState==="edit_initial"){
      const exp=(existingEntry?.cycle1_firstAt||existingEntry?.initialFirstAt||Date.now())+THREE_DAYS_MS;
      const d=Math.floor(Math.max(0,exp-Date.now())/86400000);
      const h=Math.floor((Math.max(0,exp-Date.now())%86400000)/3600000);
      return {color:ORANGE, msg:`✏️ Initial bag edit window — ${d}d ${h}h remaining. After this it locks as your baseline.`};
    }
    if(playerState==="vanity") return {color:ACCENT, msg:"🏆 Vanity period — keep adding items to climb the live leaderboard! Final bag opens Jul 10."};
    if(playerState==="prompt_final") return {color:GOLD, msg:"🎯 Final bag window is open! Save your bag and choose to submit it as your official final entry."};
    if(playerState==="edit_final"){
      const exp=(existingEntry?.cycle1_finalFirstAt||existingEntry?.finalFirstAt||Date.now())+THREE_DAYS_MS;
      const d=Math.floor(Math.max(0,exp-Date.now())/86400000);
      const h=Math.floor((Math.max(0,exp-Date.now())%86400000)/3600000);
      return {color:GOLD, msg:`🎯 Final bag edit window — ${d}d ${h}h remaining until locked.`};
    }
    return null;
  };
  const banner=getStatusBanner();

  return(
    <div className="fade">
      {showAdminBanner&&(
        <div style={{background:`${GOLD}12`,border:`1px solid ${GOLD}44`,borderRadius:8,padding:"9px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🔓</span>
          <span style={{fontSize:13,color:GOLD,fontWeight:600}}>Admin View — full access regardless of submission window.</span>
        </div>
      )}
      {playerUser&&(
        <BagPreviewBar playerUser={playerUser} phase={phase} filledCount={filledCount} bag={bag} setBag={setBag} playerState={playerState} existingEntry={existingEntry}/>
      )}
      {adminUser&&!playerUser&&(
        <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,padding:"10px 16px",marginBottom:16}}>
          <span style={{fontSize:13,color:MUTED}}>Viewing as admin — <span style={{color:ACCENT}}>{adminUser.email}</span></span>
        </div>
      )}
      {banner&&(
        <div style={{background:`${banner.color}12`,border:`1px solid ${banner.color}44`,borderRadius:8,padding:"9px 14px",marginBottom:14,fontSize:13,color:banner.color,fontWeight:600}}>
          {banner.msg}
        </div>
      )}

      {/* Screenshot upload */}
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:14,marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>📸 Bag Screenshot <span style={{color:MUTED,fontSize:11,textTransform:"none",fontWeight:400}}>(optional)</span></h3>
        <div onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()} onClick={()=>fileRef.current.click()}
          style={{border:`2px dashed ${images.length>0?ACCENT:BORDER}`,borderRadius:8,padding:"12px",textAlign:"center",cursor:"pointer",background:images.length>0?"#0f2030":"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:10,minHeight:60,transition:"all 0.2s"}}>
          {images.length>0?(<><img src={images[0].preview} alt="preview" style={{maxHeight:100,maxWidth:160,borderRadius:5,objectFit:"contain"}}/><span style={{color:MUTED,fontSize:12}}>Click to replace</span></>)
          :(<><span style={{fontSize:22}}>📸</span><span style={{color:MUTED,fontSize:13}}>Drop or <span style={{color:ACCENT}}>click to browse</span> — PNG/JPG/WEBP up to 4.5MB</span></>)}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
      </div>

      {/* Category filters */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <button onClick={()=>{setShowSVSOnly(true);setActiveCat("⭐ SVS Priority");}}
          style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${showSVSOnly?GOLD:BORDER}`,background:showSVSOnly?`${GOLD}22`:"transparent",color:showSVSOnly?GOLD:MUTED,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>⭐ SVS Priority</button>
        <span style={{color:BORDER,fontSize:11}}>|</span>
        {Object.keys(ITEM_CATEGORIES).map(cat=>(
          <button key={cat} onClick={()=>{setShowSVSOnly(false);setActiveCat(cat);}}
            style={{padding:"5px 11px",borderRadius:20,border:`1px solid ${!showSVSOnly&&activeCat===cat?ACCENT:BORDER}`,background:!showSVSOnly&&activeCat===cat?`${ACCENT}22`:"transparent",color:!showSVSOnly&&activeCat===cat?ACCENT:MUTED,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
          <h3 style={{fontSize:13,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.06em"}}>{showSVSOnly?"⭐ SVS Priority":activeCat}</h3>
          <span style={{fontSize:11,color:MUTED}}>{filledCount} items filled</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(235px,1fr))",gap:7}}>
          {currentCatItems.map(item=>{
            const isSVS=SVS_PRIORITY.has(item);
            return(
              <div key={item} className="item-row" style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:bag[item]?`${ACCENT}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":bag[item]?ACCENT+"33":BORDER}`,borderRadius:8,padding:"6px 9px",transition:"background 0.15s"}}>
                <ItemImg name={item} size={26}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:isSVS?TEXT:MUTED,fontWeight:isSVS?600:400,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item}</div>
                  {isSVS&&<span className="svs-badge">SVS ⭐</span>}
                </div>
                <input type="number" min="0" className="fi" style={{width:76,textAlign:"right",padding:"4px 7px",fontSize:13,flexShrink:0}}
                  value={bag[item]} onChange={e=>setBag(p=>({...p,[item]:e.target.value}))} placeholder="0"/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button — shows final prompt during final window */}
      {playerState==="prompt_final"||playerState==="edit_final" ? (
        <div style={{display:"flex",gap:10}}>
          <button className="bp" style={{flex:1,background:CARD,border:`1px solid ${BORDER}`,color:MUTED}} disabled={saving} onClick={()=>handleSubmit(false)}>
            {saving?"Saving…":"Save (Vanity Only)"}
          </button>
          <button className="bp" style={{flex:2,background:GOLD}} disabled={saving} onClick={()=>setShowFinalPrompt(true)}>
            {saving?"Saving…":"🎯 Submit as Final Bag"}
          </button>
        </div>
      ):(
        <button className="bp" style={{width:"100%",padding:"12px"}} disabled={saving} onClick={()=>handleSubmit(false)}>
          {saving?"Saving…":playerState==="submit_initial"?"Submit Initial Bag ✓":"Save Bag Update ✓"}
        </button>
      )}
      <p style={{color:MUTED,fontSize:11,textAlign:"center",marginTop:8}}>
        {playerState==="submit_initial"?"Your first submission becomes your baseline. You have 3 days to edit it."
        :playerState==="edit_initial"?"Still within your 3-day edit window — updates replace your baseline."
        :playerState==="vanity"?"Vanity period — updates show on the live leaderboard but don't affect your contest score."
        :playerState==="prompt_final"?"Final window — submit as Final Bag for the official contest score, or just save for the leaderboard."
        :"Updates save to your bag and the leaderboard."}
      </p>
    </div>
  );
}
