export type PanelSide='left'|'right';
export const PANEL_WIDTH_KEY='atlas-panel-widths-v1';
export const DEFAULT_PANEL_WIDTHS={left:360,right:360};
export const PANEL_LAYOUT_EVENT='atlas-panel-layout';
export function panelWidthBounds(viewport:number,otherWidth=0){
 const min=viewport>1100?280:240;
 return {min,max:Math.max(min,Math.min(560,viewport-88-320-otherWidth))};
}
export function clampPanelWidth(width:number,viewport:number,otherWidth=0){
 const {min,max}=panelWidthBounds(viewport,otherWidth);
 return Math.round(Math.max(min,Math.min(max,Number.isFinite(width)?width:360)));
}
export function parsePanelWidths(value:unknown){
 if(!value||typeof value!=='object')return {...DEFAULT_PANEL_WIDTHS};
 const raw=value as Record<PanelSide,unknown>;
 return Object.fromEntries((['left','right'] as const).map(side=>[side,typeof raw[side]==='number'&&Number.isFinite(raw[side])?Math.max(240,Math.min(560,Math.round(raw[side]))):DEFAULT_PANEL_WIDTHS[side]])) as Record<PanelSide,number>;
}
export function panelWidthKey(key:string,side:PanelSide,width:number,min:number,max:number,shift=false){
 const step=shift?40:16;
 if(key==='Home')return DEFAULT_PANEL_WIDTHS[side];
 if(key==='End')return max;
 if(key==='ArrowRight')return Math.max(min,Math.min(max,width+(side==='left'?step:-step)));
 if(key==='ArrowLeft')return Math.max(min,Math.min(max,width+(side==='left'?-step:step)));
 return null;
}
