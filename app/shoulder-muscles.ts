import {CUFF,cuffParts} from './shoulder-study';
import * as T from 'three';
import {rigidBlend,boneGuards,poseGuards,surfaceConstraints,stabilizeSurface,type BoneGuard} from './muscle-stability';
import {angleFor,jointAnchors} from './shoulder-motion';
import type {Atlas,Part} from './anatomy';import type {ShoulderState} from './shoulder';
import {shoulderRoles,SHOULDER_MOVES} from './shoulder';import {poseMatrices} from './shoulder-motion';
import {ATTACHMENTS,attachmentTargets} from './attachments';import {muscleFor} from './education-data';
interface Surface {part:Part;mesh:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;rest:Float32Array;weights:Float32Array;scapularOrigin:boolean;translationAnchor?:T.Vector3;constraints:ReturnType<typeof surfaceConstraints>;}
interface TendonSurface {mesh:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;rest:Float32Array;muscle?:Surface;nearest?:Uint32Array;distalWeights?:Float32Array;}
export interface ShoulderRig {tendons:TendonSurface[];group:T.Group;surfaces:Surface[];atlas:Atlas;key:string;guards:BoneGuard[];}
export function createShoulderRig(atlas:Atlas,geometries:Map<string,T.BufferGeometry>,s:ShoulderState):ShoulderRig{
 const group=new T.Group(),surfaces:Surface[]=[],tendons:TendonSurface[]=[];const move=SHOULDER_MOVES.find(m=>m.id===s.id)!,roles=shoulderRoles(atlas,move,s.side),ids=new Set([...roles.agonists,...(s.antagonists!==false?roles.antagonists:[])]);
 if(s.cuff!==false)for(const p of cuffParts(atlas,s.side).filter(p=>p.system==='muscular'))ids.add(p.id);
 for(const part of atlas.parts.filter(p=>ids.has(p.id))){const original=geometries.get(part.id),key=muscleFor(part.name)?.key;if(!original||!key||!ATTACHMENTS[key])continue;const targets=attachmentTargets(atlas,{key,side:s.side,mode:'both'}),origins=targets.filter(t=>t.kind==='origin'&&(key!=='deltoid'||t.label.includes(/clavicular/i.test(part.name)?'Clavicula':/acromial/i.test(part.name)?'Acromion':'Spina'))).map(t=>new T.Vector3().fromArray(t.seed)),insertion=targets.find(t=>t.kind==='insertion');if(!origins.length||!insertion)continue;
  const rest=new Float32Array(original.getAttribute('position').array),g=original.clone();g.deleteAttribute('partIndex');g.setAttribute('normal',new T.BufferAttribute(new Float32Array(rest.length),3));const weights=new Float32Array(rest.length/3),colors=new Float32Array(rest.length),insertSeed=new T.Vector3().fromArray(insertion.seed),flesh=new T.Color(0xaf5550);
  // Project the attachment seeds to this muscle's surface before weighting.
  const nearest=(seed:T.Vector3)=>{let best=Infinity,point=seed.clone();for(let i=0;i<rest.length;i+=3){const p=new T.Vector3().fromArray(rest,i),d=p.distanceToSquared(seed);if(d<best){best=d;point=p;}}return point;};
  const insert=nearest(insertSeed),originPoints=origins.map(nearest);
  for(let i=0;i<weights.length;i++){const p=new T.Vector3().fromArray(rest,i*3),di=p.distanceTo(insert),dO=Math.min(...originPoints.map(o=>p.distanceTo(o))),w=dO/Math.max(1e-8,dO+di);weights[i]=T.MathUtils.smoothstep(w,.08,.9);flesh.toArray(colors,i*3);}
  // Rotator-cuff bellies stay on the scapular fossae. Only the lateral
  // musculotendinous region follows the humeral insertion; rotating the whole
  // sheet makes subscapularis/infraspinatus sink through the scapula.
  if(CUFF.some(c=>c.key===key)){
   const reach=T.MathUtils.clamp(Math.min(...originPoints.map(o=>o.distanceTo(insert)))*.45,.028,.06);
   for(let i=0;i<weights.length;i++)weights[i]=1-T.MathUtils.smoothstep(new T.Vector3().fromArray(rest,i*3).distanceTo(insert),.008,reach);
  }
  // Each source portion has a medial attachment edge; do not use the other
  // portions' origin seeds to create interior fixed islands.
  if(key==='pectoralis major'){
   const xs=Array.from({length:weights.length},(_,i)=>Math.abs(rest[i*3])),lo=Math.min(...xs),hi=Math.max(...xs);
   for(let i=0;i<weights.length;i++)weights[i]=T.MathUtils.smoothstep((xs[i]-lo)/Math.max(hi-lo,1e-8),.08,.94);
  }
  // Deltoid / coracobrachialis bellies follow the humerus; the proximal region
  // blends into that head's own origin (coracoid for coracobrachialis).
  if(key==='deltoid'||key==='coracobrachialis'){
   const top=Math.max(...originPoints.map(p=>p.y)),bottom=Math.min(top-.055,jointAnchors(atlas,s.side).shoulder.y-.035);
   for(let i=0;i<weights.length;i++)weights[i]=1-T.MathUtils.smoothstep(rest[i*3+1],bottom,top);
  }
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.75}));mesh.name=part.name;mesh.userData.partId=part.id;group.add(mesh);
  const scapularOrigin=key!=='latissimus dorsi'&&key!=='pectoralis major'&&!(key==='deltoid'&&/clavicular/i.test(part.name));surfaces.push({part,mesh,rest,weights,scapularOrigin,translationAnchor:['pectoralis major','latissimus dorsi','teres major'].includes(key)?insert:undefined,constraints:surfaceConstraints(g,weights)});
 }
 // Source bodies follow the neighbouring muscle at the tissue boundary and the
 // humerus at the insertion. Original arrays stay immutable at every pose.
 if(s.tendons!==false)for(const part of cuffParts(atlas,s.side).filter(p=>p.system==='connective')){
  const entry=CUFF.find(c=>part.clinicalKey===c.tendon||part.name.toLowerCase().endsWith(c.tendon))!,muscle=surfaces.find(x=>x.part.name.toLowerCase().includes(entry.key)),original=geometries.get(part.id);
  if(!original||!muscle)continue;
  const g=original.clone();g.deleteAttribute('partIndex');g.deleteAttribute('color');
  const rest=new Float32Array(g.getAttribute('position').array),mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:0xf0e1c9,side:T.DoubleSide,roughness:.8,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  mesh.name=part.name;mesh.userData.partId=part.id;group.add(mesh);
  if(entry.key==='infraspinatus'||part.modelRole==='body'){
   const nearest=new Uint32Array(rest.length/3);
   for(let i=0;i<nearest.length;i++){let best=Infinity;for(let j=0;j<muscle.rest.length;j+=3){const d=(rest[i*3]-muscle.rest[j])**2+(rest[i*3+1]-muscle.rest[j+1])**2+(rest[i*3+2]-muscle.rest[j+2])**2;if(d<best){best=d;nearest[i]=j/3;}}}
   let distalWeights:Float32Array|undefined;
   if(part.modelRole==='body'){
    const footprint=atlas.parts.find(p=>p.name.toLowerCase()===`${s.side} ${entry.tendon}`),attachment=footprint&&geometries.get(footprint.id)?.getAttribute('position');
    distalWeights=new Float32Array(rest.length/3);
    for(let i=0;i<distalWeights.length;i++){
     let distance=Infinity;
     if(attachment)for(let j=0;j<attachment.count;j++)distance=Math.min(distance,Math.hypot(rest[i*3]-attachment.getX(j),rest[i*3+1]-attachment.getY(j),rest[i*3+2]-attachment.getZ(j)));
     else if(footprint){const b=footprint.bounds;distance=Math.hypot(...[0,1,2].map(k=>Math.max(b[0][k]-rest[i*3+k],0,rest[i*3+k]-b[1][k])));}
     // The source UV cut marks the muscle-side boundary. Distance to the
     // footprint alone cannot separate the ends of short, broad tendons.
     let muscleDistance=Infinity;
     for(const j of part.tendonBoundary??[])muscleDistance=Math.min(muscleDistance,Math.hypot(rest[i*3]-rest[j*3],rest[i*3+1]-rest[j*3+1],rest[i*3+2]-rest[j*3+2]));
     const fraction=muscleDistance/Math.max(1e-8,muscleDistance+distance);
     distalWeights[i]=Number.isFinite(fraction)?fraction:1-T.MathUtils.smoothstep(distance,.003,.012);
    }
    // Broad attachment sheets can put both boundaries close to the footprint.
    // Normalize their relative attachment score to this source region, so the
    // muscle boundary remains fixed to muscle and its insertion patch is rigid.
    const high=Math.max(...distalWeights)*.8,low=Math.min(.12,high*.2);
    for(let i=0;i<distalWeights.length;i++)distalWeights[i]=T.MathUtils.smoothstep(distalWeights[i],low,high);
   }
   tendons.push({mesh,rest,muscle,nearest,distalWeights});
  }else tendons.push({mesh,rest});
 }
 return {tendons,group,surfaces,atlas,key:'',guards:boneGuards(atlas,geometries,s.side)};
}
export function updateShoulderRig(rig:ShoulderRig,s:ShoulderState){const key=JSON.stringify([s.id,s.side,s.progress??0,!!s.scapula]);if(rig.key===key)return;const pose=poseMatrices(rig.atlas,s),fixed=new T.Matrix4(),p=new T.Vector3(),guards=poseGuards(rig.guards,b=>b==='humerus'?pose.upper:pose.lower);
 for(const surface of rig.surfaces){const position=surface.mesh.geometry.getAttribute('position') as T.BufferAttribute,blend=rigidBlend(surface.scapularOrigin?pose.scapula:fixed,pose.upper);const origin=surface.scapularOrigin?pose.scapula:fixed,anchor=surface.translationAnchor,shift=anchor?anchor.clone().applyMatrix4(pose.upper).sub(anchor.clone().applyMatrix4(origin)):undefined;
 for(let i=0;i<surface.weights.length;i++){p.fromArray(surface.rest,i*3);const w=surface.weights[i];if(shift){const distal=p.clone().applyMatrix4(pose.upper);p.applyMatrix4(origin).addScaledVector(shift,w).lerp(distal,T.MathUtils.smoothstep(w,.85,1));}else blend(p,w);position.setXYZ(i,p.x,p.y,p.z);}stabilizeSurface(position,surface.constraints,guards,T.MathUtils.smoothstep(Math.abs(angleFor(s)),0,35));position.needsUpdate=true;surface.mesh.geometry.computeVertexNormals();surface.mesh.geometry.computeBoundingSphere();surface.mesh.geometry.computeBoundingBox();}
 for(const tendon of rig.tendons){const position=tendon.mesh.geometry.getAttribute('position') as T.BufferAttribute;
  for(let i=0;i<position.count;i++){p.fromArray(tendon.rest,i*3);
   if(tendon.muscle&&tendon.nearest){const j=tendon.nearest[i],m=tendon.muscle.mesh.geometry.getAttribute('position');p.x+=m.getX(j)-tendon.muscle.rest[j*3];p.y+=m.getY(j)-tendon.muscle.rest[j*3+1];p.z+=m.getZ(j)-tendon.muscle.rest[j*3+2];if(tendon.distalWeights)p.lerp(new T.Vector3().fromArray(tendon.rest,i*3).applyMatrix4(pose.upper),tendon.distalWeights[i]);}
   else p.applyMatrix4(pose.upper);
   position.setXYZ(i,p.x,p.y,p.z);
  }position.needsUpdate=true;tendon.mesh.geometry.computeVertexNormals();tendon.mesh.geometry.computeBoundingSphere();tendon.mesh.geometry.computeBoundingBox();
 }rig.key=key;
}
export function disposeShoulderRig(rig:ShoulderRig){rig.group.removeFromParent();for(const s of [...rig.surfaces,...rig.tendons]){s.mesh.geometry.dispose();s.mesh.material.dispose();}rig.surfaces=[];rig.tendons=[];rig.group.clear();}
