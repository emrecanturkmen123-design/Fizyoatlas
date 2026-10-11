import {useEffect,useRef} from 'react';
import {GripVertical} from 'lucide-react';
import {PANEL_WIDTH_KEY,PANEL_LAYOUT_EVENT,DEFAULT_PANEL_WIDTHS,parsePanelWidths,panelWidthBounds,clampPanelWidth,panelWidthKey,type PanelSide} from './panel-widths';

const SIDES=['left','right'] as const;
const LEFT_SELECTOR='.workspace-layout > :is(.study-panel,.learning-panel,.shoulder-panel,.search-panel):not(.case-reading):not(.tendon-study-panel)';
export default function WorkspacePanelHandles(){
 const left=useRef<HTMLDivElement>(null),right=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>('.workspace-layout');
  if(!root||typeof ResizeObserver==='undefined'||typeof MutationObserver==='undefined')return;
  const handles={left:left.current!,right:right.current!};
  let preferred={...DEFAULT_PANEL_WIDTHS};
  try{preferred=parsePanelWidths(JSON.parse(localStorage.getItem(PANEL_WIDTH_KEY)??'null'));}catch{}
  const panels:Partial<Record<PanelSide,HTMLElement>>={};
  let dragging:{side:PanelSide;pointer:number;x:number;width:number}|null=null;
  const notify=()=>window.dispatchEvent(new Event(PANEL_LAYOUT_EVENT));
  const store=()=>{try{localStorage.setItem(PANEL_WIDTH_KEY,JSON.stringify(preferred));}catch{}};
  const visible=(p?:HTMLElement)=>!!p&&p.getClientRects().length>0;
  const geometry=()=>{
   for(const side of SIDES){
    const p=panels[side],handle=handles[side];
    if(!visible(p)||window.innerWidth<768||window.innerHeight<=500){handle.style.display='none';continue;}
    const rect=p!.getBoundingClientRect(),other=panels[side==='left'?'right':'left'];
    const otherWidth=visible(other)?other!.getBoundingClientRect().width:0;
    const {min,max}=panelWidthBounds(window.innerWidth,otherWidth);
    Object.assign(handle.style,{display:'flex',left:`${(side==='left'?rect.right:rect.left)-9}px`,top:`${rect.top}px`,height:`${rect.height}px`});
    handle.setAttribute('aria-valuenow',String(Math.round(rect.width)));
    handle.setAttribute('aria-valuemin',String(min));handle.setAttribute('aria-valuemax',String(max));
    handle.setAttribute('aria-valuetext',`${Math.round(rect.width)} piksel`);
   }
  };
  const apply=()=>{
   for(const side of SIDES){
    const p=panels[side];if(!p)continue;
    const other=panels[side==='left'?'right':'left'];
    const otherWidth=visible(other)?other!.getBoundingClientRect().width:0;
    p.style.setProperty('--panel-width',`${clampPanelWidth(preferred[side],window.innerWidth,otherWidth)}px`);
   }
   geometry();
   const l=visible(panels.left)?panels.left!.getBoundingClientRect().right+24:24;
   const r=visible(panels.right)?panels.right!.getBoundingClientRect().left-24:window.innerWidth-24;
   root.style.setProperty('--model-tools-center',`${(l+r)/2}px`);
   root.style.setProperty('--active-panel-width',`${visible(panels.left)?panels.left!.getBoundingClientRect().width:0}px`);
  };
  const observer=new ResizeObserver(geometry);
  const sync=(force=false)=>{
   const eligible=root.dataset.readingOnly!=='true'&&window.innerWidth>=768&&window.innerHeight>500;
   const next={left:eligible?document.querySelector<HTMLElement>(LEFT_SELECTOR):null,right:eligible?document.querySelector<HTMLElement>('.detail-sheet:not([data-ending-style])'):null};
   let changed=false;
   for(const side of SIDES){
    if(panels[side]===next[side])continue;
    const previous=panels[side];if(previous){observer.unobserve(previous);delete previous.dataset.resizablePanel;previous.style.removeProperty('--panel-width');}
    if(next[side]){panels[side]=next[side]!;next[side]!.dataset.resizablePanel=side;observer.observe(next[side]!);}else delete panels[side];
    changed=true;
   }
   if(changed||force)apply();if(changed)notify();
  };
  const resize=()=>{sync(true);notify();};
  const listeners:Record<string,(e:Event)=>void>[]=[];
  for(const side of SIDES){
   const handle=handles[side];
   const down=(event:Event)=>{
    const e=event as PointerEvent,p=panels[side];if(e.button!==0||!visible(p))return;
    e.preventDefault();handle.focus();handle.setPointerCapture(e.pointerId);
    dragging={side,pointer:e.pointerId,x:e.clientX,width:p!.getBoundingClientRect().width};
    document.body.classList.add('resizing-workspace-panel');
   };
   const move=(event:Event)=>{
    const e=event as PointerEvent;if(!dragging||dragging.side!==side||dragging.pointer!==e.pointerId)return;
    const other=panels[side==='left'?'right':'left'],otherWidth=visible(other)?other!.getBoundingClientRect().width:0;
    preferred[side]=clampPanelWidth(dragging.width+(e.clientX-dragging.x)*(side==='left'?1:-1),window.innerWidth,otherWidth);apply();
   };
   const end=(event:Event)=>{
    const e=event as PointerEvent;if(!dragging||dragging.side!==side||dragging.pointer!==e.pointerId)return;
    dragging=null;document.body.classList.remove('resizing-workspace-panel');
    if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
    store();notify();
   };
   const key=(event:Event)=>{
    const e=event as KeyboardEvent,p=panels[side];if(!p)return;
    const other=panels[side==='left'?'right':'left'],bounds=panelWidthBounds(window.innerWidth,visible(other)?other!.getBoundingClientRect().width:0);
    const value=panelWidthKey(e.key,side,p.getBoundingClientRect().width,bounds.min,bounds.max,e.shiftKey);
    if(value===null)return;e.preventDefault();preferred[side]=clampPanelWidth(value,window.innerWidth,visible(other)?other!.getBoundingClientRect().width:0);apply();store();notify();
   };
   const reset=()=>{preferred[side]=DEFAULT_PANEL_WIDTHS[side];apply();store();notify();};
   const events={pointerdown:down,pointermove:move,pointerup:end,pointercancel:end,lostpointercapture:end,keydown:key,dblclick:reset};
   listeners.push(events);for(const [name,fn]of Object.entries(events))handle.addEventListener(name,fn);
  }
  const mutations=new MutationObserver(()=>sync());mutations.observe(document.body,{subtree:true,childList:true});
  window.addEventListener('resize',resize);sync(true);
  return()=>{
   mutations.disconnect();observer.disconnect();window.removeEventListener('resize',resize);
   document.body.classList.remove('resizing-workspace-panel');
   root.style.removeProperty('--model-tools-center');root.style.removeProperty('--active-panel-width');
   for(const [i,side]of SIDES.entries()){
    for(const [name,fn]of Object.entries(listeners[i]))handles[side].removeEventListener(name,fn);
    if(panels[side]){delete panels[side]!.dataset.resizablePanel;panels[side]!.style.removeProperty('--panel-width');}
   }
  };
 },[]);
 return <>{SIDES.map(side=><div key={side} ref={side==='left'?left:right} role="separator" aria-orientation="vertical" aria-label={side==='left'?'Çalışma panelinin genişliği':'Yapı kartının genişliği'} aria-valuemin={240} aria-valuemax={560} aria-valuenow={360} tabIndex={0} className={`panel-resize-handle panel-resize-${side}`} style={{display:'none'}} title="Genişliği ayarlamak için sürükle veya ok tuşlarını kullan. Çift tıkla ya da Home ile sıfırla."><span><GripVertical size={16}/></span></div>)}</>;
}
