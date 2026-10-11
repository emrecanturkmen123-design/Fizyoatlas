import {SYSTEMS,type Atlas,type SceneState} from './anatomy';
import {muscleFor} from './education-data';

const colors=['#0072b2','#d55e00','#009e73','#aa4499','#8b6a00','#117788'];
const muscleColors:Record<string,string>={
 'rectus femoris':colors[0],'vastus lateralis':colors[1],'vastus medialis':colors[2],'vastus intermedius':colors[3],
 semitendinosus:colors[2],semimembranosus:colors[3],'biceps femoris':colors[1]
};
export function muscleSelectionColor(key:string){
 let hash=0;for(const char of key)hash=(hash*31+char.charCodeAt(0))>>>0;
 return muscleColors[key]??colors[hash%colors.length];
}
export type SelectionMember={key:string;name:string;color:string;ids:string[]};
export function selectionPalette(atlas:Atlas,state:SceneState){
 const members:SelectionMember[]=[],partColors=new Map<string,string>();
 // Keep motion roles, spinal regions, connection traces and hidden-name exams
 // in their existing color systems. A single muscle retains the blue highlight.
 if(state.gait||state.shoulder||state.elbow||state.knee||state.lower||state.spine||state.trace||state.hideNames)return {members,partColors};
 const selected=new Set(state.selected),grouped=new Map<string,SelectionMember>();
 for(const p of atlas.parts){
  if(!selected.has(p.id)||p.system!=='muscular')continue;
  const muscle=muscleFor(p.name),key=muscle?.key??p.conceptId;
  let member=grouped.get(key);
  if(!member){member={key,name:muscle?.name??p.name.replace(/^(left|right)\s+/i,''),color:muscleSelectionColor(key),ids:[]};grouped.set(key,member);}
  member.ids.push(p.id);
 }
 if(grouped.size<2){
  if(state.attachments)for(const p of atlas.parts)if(selected.has(p.id)&&p.system==='skeletal')partColors.set(p.id,SYSTEMS.find(s=>s.id==='skeletal')!.color);
  return {members,partColors};
 }
 members.push(...grouped.values());
 // A mixed selection can contain muscles with the same preferred color.
 // Allocate distinct colors in stable key order, independently of side/order.
 const used=new Set<string>();
 for(const member of [...members].sort((a,b)=>a.key.localeCompare(b.key))){
  if(used.has(member.color))member.color=colors.find(c=>!used.has(c))??`hsl(${((used.size*.381966)%1*360).toFixed(3)},65%,35%)`;
  used.add(member.color);
 }
 for(const member of members)for(const id of member.ids)partColors.set(id,member.color);
 // Attachment bones and other context keep their anatomical system colors.
 for(const p of atlas.parts)if(selected.has(p.id)&&p.system!=='muscular')partColors.set(p.id,SYSTEMS.find(s=>s.id===p.system)!.color);
 return {members,partColors};
}
