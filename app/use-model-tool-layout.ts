import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {modelToolLayout} from './model-tool-layout';
import {PANEL_LAYOUT_EVENT} from './panel-widths';

export function useModelToolLayout(open:boolean,hasCard:boolean){
 const read=(cardWidth=340)=>modelToolLayout(typeof window==='undefined'?1280:window.innerWidth||1280,typeof window==='undefined'?900:window.visualViewport?.height||window.innerHeight||900,hasCard?cardWidth:0);
 const [layout,setLayout]=useState(()=>read());
 const cardWidth=useRef(340);
 useLayoutEffect(()=>{
  if(!open)return;
  const update=()=>{
   const card=document.querySelector<HTMLElement>('.detail-sheet'),width=card?.getBoundingClientRect().width;
   if(width&&width>0)cardWidth.current=width;
   const next=read(cardWidth.current);
   setLayout(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
  };
  const resize=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(update);
  const observe=()=>{const card=document.querySelector<HTMLElement>('.detail-sheet');if(card)resize?.observe(card);update();};
  const mutations=typeof MutationObserver==='undefined'?undefined:new MutationObserver(observe);
  if(document.body)mutations?.observe(document.body,{subtree:true,childList:true});
  window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);observe();
  return()=>{resize?.disconnect();mutations?.disconnect();window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);};
 },[open,hasCard]);
 useEffect(()=>{window.dispatchEvent(new Event(PANEL_LAYOUT_EVENT));},[layout,open]);
 const {left,right,top,bottom}=layout.rect;
 const style:CSSProperties={position:'absolute',left,top,right:'auto',bottom:'auto',width:right-left,maxWidth:'none',height:'auto',maxHeight:Math.max(100,bottom-top),minHeight:0,transform:'none'};
 return {style,replaceCard:open&&hasCard&&layout.replaceCard};
}
