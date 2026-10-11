export interface PanelRect {left:number;right:number;top:number;bottom:number}
export function viewportUsable(rect:PanelRect){return Object.values(rect).every(Number.isFinite)&&rect.right-rect.left>=120&&rect.bottom-rect.top>=60;}
export function modelViewport(width:number,height:number,panels:PanelRect[],controlsBottom=0):PanelRect{
 const mobile=width<768,landscape=height<500&&width>=600&&width<=1024,margin=mobile?12:24;
 const left=Math.min(margin,width),right=Math.max(left,width-margin),bottom=Math.max(0,height-(mobile||landscape?12:92));
 const top=Math.min(bottom,Math.max(controlsBottom+12,landscape?84:mobile?180:96));
 const empty={left,right:left,top,bottom:top};
 let spaces:PanelRect[]=right>left&&bottom>top?[{left,right,top,bottom}]:[];
 for(const panel of panels){
  const padding=panel.right-panel.left>width*.65?16:24;
  const p={left:panel.left-padding,right:panel.right+padding,top:panel.top-padding,bottom:panel.bottom+padding};
  spaces=spaces.flatMap(r=>{
   if(p.right<=r.left||p.left>=r.right||p.bottom<=r.top||p.top>=r.bottom)return [r];
   // Keep real free space; a minimum size must never extend behind a panel.
   return [{...r,bottom:Math.min(r.bottom,p.top)},{...r,top:Math.max(r.top,p.bottom)},{...r,right:Math.min(r.right,p.left)},{...r,left:Math.max(r.left,p.right)}].filter(v=>v.right>v.left&&v.bottom>v.top);
  });
 }
 return spaces.reduce((best,r)=>viewportUsable(r)&&!viewportUsable(best)||viewportUsable(r)===viewportUsable(best)&&(r.right-r.left)*(r.bottom-r.top)>(best.right-best.left)*(best.bottom-best.top)?r:best,empty);
}
