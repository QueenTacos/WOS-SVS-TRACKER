import { MUTED, TEXT } from '../lib/theme.js';

export function ItemLabel({name,isSVS}){
  // For combined speedups show type + "enter total minutes" hint
  const speedupMatch=name.match(/^(.+?) Speedups \(mins\)$/);
  if(speedupMatch){
    const[,type]=speedupMatch;
    return(
      <div>
        <div style={{fontSize:13,fontWeight:700,color:isSVS?TEXT:MUTED,lineHeight:1.3}}>{type}</div>
        <div style={{fontSize:10,color:MUTED,lineHeight:1.2}}>Total minutes</div>
        {isSVS&&<span className="svs-badge">SVS ⭐</span>}
      </div>
    );
  }
  return(
    <div>
      <div style={{fontSize:11,color:isSVS?TEXT:MUTED,fontWeight:isSVS?600:400,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
      {isSVS&&<span className="svs-badge">SVS ⭐</span>}
    </div>
  );
}
