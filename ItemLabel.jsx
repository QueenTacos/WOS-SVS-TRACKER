import { BORDER, CARD, MUTED, TEXT } from '../lib/theme.js';

export function StepCard({num,title,color,children}){
  return(
    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:20,display:"flex",gap:16}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:`${color}22`,border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color,flexShrink:0}}>{num}</div>
      <div style={{flex:1}}>
        <h3 style={{fontSize:16,fontWeight:700,color:TEXT,marginBottom:10}}>{title}</h3>
        <div style={{fontSize:13,color:MUTED,lineHeight:1.6}}>{children}</div>
      </div>
    </div>
  );
}
