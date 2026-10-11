import {patellaMatrix} from './knee-tendon';
import {tendonParts} from './tendon-model';
import {rigidBlend} from './muscle-stability';
import {achillesParts} from './achilles-study';
import * as T from 'three';
import type {Atlas,Part,SceneState} from './anatomy';
import {muscleFor} from './education-data';
import {attachmentTargets} from './attachments';
import {lowerRoles,lowerMatrices,lowerAnchor,lowerSegment} from './lower-motion';
import {kneeRoles,kneeMatrices,kneeAnchor} from './knee-motion';
import {createMuscleRig,updateMuscleRig,disposeMuscleRig} from './anatomical-muscles';
import {elbowMatrices} from './elbow-motion';
export type LimbKind='hip'|'ankle'|'knee'|'forearm';
interface Surface {part:Part;mesh:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;rest:Float32Array;weights:Float32Array;originBone:string;insertionBone:string;posedForearm?:Float32Array;distalAnchor?:T.Vector3;forearmTip?:T.Vector3;calfFollowers?:{surface:Surface;index:number;blend:number}[];}
export interface LimbRig {group:T.Group;surfaces:Surface[];key:string;kind:LimbKind;side:'left'|'right';atlas:Atlas;}
export function limbConfig(s:SceneState){
 if(s.lower?.motion&&s.lower.anatomicalMuscles)return {kind:s.lower.joint,side:s.lower.side};
 if(s.knee?.motion&&s.knee.anatomicalMuscles)return {kind:'knee' as const,side:s.knee.side};
 if(s.elbow?.motion&&s.elbow.anatomicalMuscles&&['pronation','supination'].includes(s.elbow.id))return {kind:'forearm' as const,side:s.elbow.side};
}
export function limbMuscleIds(atlas:Atlas,s:SceneState){
 const c=limbConfig(s);if(!c)return[];
 if(c.kind==='forearm')return atlas.parts.filter(p=>p.system==='muscular'&&new RegExp('\\b'+c.side+'\\b','i').test(p.name)&&['pronator teres','pronator quadratus','supinator','biceps brachii'].includes(muscleFor(p.name)?.key??'')).map(p=>p.id);
 const calf=c.kind==='ankle'&&s.lower?.achilles!==false?achillesParts(atlas,c.side).filter(p=>p.system==='muscular').map(p=>p.id):[];
 const quadriceps=c.kind==='knee'&&s.knee?.tendons?atlas.parts.filter(p=>p.system==='muscular'&&new RegExp('\\b'+c.side+'\\b','i').test(p.name)&&/rectus femoris|vastus/.test(p.name.toLowerCase())).map(p=>p.id):[];
 const roles=s.lower?lowerRoles(atlas,s.lower):kneeRoles(atlas,s.knee!);return [...new Set([...calf,...quadriceps,...roles.agonists,...((s.lower??s.knee)?.antagonists?roles.antagonists:[])])];
}
function headOrigins(name:string,targets:ReturnType<typeof attachmentTargets>){const n=name.toLowerCase();if(n.includes('biceps brachii'))return targets.filter(t=>t.kind!=='origin'||t.label.includes(n.includes('long head')?'Uzun baş':'Kısa baş'));if(n.includes('biceps femoris'))return targets.filter(t=>t.kind!=='origin'||t.label.includes(n.includes('short head')?'Kısa baş':'Uzun baş'));if(n.includes('gastrocnemius'))return targets.filter(t=>t.kind!=='origin'||t.label.includes(n.includes('medial head')?'Medial baş':'Lateral baş'));return targets;}
export function createLimbRig(atlas:Atlas,geometries:Map<string,T.BufferGeometry>,s:SceneState):LimbRig{
 const config=limbConfig(s)!;const rig:LimbRig={...config,atlas,group:new T.Group(),surfaces:[],key:''},ids=new Set(limbMuscleIds(atlas,s));
 for(const part of atlas.parts.filter(p=>ids.has(p.id))){const source=geometries.get(part.id),key=muscleFor(part.name)?.key;if(!source||!key)continue;
 const targets=headOrigins(part.name,attachmentTargets(atlas,{key,side:config.side,mode:'both'})),origins=targets.filter(t=>t.kind==='origin'),insertions=targets.filter(t=>t.kind==='insertion');
 if(!origins.length||!insertions.length)continue;
 // The optional tendon layer uses the schematic patellar transform; otherwise
 // the quadriceps insertion follows the tibial teaching endpoint.
 const insertion=insertions.find(t=>config.kind==='knee'&&atlas.parts.find(p=>p.id===t.boneId)?.name.toLowerCase().includes(s.knee?.tendons?'patella':'tibia'))??insertions[0];
 const g=source.clone(),rest=new Float32Array(source.attributes.position.array),weights=new Float32Array(rest.length/3);g.deleteAttribute('partIndex');g.setAttribute('normal',new T.BufferAttribute(new Float32Array(rest.length),3));
 const near=(seed:number[])=>{const a=new T.Vector3().fromArray(seed),p=new T.Vector3(),b=a.clone();let distance=Infinity;for(let i=0;i<rest.length;i+=3){p.fromArray(rest,i);const d=p.distanceToSquared(a);if(d<distance){distance=d;b.copy(p);}}return b;};const op=origins.map(t=>near(t.seed)),ip=near(insertion.seed),point=new T.Vector3(),colors=new Float32Array(rest.length),flesh=new T.Color(.57,.21,.18),tendon=new T.Color(.88,.82,.68);
 for(let i=0;i<weights.length;i++){point.fromArray(rest,i*3);const dO=Math.min(...op.map(p=>p.distanceTo(point))),dI=ip.distanceTo(point),w=dO/Math.max(1e-8,dO+dI);weights[i]=T.MathUtils.smoothstep(w,.08,.9);(config.kind==='ankle'?flesh:flesh.clone().lerp(tendon,Math.max(1-T.MathUtils.smoothstep(w,0,.08),T.MathUtils.smoothstep(w,.85,1)))).toArray(colors,i*3);}
 // Knee bending must not drag the entire thigh/calf towards the opposite
 // attachment. Keep each muscle belly with its bone and blend only near knee.
 if(config.kind==='knee'){
  const kneeY=kneeAnchor(atlas,config.side).y,calf=/gastrocnemius/i.test(part.name);
  const originY=Math.max(...op.map(p=>p.y));
  const top=calf?originY:Math.max(ip.y+.08,kneeY+.10);
  const bottom=calf?Math.min(originY-.10,kneeY-.08):ip.y;
  for(let i=0;i<weights.length;i++)weights[i]=1-T.MathUtils.smoothstep(rest[i*3+1],bottom,top);
 }
 // Local joint blending keeps long muscle bellies with their limb segment.
 if(config.kind==='hip'&&/rectus femoris|semitendinosus|semimembranosus|biceps femoris/i.test(part.name)){
  const top=Math.max(...op.map(p=>p.y)),bottom=Math.min(top-.12,lowerAnchor(atlas,{joint:'hip',side:config.side}).y-.14);
  for(let i=0;i<weights.length;i++)weights[i]=1-T.MathUtils.smoothstep(rest[i*3+1],bottom,top);
 }
 if(config.kind==='ankle'){
  const bottom=ip.y,top=Math.max(bottom+.08,lowerAnchor(atlas,{joint:'ankle',side:config.side}).y+.14);
  for(let i=0;i<weights.length;i++)weights[i]=1-T.MathUtils.smoothstep(rest[i*3+1],bottom,top);
 }
 g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.75}));mesh.userData.partId=part.id;mesh.name=part.name;rig.group.add(mesh);rig.surfaces.push({part,mesh,rest,weights,originBone:origins[0].boneId,insertionBone:insertion.boneId,distalAnchor:config.kind==='ankle'?new T.Vector3().fromArray(insertion.seed):undefined});
 }
 if(config.kind==='knee'&&s.knee?.tendons){
  const part=tendonParts(atlas,'quadriceps tendon',config.side)[0],source=part&&geometries.get(part.id),heads=rig.surfaces.filter(h=>/rectus femoris|vastus/.test(h.part.name.toLowerCase())),patella=atlas.parts.find(p=>p.name.toLowerCase()===config.side+' patella');
  if(part&&source&&heads.length&&patella){
   const g=source.clone();g.deleteAttribute('partIndex');g.deleteAttribute('color');const rest=new Float32Array(g.attributes.position.array),weights=new Float32Array(rest.length/3),calfFollowers:NonNullable<Surface['calfFollowers']>=[],[lo,hi]=part.bounds;
   for(let i=0;i<weights.length;i++){let best=Infinity,closest=heads[0],index=0;for(const h of heads)for(let j=0;j<h.weights.length;j++){const d=(rest[i*3]-h.rest[j*3])**2+(rest[i*3+1]-h.rest[j*3+1])**2+(rest[i*3+2]-h.rest[j*3+2])**2;if(d<best){best=d;closest=h;index=j;}}const blend=T.MathUtils.smoothstep(rest[i*3+1],lo[1]+.025,hi[1]-.008);weights[i]=blend;calfFollowers.push({surface:closest,index,blend});}
   const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:0xf0e1c9,side:T.DoubleSide,roughness:.8}));mesh.name=part.name;mesh.userData.partId=part.id;rig.group.add(mesh);rig.surfaces.push({part,mesh,rest,weights,originBone:heads[0].originBone,insertionBone:patella.id,calfFollowers});
  }
 }
 if(config.kind==='ankle'&&s.lower?.achilles!==false){
  const part=achillesParts(atlas,config.side).find(p=>p.system==='connective'),calf=rig.surfaces.filter(h=>/soleus|gastrocnemius/i.test(h.part.name));
  const source=part&&geometries.get(part.id),soleus=calf.find(h=>/soleus/i.test(h.part.name));
  if(part&&source&&soleus){
   const g=source.clone(),rest=new Float32Array(source.attributes.position.array),weights=new Float32Array(rest.length/3);g.deleteAttribute('partIndex');g.deleteAttribute('color');g.setAttribute('normal',new T.BufferAttribute(new Float32Array(rest.length),3));
   // Source surface is unchanged at rest. The distal 12 mm shares the rigid
   // calcaneal transform; proximal weights follow the closest calf surface.
   const low=part.bounds[0][1],high=part.bounds[1][1],calfFollowers:NonNullable<Surface['calfFollowers']>=[];
   for(let i=0;i<weights.length;i++){let best=Infinity,w=0,closest=calf[0],index=0;for(const h of calf)for(let j=0;j<h.weights.length;j++){const d=(rest[i*3]-h.rest[j*3])**2+(rest[i*3+1]-h.rest[j*3+1])**2+(rest[i*3+2]-h.rest[j*3+2])**2;if(d<best){best=d;w=h.weights[j];closest=h;index=j;}}const proximal=T.MathUtils.smoothstep(rest[i*3+1],low+.012,high);weights[i]=T.MathUtils.lerp(1,w,proximal);calfFollowers.push({surface:closest,index,blend:proximal});}
   g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:0xf0e1c9,side:T.DoubleSide,roughness:.8}));mesh.name=part.name;mesh.userData.partId=part.id;rig.group.add(mesh);rig.surfaces.push({part,mesh,rest,weights,originBone:soleus.originBone,insertionBone:soleus.insertionBone,calfFollowers});
  }
 }
 if(config.kind==='forearm'){
  // Preserve the established curved biceps path at the fixed 90° elbow pose.
  // Only the distal surface follows radius rotation; blending a straight arm
  // with a rotated forearm produces a non-anatomical triangular sheet.
  const biceps=createMuscleRig(atlas,geometries,config.side,!!s.elbow?.tendons);
  updateMuscleRig(biceps,{id:'flexion',side:config.side,progress:75,playing:false,motion:true});
  for(const surface of rig.surfaces){const head=biceps.heads.find(h=>h.part.id===surface.part.id&&h.kind==='biceps');if(head){surface.posedForearm=new Float32Array(head.mesh.geometry.attributes.position.array);surface.forearmTip=head.insertion.clone().applyMatrix4(elbowMatrices(atlas,s.elbow!).upper);for(let i=0;i<surface.weights.length;i++)surface.weights[i]=T.MathUtils.smoothstep(head.parameters[i],.92,1);}}
  // First put forearm muscles into the fixed bent-elbow pose, then rotate
  // their radial attachment. Applying both rotations in one linear blend
  // stretches them diagonally through the elbow and collapses twisted tissue.
  const upper=elbowMatrices(atlas,s.elbow!).upper,hinge=rigidBlend(new T.Matrix4(),upper),v=new T.Vector3();
  for(const h of rig.surfaces)if(!h.posedForearm){
   h.posedForearm=new Float32Array(h.rest);
   const humeral=atlas.parts.find(p=>p.id===h.originBone)!.name.toLowerCase().includes('humerus');
   for(let i=0;i<h.weights.length;i++){v.fromArray(h.rest,i*3);hinge(v,humeral?T.MathUtils.smoothstep(h.weights[i],0,.3):1);v.toArray(h.posedForearm,i*3);}
  }
  // Keep the real distal tendon in the same 90-degree reference pose as its
  // muscle. Its radius attachment rotates rigidly with the radius; the
  // musculotendinous end stays with the posed biceps. No new band is generated.
  if(s.elbow?.tendons){
   const tendon=biceps.tendons.find(t=>t.distal),radius=atlas.parts.find(p=>p.name.toLowerCase()===config.side+' radius');
   if(tendon&&radius){
    const part=atlas.parts.find(p=>p.id===tendon.mesh.userData.partId)!,g=tendon.mesh.geometry.clone(),rest=new Float32Array(tendon.rest),weights=Float32Array.from(tendon.proximalBlend,w=>1-w);
    const mesh=new T.Mesh(g,tendon.mesh.material.clone());mesh.name=part.name;mesh.userData.partId=part.id;rig.group.add(mesh);
    rig.surfaces.push({part,mesh,rest,weights,posedForearm:new Float32Array(g.attributes.position.array),originBone:radius.id,insertionBone:radius.id});
   }
  }
  disposeMuscleRig(biceps);
 }
 return rig;
}
export function boneMatrix(rig:LimbRig,boneId:string,s:SceneState){const name=rig.atlas.parts.find(p=>p.id===boneId)!.name.toLowerCase(),identity=new T.Matrix4();
 if(rig.kind==='forearm'){const pose=elbowMatrices(rig.atlas,s.elbow!);return name.includes('radius')?pose.lower:name.includes('ulna')?pose.upper:identity;}
 if(rig.kind==='hip')return /femur|tibia|fibula|patella|calcaneus/.test(name)?lowerMatrices(rig.atlas,s.lower!).upper:identity;
 if(rig.kind==='ankle')return lowerSegment(rig.atlas.parts.find(p=>p.id===boneId)!,{joint:'ankle',side:rig.side})?lowerMatrices(rig.atlas,s.lower!).upper:identity;
 if(s.knee?.tendons&&name.includes('patella'))return patellaMatrix(rig.atlas,s.knee);
 return /tibia|fibula|calcaneus/.test(name)?kneeMatrices(rig.atlas,s.knee!).upper:identity;
}
export function updateLimbRig(rig:LimbRig,s:SceneState){const key=JSON.stringify(s.lower??s.knee??s.elbow);if(key===rig.key)return;const p=new T.Vector3();
 for(const surface of rig.surfaces){const origin=boneMatrix(rig,surface.originBone,s),insert=boneMatrix(rig,surface.insertionBone,s),pos=surface.mesh.geometry.attributes.position as T.BufferAttribute,twist=surface.posedForearm?insert.clone().multiply(elbowMatrices(rig.atlas,s.elbow!).upper.clone().invert()):undefined;const distalShift=surface.distalAnchor?surface.distalAnchor.clone().applyMatrix4(insert).sub(surface.distalAnchor):undefined;const blend=rigidBlend(origin,insert),twistBlend=twist?rigidBlend(new T.Matrix4(),twist):undefined;for(let i=0;i<pos.count;i++){p.fromArray(surface.rest,i*3);if(surface.calfFollowers){const f=surface.calfFollowers[i],prox=p.clone().add(new T.Vector3().fromBufferAttribute(f.surface.mesh.geometry.attributes.position,f.index).sub(new T.Vector3().fromArray(f.surface.rest,f.index*3)));p.applyMatrix4(insert).lerp(prox,f.blend);pos.setXYZ(i,p.x,p.y,p.z);continue;}if(distalShift){p.addScaledVector(distalShift,surface.weights[i]);pos.setXYZ(i,p.x,p.y,p.z);continue;}if(surface.posedForearm){if(surface.part.system==='connective'&&surface.weights[i]===1){p.applyMatrix4(insert);pos.setXYZ(i,p.x,p.y,p.z);continue;}p.fromArray(surface.posedForearm,i*3);if(surface.forearmTip)p.addScaledVector(surface.forearmTip.clone().applyMatrix4(twist!).sub(surface.forearmTip),surface.weights[i]);else twistBlend!(p,surface.weights[i]);pos.setXYZ(i,p.x,p.y,p.z);continue;}blend(p,surface.weights[i]);pos.setXYZ(i,p.x,p.y,p.z);}pos.needsUpdate=true;surface.mesh.geometry.computeVertexNormals();surface.mesh.geometry.computeBoundingBox();surface.mesh.geometry.computeBoundingSphere();}rig.key=key;
}
export function disposeLimbRig(rig:LimbRig){rig.group.removeFromParent();for(const s of rig.surfaces){s.mesh.geometry.dispose();s.mesh.material.dispose();}rig.surfaces=[];rig.group.clear();}
