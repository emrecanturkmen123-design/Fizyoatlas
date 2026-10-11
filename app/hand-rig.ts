import * as T from 'three';
import type {Atlas,Part} from './anatomy';
import {handPose,handBone,handSoftParts,handMuscleParts,type HandState} from './hand-motion';
interface SkinVertex{bones:string[];weights:number[];blend:number}
interface HandMesh{part:Part;mesh:T.Mesh;rest?:Float32Array;normals?:Float32Array;skin?:SkinVertex[]}
export interface HandRig{group:T.Group;meshes:HandMesh[];atlas:Atlas;key:string}
function makeSkin(atlas:Atlas,part:Part,rest:Float32Array,s:HandState):SkinVertex[]{
 const wrist=handPose(atlas,s).wristPoint;
 let bones=atlas.parts.filter(p=>handBone(p,s.side));
 if(/pollicis/i.test(part.name))bones=bones.filter(p=>/thumb|first metacarpal|trapezium/i.test(p.name));
 else if(/indicis/i.test(part.name))bones=bones.filter(p=>/index|second metacarpal/i.test(p.name));
 else if(/digiti minimi/i.test(part.name))bones=bones.filter(p=>/little|fifth metacarpal/i.test(p.name));
 const centres=bones.map(p=>({id:p.id,center:new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5)}));
 const out:SkinVertex[]=[];const point=new T.Vector3();
 for(let i=0;i<rest.length;i+=3){point.fromArray(rest,i);const nearest=centres.map(c=>({id:c.id,d:point.distanceToSquared(c.center)})).sort((a,b)=>a.d-b.d).slice(0,3),raw=nearest.map(c=>1/Math.max(c.d*c.d,1e-12)),sum=raw.reduce((a,b)=>a+b,0);out.push({bones:nearest.map(c=>c.id),weights:raw.map(v=>v/sum),blend:1-T.MathUtils.smoothstep(point.y,wrist.y-.004,wrist.y+.035)});}
 return out;
}
export function createHandRig(atlas:Atlas,geometries:Map<string,T.BufferGeometry>,s:HandState):HandRig{
 const group=new T.Group(),meshes:HandMesh[]=[];
 const parts=[...atlas.parts.filter(p=>handBone(p,s.side)),...handSoftParts(atlas,s).filter(p=>p.system==='muscular'?s.anatomicalMuscles:s.tendons)];
 for(const part of parts){const source=geometries.get(part.id);if(!source)continue;const geometry=source.clone();geometry.deleteAttribute('partIndex');
  const material=new T.MeshStandardMaterial({color:part.system==='skeletal'?0xe5d6b1:part.system==='muscular'?0xb36c5b:0xd7e4df,roughness:.63,side:T.DoubleSide});
  const mesh=new T.Mesh(geometry,material);mesh.userData.partId=part.id;mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;group.add(mesh);const entry:HandMesh={part,mesh};
  if(part.system!=='skeletal'){const position=source.getAttribute('position'),normal=source.getAttribute('normal');entry.rest=new Float32Array(position.array as Float32Array);entry.normals=new Float32Array(position.count*3);for(let i=0;i<position.count;i++)entry.normals.set([normal.getX(i),normal.getY(i),normal.getZ(i)],i*3);geometry.setAttribute('normal',new T.BufferAttribute(entry.normals.slice(),3));entry.skin=makeSkin(atlas,part,entry.rest,s);}
  meshes.push(entry);
 }
 return {group,meshes,atlas,key:''};
}
export function updateHandRig(rig:HandRig,s:HandState,selected:string[]=[]){
 const key=JSON.stringify([s,selected]);if(key===rig.key)return;const pose=handPose(rig.atlas,s),active=new Set(handMuscleParts(rig.atlas,s).map(p=>p.id)),selection=new Set(selected),point=new T.Vector3(),normal=new T.Vector3(),transformed=new T.Vector3(),result=new T.Vector3(),nresult=new T.Vector3();
 for(const entry of rig.meshes){const {mesh,part}=entry,material=mesh.material as T.MeshStandardMaterial;material.color.set(part.system==='skeletal'?0xe5d6b1:selection.has(part.id)?0x288eb0:part.system==='muscular'?(active.has(part.id)?0x237d78:0xb9867a):0xd7e4df);
  if(!entry.rest){mesh.matrix.copy(pose.matrices.get(part.id)!);mesh.updateMatrixWorld(true);continue;}
  const position=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal');
  for(let i=0;i<position.count;i++){point.fromArray(entry.rest,i*3);normal.fromArray(entry.normals!,i*3);const skin=entry.skin![i];result.copy(point).multiplyScalar(1-skin.blend);nresult.copy(normal).multiplyScalar(1-skin.blend);
   skin.bones.forEach((id,k)=>{const matrix=pose.matrices.get(id)!;result.addScaledVector(transformed.copy(point).applyMatrix4(matrix),skin.weights[k]*skin.blend);nresult.addScaledVector(transformed.copy(normal).transformDirection(matrix),skin.weights[k]*skin.blend);});nresult.normalize();position.setXYZ(i,result.x,result.y,result.z);normals.setXYZ(i,nresult.x,nresult.y,nresult.z);}
  position.needsUpdate=true;normals.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
 rig.group.updateMatrixWorld(true);rig.key=key;
}
export function disposeHandRig(rig:HandRig){rig.group.removeFromParent();for(const {mesh} of rig.meshes){mesh.geometry.dispose();(mesh.material as T.Material).dispose();}rig.meshes=[];}
