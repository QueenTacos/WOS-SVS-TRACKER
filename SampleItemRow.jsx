import { ITEM_CATEGORIES, ITEM_IMGS, SVS_PRIORITY } from '../lib/items.js';
import { GOLD } from '../lib/theme.js';

export function ItemImg({name,size=28}){
  const src=ITEM_IMGS[name];
  const isSVS=SVS_PRIORITY.has(name);
  if(!src){
    const colors={"🔥":["#ff6b35","#ff9500"],"⚡":["#60a5fa","#3b82f6"],"🦸":["#a78bfa","#7c3aed"],"🐾":["#34d399","#059669"],"⚙️":["#fbbf24","#d97706"],"🎓":["#f472b6","#db2777"],"🎁":["#94a3b8","#64748b"],"💎":["#38bdf8","#0284c7"]};
    const emoji=Object.keys(colors).find(e=>Object.entries(ITEM_CATEGORIES).find(([k])=>k.startsWith(e)&&ITEM_CATEGORIES[k].includes(name)));
    const[c1,c2]=colors[emoji]||["#4A90C4","#2563eb"];
    return(
      <div style={{width:size,height:size,borderRadius:6,background:`linear-gradient(135deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.42,flexShrink:0,border:isSVS?`1px solid ${GOLD}66`:"none"}}>
        {emoji||"📦"}
      </div>
    );
  }
  return(
    <div style={{width:size,height:size,borderRadius:6,background:"#0a1826",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:isSVS?`1px solid ${GOLD}55`:"none",overflow:"hidden"}}>
      <img src={src} alt={name} width={size} height={size} style={{objectFit:"contain"}}/>
    </div>
  );
}
