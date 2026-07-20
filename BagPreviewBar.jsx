import { MUTED } from '../lib/theme.js';

export function EmptyState({icon,text}){
  return(<div style={{textAlign:"center",padding:"52px 0",color:MUTED}}><div style={{fontSize:42,marginBottom:12}}>{icon}</div><p style={{fontSize:14}}>{text}</p></div>);
}
