import { useState } from 'react';
import { findAdmin } from '../supabase.js';
import { OWNER_EMAIL, OWNER_PASS_HASH } from '../lib/auth.js';
import { BORDER, CARD, MUTED, TEXT } from '../lib/theme.js';

export function AdminLogin({setAdminUser,setPage,showToast}){
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[loading,setLoading]=useState(false);
  const handle=async()=>{
    setLoading(true);
    try{
      if(email.trim().toLowerCase()===OWNER_EMAIL&&btoa(pass)===OWNER_PASS_HASH){setAdminUser({email:OWNER_EMAIL,role:"owner"});setPage("adminPanel");showToast("Welcome, Owner!");return;}
      const found=await findAdmin(email.trim().toLowerCase(),btoa(pass));
      if(found){setAdminUser({email:found.email,role:"admin"});setPage("adminPanel");showToast(`Welcome, ${found.email}!`);return;}
      showToast("Invalid email or password.","error");
    }finally{setLoading(false);}
  };
  return(
    <div className="fade" style={{maxWidth:400,margin:"0 auto",paddingTop:16}}>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:26}}>
        <h2 style={{fontSize:20,fontWeight:700,color:TEXT,marginBottom:4}}>Admin Login</h2>
        <p style={{color:MUTED,fontSize:13,marginBottom:20}}>Owner & admins only</p>
        <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Email</label>
        <input className="fi" style={{marginBottom:12}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" onKeyDown={e=>e.key==="Enter"&&handle()}/>
        <label style={{display:"block",fontSize:11,color:MUTED,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Password</label>
        <input className="fi" style={{marginBottom:20}} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()}/>
        <button className="bp" style={{width:"100%"}} disabled={loading} onClick={handle}>{loading?"Checking…":"Log In"}</button>
      </div>
    </div>
  );
}
