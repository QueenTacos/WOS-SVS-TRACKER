import { useState, useEffect } from 'react';
import { getAllEntries, getSettings, getSiteContent } from './supabase.js';
import { Header } from './components/Header.jsx';
import { LeaderboardPage } from './pages/LeaderboardPage.jsx';
import { SubmitPage } from './pages/SubmitPage.jsx';
import { HowToPage } from './pages/HowToPage.jsx';
import { PlayerLogin } from './pages/PlayerLogin.jsx';
import { AdminLogin } from './pages/AdminLogin.jsx';
import { AdminPanel } from './pages/AdminPanel.jsx';
import { DEFAULT_DATES, setCycleDates, getPhase } from './lib/cycles.js';
import { BG, TEXT, MUTED, ACCENT, BORDER, RED, GOLD, GREEN } from './lib/theme.js';

export default function App(){
  const[page,setPage]=useState("leaderboard");
  const[adminUser,setAdminUser]=useState(null);
  const[playerUser,setPlayerUser]=useState(null);
  const[entries,setEntries]=useState([]);
  const[loading,setLoading]=useState(true);
  const[toast,setToast]=useState(null);
  const[siteContent,setSiteContent]=useState(null);
  const phase=getPhase();

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  useEffect(()=>{
    getSettings().then(saved=>{ if(saved) setCycleDates({...DEFAULT_DATES,...saved}); }).catch(()=>{});
    getSiteContent().then(saved=>{ if(saved) setSiteContent(saved); }).catch(()=>{});
    loadEntries();
  },[]);
  const loadEntries=async()=>{
    setLoading(true);
    try{
      const items=await getAllEntries();
      setEntries(items);
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  return(
    <div style={{minHeight:"100vh",background:BG,color:TEXT,fontFamily:"'Century Gothic','CenturyGothic','AppleGothic',Futura,sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,textarea{font-family:'Century Gothic','CenturyGothic','AppleGothic',Futura,sans-serif!important;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0D1B2A;}::-webkit-scrollbar-thumb{background:#2A3F55;border-radius:3px;}
        .nav-btn{background:none;border:none;color:${MUTED};cursor:pointer;padding:8px 14px;font-family:inherit;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;}
        .nav-btn:hover{color:${TEXT};}
        .nav-btn.active{color:${ACCENT};border-bottom-color:${ACCENT};}
        .fi{width:100%;background:#0A1520;border:1px solid ${BORDER};border-radius:6px;padding:7px 10px;color:${TEXT};font-size:13px;outline:none;font-family:inherit;transition:border 0.2s;}
        .fi:focus{border-color:${ACCENT};}
        .bp{background:${ACCENT};color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.06em;text-transform:uppercase;transition:background 0.2s;}
        .bp:hover:not(:disabled){background:#5AA0D4;}
        .bp:disabled{opacity:0.5;cursor:not-allowed;}
        .bd{background:#7f1d1d;color:${RED};border:1px solid ${RED};border-radius:6px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;}
        .bd:hover{background:#991b1b;}
        .bg{background:none;border:1px solid ${BORDER};color:${MUTED};border-radius:6px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.2s;}
        .bg:hover{border-color:${ACCENT};color:${ACCENT};}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes toastIn{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.5;}}
        .fade{animation:fadeIn 0.3s ease;}
        .lbr:hover{background:#1E3248!important;}
        .m1{color:#FFD700;}.m2{color:#C0C0C0;}.m3{color:#CD7F32;}
        .svs-item{border-color:${GOLD}55!important;background:${GOLD}08!important;}
        .svs-badge{background:${GOLD}22;color:${GOLD};border:1px solid ${GOLD}44;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;letter-spacing:0.05em;margin-left:4px;}
        .pin-input{width:48px;height:52px;text-align:center;font-size:22px;font-weight:700;background:#0A1520;border:2px solid ${BORDER};border-radius:8px;color:${TEXT};font-family:inherit;outline:none;transition:border 0.2s;}
        .pin-input:focus{border-color:${ACCENT};}
        .item-row:hover{background:#1E3248!important;}
      `}</style>
      <Header page={page} setPage={setPage} adminUser={adminUser} setAdminUser={setAdminUser} playerUser={playerUser} setPlayerUser={setPlayerUser} phase={phase}/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"24px 14px 60px"}}>
        {page==="leaderboard"&&<LeaderboardPage entries={entries} loading={loading} siteContent={siteContent}/>}
        {page==="submit"&&<SubmitPage entries={entries} loadEntries={loadEntries} showToast={showToast} phase={phase} playerUser={playerUser} setPage={setPage} adminUser={adminUser}/>}
        {page==="howto"&&<HowToPage setPage={setPage} phase={phase} siteContent={siteContent}/>}
        {page==="login"&&<PlayerLogin setPlayerUser={setPlayerUser} setPage={setPage} showToast={showToast} loadEntries={loadEntries}/>}
        {page==="admin"&&!adminUser&&<AdminLogin setAdminUser={setAdminUser} setPage={setPage} showToast={showToast}/>}
        {page==="adminPanel"&&adminUser&&<AdminPanel entries={entries} loadEntries={loadEntries} showToast={showToast} adminUser={adminUser} isOwner={adminUser.role==="owner"} setSiteContent={setSiteContent}/>}
      </main>
      {toast&&<div style={{position:"fixed",bottom:24,right:24,background:toast.type==="error"?"#7f1d1d":"#1a3a2a",border:`1px solid ${toast.type==="error"?RED:GREEN}`,color:toast.type==="error"?RED:GREEN,borderRadius:8,padding:"12px 18px",fontSize:13,fontWeight:600,zIndex:999,animation:"toastIn 0.3s ease",maxWidth:300}}>{toast.msg}</div>}
    </div>
  );
}
