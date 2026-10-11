import type {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {MUSCLES} from './education-data';
import {muscleGroupFor} from './muscle-group-study';
import {muscleSelectionColor} from './selection-palette';

export function MuscleGroupCard({name,controls,onMuscle}:{name:string;controls?:ReactNode;onMuscle?:(name:string,keys:string[])=>void}){
 const group=muscleGroupFor(name);
 if(!group)return null;
 return <section className="education-card muscle-group-card">
  <span className="edu-tag">{group.name} · {group.keys.length} kas</span>
  {controls}
  <p>Grup üyeleri farklı renklerle gösterilir; renkler aşağıdaki kas adlarıyla eşleşir. Kas kartını açmak için adına tıkla.</p>
  <div className="muscle-group-members" aria-label="Grubun kasları ve model renkleri">{group.keys.map((key,index)=>{
   const muscle=MUSCLES.find(m=>m.key===key)!;
   return <Button variant="outline" key={key} disabled={!onMuscle} onClick={()=>onMuscle?.(muscle.name,[key])}><span className="selection-swatch" style={{backgroundColor:muscleSelectionColor(key)}} aria-hidden="true"/><span className="muscle-group-member-label">{index+1}. {muscle.name}<small>3D model ve bilgi kartı</small></span><span aria-hidden="true">→</span></Button>;
  })}</div>
 </section>;
}
