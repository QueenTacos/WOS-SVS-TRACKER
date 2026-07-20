import { ACCENT, BORDER, CARD, GOLD, GREEN, MUTED, RED } from '../lib/theme.js';

export function ScheduleBlock(){
  return(
    <div style={{display:"inline-block",background:CARD,border:`1px solid ${BORDER}`,borderRadius:10,padding:"14px 20px",marginTop:16,textAlign:"left"}}>
      {[{l:"Baseline Window",d:"Jun 20 – Jul 1",c:GREEN},{l:"Vanity Period",d:"Jul 2 – Jul 9",c:ACCENT},{l:"Final Bag Window",d:"Jul 10 – 12",c:GOLD},{l:"Prep Week (Locked)",d:"Jul 13 – 17",c:RED}].map(r=>(
        <div key={r.d} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:r.c,flexShrink:0,display:"inline-block"}}/>
          <span style={{fontSize:13,color:r.c,fontWeight:600}}>{r.l}</span>
          <span style={{fontSize:12,color:MUTED,marginLeft:"auto",paddingLeft:16}}>{r.d}</span>
        </div>
      ))}
    </div>
  );
}
