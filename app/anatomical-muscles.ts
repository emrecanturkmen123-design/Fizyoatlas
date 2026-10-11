import * as T from 'three';
import {boneGuards,poseGuards,surfaceConstraints,stabilizeSurface,type BoneGuard} from './muscle-stability';
import type {Atlas,Part} from './anatomy';
import type {ElbowState} from './elbow-motion';
import {elbowAngle} from './elbow-motion';
import {around,jointAnchors} from './shoulder-motion';

export const MUSCLE_RIG_NAMES=['biceps brachii','triceps brachii'] as const;
export function isRigMuscle(part:Part,side:string){return part.system==='muscular'&&new RegExp(`\\b${side}\\b`,'i').test(part.name)&&MUSCLE_RIG_NAMES.some(name=>part.name.toLowerCase().includes(name));}
export function anatomicalMode(s:ElbowState|undefined){return !!s?.motion&&!!s.anatomicalMuscles&&['flexion','extension'].includes(s.id);}
interface Head {constraints:ReturnType<typeof surfaceConstraints>;part:Part;mesh:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;rest:Float32Array;parameters:Float32Array;offsets:T.Vector3[];tangents:T.Vector3[];start:T.Vector3;end:T.Vector3;insertion:T.Vector3;restCurve:T.Curve<T.Vector3>;restLength:number;kind:'biceps'|'triceps';}
interface Tendon {mesh:T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;rest:Float32Array;head:Head;nearest:Uint32Array;proximalBlend:Float32Array;distal:boolean;}
export interface MuscleRig {tendons:Tendon[];group:T.Group;heads:Head[];atlas:Atlas;side:'left'|'right';angle:number;markersVisible:boolean;markers:T.Mesh[];guards:BoneGuard[];}
const average=(points:T.Vector3[])=>points.reduce((sum,p)=>sum.add(p),new T.Vector3()).multiplyScalar(1/points.length);
function endCentres(g:T.BufferGeometry){const attr=g.getAttribute('position'),points=Array.from({length:attr.count},(_,i)=>new T.Vector3().fromBufferAttribute(attr,i));const ys=points.map(p=>p.y),lo=Math.min(...ys),hi=Math.max(...ys);return {start:average(points.filter(p=>p.y>=hi-.008)),end:average(points.filter(p=>p.y<=lo+.008))};}
function path(head:Pick<Head,'start'|'end'|'kind'|'insertion'>,elbow:T.Vector3,angle:number){
 const rotation=around(elbow,new T.Vector3(1,0,0),-T.MathUtils.degToRad(angle));
 let end=head.end.clone().applyMatrix4(rotation);
 if(head.kind==='biceps'){
  const oldAxis=head.insertion.clone().sub(head.start),newAxis=head.insertion.clone().applyMatrix4(rotation).sub(head.start),t=T.MathUtils.clamp(head.end.clone().sub(head.start).dot(oldAxis)/oldAxis.lengthSq(),0,1);const residual=head.end.clone().sub(head.start).addScaledVector(oldAxis,-t);const q=new T.Quaternion().setFromUnitVectors(oldAxis.clone().normalize(),newAxis.clone().normalize());end=head.start.clone().addScaledVector(newAxis,t).add(residual.applyQuaternion(q));
  const mid=head.start.clone().lerp(end,.5);mid.z+=.012*Math.sin(T.MathUtils.degToRad(angle));
  return new T.CatmullRomCurve3([head.start.clone(),mid,end]);
 }
 // A posterior wrapping guide around the elbow prevents the triceps path from
 // taking a straight chord through the joint. Radius is a teaching parameter.
 const radius=Math.max(.025,Math.abs(head.end.z-elbow.z));
 const wrap=elbow.clone().add(new T.Vector3(0,0,-radius));
 const points=[head.start.clone(),head.start.clone().lerp(wrap,.55)];
 for(let i=0;i<=16;i++)points.push(wrap.clone().applyMatrix4(around(elbow,new T.Vector3(1,0,0),-T.MathUtils.degToRad(angle*i/16))));
 points.push(end);
 return new T.CatmullRomCurve3(points.filter((p,i)=>!i||p.distanceTo(points[i-1])>1e-7));
}
function closestParameter(point:T.Vector3,curve:T.Curve<T.Vector3>){let distance=Infinity,at=0;for(let i=0;i<96;i++){const a=curve.getPointAt(i/96),b=curve.getPointAt((i+1)/96),d=b.clone().sub(a);const f=T.MathUtils.clamp(point.clone().sub(a).dot(d)/Math.max(d.lengthSq(),1e-12),0,1);const candidate=a.addScaledVector(d,f).distanceToSquared(point);if(candidate<distance){distance=candidate;at=(i+f)/96;}}return at;}
export function createMuscleRig(atlas:Atlas,geometry:Map<string,T.BufferGeometry>,side:MuscleRig['side'],showTendons=false):MuscleRig{
 const group=new T.Group();group.name='Anatomical muscle surfaces';const heads:Head[]=[];const elbow=jointAnchors(atlas,side).elbow;const longPart=atlas.parts.find(p=>p.name.toLowerCase()==='long head of '+side+' biceps brachii');const longGeometry=longPart?geometry.get(longPart.id):undefined;const commonInsertion=longGeometry?endCentres(longGeometry).end:elbow.clone().add(new T.Vector3(0,-.045,.01));
 for(const part of atlas.parts.filter(p=>isRigMuscle(p,side))){const source=geometry.get(part.id);if(!source)continue;const g=source.clone();g.deleteAttribute('partIndex');g.setAttribute('normal',new T.BufferAttribute(new Float32Array(part.vertexCount*3),3));const kind=part.name.toLowerCase().includes('biceps')?'biceps':'triceps';const {start,end}=endCentres(g);const insertion=kind==='biceps'?commonInsertion.clone():end.clone(),restCurve=path({start,end,kind,insertion},elbow,0),restLength=restCurve.getLength(),rest=new Float32Array(g.getAttribute('position').array),parameters=new Float32Array(part.vertexCount),offsets:T.Vector3[]=[],tangents:T.Vector3[]=[],colors=new Float32Array(part.vertexCount*3);
  const flesh=new T.Color(kind==='biceps'?0xb24747:0xd17d63),tendon=new T.Color(0xf2e7cf);
  for(let i=0;i<part.vertexCount;i++){const v=new T.Vector3().fromArray(rest,i*3),t=closestParameter(v,restCurve);parameters[i]=t;offsets.push(v.clone().sub(restCurve.getPointAt(t)));tangents.push(restCurve.getTangentAt(t));const blend=Math.max(1-T.MathUtils.smoothstep(t,0,.12),T.MathUtils.smoothstep(t,.87,1));flesh.clone().lerp(tendon,blend).toArray(colors,i*3);}
  g.setAttribute('color',new T.BufferAttribute(colors,3));g.computeVertexNormals();const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0,side:T.DoubleSide});const mesh=new T.Mesh(g,material);mesh.name=part.name;mesh.userData.partId=part.id;group.add(mesh);heads.push({constraints:surfaceConstraints(g,parameters),part,mesh,rest,parameters,offsets,tangents,start,end,insertion,restCurve,restLength,kind});
 }
 const tendons:Tendon[]=[],head=heads.find(h=>h.kind==='biceps'&&h.part.name.toLowerCase().includes('long head'));
 if(showTendons&&head)for(const part of atlas.parts.filter(p=>p.system==='connective'&&[side+' biceps long head tendon',side+' biceps distal tendon'].includes(p.name.toLowerCase()))){
  const original=geometry.get(part.id);if(!original)continue;const g=original.clone();g.deleteAttribute('partIndex');g.deleteAttribute('color');const rest=new Float32Array(g.attributes.position.array),nearest=new Uint32Array(rest.length/3),proximalBlend=new Float32Array(rest.length/3),distal=part.name.toLowerCase().endsWith('biceps distal tendon'),[lo,hi]=part.bounds;
  for(let i=0;i<nearest.length;i++){let best=Infinity;for(let j=0;j<head.rest.length;j+=3){const d=(rest[i*3]-head.rest[j])**2+(rest[i*3+1]-head.rest[j+1])**2+(rest[i*3+2]-head.rest[j+2])**2;if(d<best){best=d;nearest[i]=j/3;}}proximalBlend[i]=T.MathUtils.smoothstep(rest[i*3+1],lo[1]+.012,hi[1]-.008);}
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color:0xf0e1c9,side:T.DoubleSide,roughness:.8}));mesh.name=part.name;mesh.userData.partId=part.id;group.add(mesh);tendons.push({mesh,rest,head,nearest,proximalBlend,distal});
 }
 const markers:T.Mesh[]=[];for(const head of heads)for(const kind of ['origin','insertion']){const marker=new T.Mesh(new T.SphereGeometry(.0045,12,8),new T.MeshBasicMaterial({color:kind==='origin'?0x227faf:0x24895b,depthTest:false}));marker.renderOrder=15;marker.userData.kind=kind;marker.userData.head=head.part.id;group.add(marker);markers.push(marker);}return {tendons,group,heads,atlas,side,angle:NaN,markersVisible:false,markers,guards:boneGuards(atlas,geometry,side)};
}
export function updateMuscleRig(rig:MuscleRig,s:ElbowState){const angle=elbowAngle(s);if(rig.angle===angle&&rig.markersVisible===!!s.muscleAttachments)return;rig.markersVisible=!!s.muscleAttachments;for(const marker of rig.markers){marker.visible=!!s.muscleAttachments;const h=rig.heads.find(h=>h.part.id===marker.userData.head)!;marker.position.copy(marker.userData.kind==='origin'?h.start:h.insertion);if(marker.userData.kind==='insertion')marker.position.applyMatrix4(around(jointAnchors(rig.atlas,rig.side).elbow,new T.Vector3(1,0,0),-T.MathUtils.degToRad(angle)));}if(rig.angle===angle)return;const elbow=jointAnchors(rig.atlas,rig.side).elbow;
 for(const h of rig.heads){const pos=h.mesh.geometry.getAttribute('position') as T.BufferAttribute;if(angle===0){(pos.array as Float32Array).set(h.rest);}else{const curve=path(h,elbow,angle),ratio=T.MathUtils.clamp(h.restLength/curve.getLength(),.65,1.8),rotation=new T.Quaternion();for(let i=0;i<pos.count;i++){const t=h.parameters[i];rotation.setFromUnitVectors(h.tangents[i],curve.getTangentAt(t));const radialScale=1+(Math.sqrt(ratio)-1)*Math.sin(Math.PI*t)**2;const p=h.offsets[i].clone().applyQuaternion(rotation).multiplyScalar(radialScale).add(curve.getPointAt(t));pos.setXYZ(i,p.x,p.y,p.z);}}
  stabilizeSurface(pos,h.constraints,poseGuards(rig.guards,b=>b==='humerus'?new T.Matrix4():around(elbow,new T.Vector3(1,0,0),-T.MathUtils.degToRad(angle))),T.MathUtils.smoothstep(angle,0,45));pos.needsUpdate=true;h.mesh.geometry.computeVertexNormals();h.mesh.geometry.computeBoundingSphere();h.mesh.geometry.computeBoundingBox();
 }
 const rotation=around(elbow,new T.Vector3(1,0,0),-T.MathUtils.degToRad(angle)),p=new T.Vector3(),musclePoint=new T.Vector3();
 for(const tendon of rig.tendons){const position=tendon.mesh.geometry.attributes.position as T.BufferAttribute,muscle=tendon.head.mesh.geometry.attributes.position;
  for(let i=0;i<position.count;i++){const j=tendon.nearest[i];p.fromArray(tendon.rest,i*3);musclePoint.copy(p).add(new T.Vector3().fromBufferAttribute(muscle,j).sub(new T.Vector3().fromArray(tendon.head.rest,j*3)));if(tendon.distal)p.applyMatrix4(rotation).lerp(musclePoint,tendon.proximalBlend[i]);else p.lerp(musclePoint,1-tendon.proximalBlend[i]);position.setXYZ(i,p.x,p.y,p.z);}
  position.needsUpdate=true;tendon.mesh.geometry.computeVertexNormals();tendon.mesh.geometry.computeBoundingSphere();tendon.mesh.geometry.computeBoundingBox();
 }
 rig.angle=angle;
}
export function rigMeasurements(rig:MuscleRig,s:ElbowState){const elbow=jointAnchors(rig.atlas,rig.side).elbow;return rig.heads.map(h=>({id:h.part.id,kind:h.kind,rest:h.restLength,length:path(h,elbow,elbowAngle(s)).getLength()}));}
export function disposeMuscleRig(rig:MuscleRig){rig.group.removeFromParent();for(const h of [...rig.heads,...rig.tendons]){h.mesh.geometry.dispose();h.mesh.material.dispose();}for(const m of rig.markers){m.geometry.dispose();(m.material as T.Material).dispose();}rig.markers=[];rig.heads=[];rig.tendons=[];rig.group.clear();}
