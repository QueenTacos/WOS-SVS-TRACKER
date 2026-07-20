import { ItemImg } from './ItemImg.jsx';
import { SVS_PRIORITY } from '../lib/items.js';
import { BORDER, CARD2, GOLD, MUTED, TEXT } from '../lib/theme.js';

export function SampleItemRow({name}){
  const isSVS=SVS_PRIORITY.has(name);
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,background:isSVS?`${GOLD}08`:CARD2,border:`1px solid ${isSVS?GOLD+"44":BORDER}`,borderRadius:8,padding:"7px 10px",opacity:0.85}}>
      <ItemImg name={name} size={26}/>
      <div style={{flex:1}}>
        <div style={{fontSize:11,color:isSVS?TEXT:MUTED,fontWeight:isSVS?600:400}}>{name}</div>
        {isSVS&&<span className="svs-badge">SVS ⭐</span>}
      </div>
      <div style={{width:60,height:26,background:"#0A1520",border:`1px solid ${BORDER}`,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6,color:BORDER,fontSize:12}}>0</div>
    </div>
  );
}
