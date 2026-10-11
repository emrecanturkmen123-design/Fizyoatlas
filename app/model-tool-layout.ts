import type {PanelRect} from './model-viewport';

export interface ModelToolLayout {rect:PanelRect;replaceCard:boolean}
// A tool owns a reading column. It never shares the card's rectangle.
export function modelToolLayout(width:number,height:number,cardWidth=0):ModelToolLayout{
 const wide=width>=1101&&height>500&&(!cardWidth||width-cardWidth-330-40-48>=320);
 if(wide){
  const toolWidth=Math.min(330,Math.max(240,width-cardWidth-40-48-120));
  return {replaceCard:false,rect:{left:20,right:20+toolWidth,top:100,bottom:height-96}};
 }
 if(width>=600&&height<=500){
  const toolWidth=Math.min(330,Math.max(240,width*.42-16));
  return {replaceCard:true,rect:{left:width-8-toolWidth,right:width-8,top:136,bottom:height-64}};
 }
 if(width>=768){
  const toolWidth=Math.min(330,width*.4),top=width<=900?144:100;
  return {replaceCard:true,rect:{left:width-16-toolWidth,right:width-16,top,bottom:height-96}};
 }
 const toolHeight=Math.max(100,Math.min(height*.55,height-280));
 return {replaceCard:true,rect:{left:8,right:width-8,top:height-8-toolHeight,bottom:height-8}};
}
