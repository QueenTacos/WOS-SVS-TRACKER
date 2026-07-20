import { ItemImg } from './ItemImg.jsx';
import { SVS_PRIORITY } from '../lib/items.js';
import { ACCENT, BORDER, CARD, CARD2, GOLD, MUTED, TEXT } from '../lib/theme.js';

export function LockedBagView({items,label}){
  return(
    <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:16,marginTop:12}}>
      <div style={{fontSize:12,fontWeight:700,color:ACCENT,marginBottom:11,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label} ({items.length} items)</div>
      {items.length===0?<p style={{color:MUTED,fontSize:13}}>No items recorded.</p>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:6}}>
          {items.map(([name,val])=>{
            const isSVS=SVS_PRIORITY.has(name);
            return(
              <div key={name} style={{display:"flex",alignItems:"center",gap:7,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"33":BORDER}`,borderRadius:7,padding:"5px 9px"}}>
                <ItemImg name={name} size={22}/>
                <span style={{flex:1,fontSize:11,color:isSVS?TEXT:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                <span style={{fontWeight:700,fontSize:13,color:TEXT}}>{Number(val).toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
