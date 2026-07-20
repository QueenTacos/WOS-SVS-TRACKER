import { useState, useEffect } from 'react';

export function useCountdown(target){
  const[t,setT]=useState({});
  useEffect(()=>{
    if(!target)return;
    const tick=()=>{
      const diff=new Date(target)-Date.now();
      if(diff<=0){setT({expired:true});return;}
      setT({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)});
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[target]);
  return t;
}
