import {Material,Mesh,type Object3D} from 'three';

const original=new WeakMap<Material,{opacity:number;transparent:boolean;depthWrite:boolean}>();
// Source rigs use individual muscle materials. Context bones may share a
// material, since muscle inspection never selects a bone in these rigs.
export function applyMotionContextOpacity(roots:(Object3D|undefined)[],selected:ReadonlySet<string>,opacity:number){
 let changed=false;const value=selected.size?Math.max(.05,Math.min(1,opacity)):1;
 for(const root of roots)root?.traverse(object=>{
  if(!(object instanceof Mesh)||!object.userData.partId)return;
  const amount=selected.has(object.userData.partId)?1:value;
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(!original.has(material))original.set(material,{opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite});
   const base=original.get(material)!,transparent=amount<1||base.transparent,depthWrite=amount<1?false:base.depthWrite,next=base.opacity*amount;
   if(material.opacity!==next||material.transparent!==transparent||material.depthWrite!==depthWrite){
    if(material.transparent!==transparent)material.needsUpdate=true;
    material.opacity=next;material.transparent=transparent;material.depthWrite=depthWrite;changed=true;
   }
  }
 });return changed;
}
