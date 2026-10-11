import * as T from 'three';
import type {Atlas} from './anatomy';
import {kneeAnchor,kneeAngle,kneeMatrices,type KneeState} from './knee-motion';
import {around} from './shoulder-motion';
// An explicit sagittal teaching approximation, not measured patellofemoral tracking.
// Keep source attachment vertices on the same transformed patella/tibia surfaces.
export function patellaMatrix(atlas:Atlas,s:KneeState){
 const knee=kneeAnchor(atlas,s.side);
 const matrix=around(knee,new T.Vector3(1,0,0),T.MathUtils.degToRad(kneeAngle(s)*.65));
 const part=atlas.parts.find(p=>p.name.toLowerCase()===s.side+' patellar ligament');
 if(!part)return matrix;
 // Geometric teaching constraint: preserve the reference end-to-end span.
 // A fixed rotation ratio alone makes the tendon stretch/bow at deep flexion.
 // Bounds provide a shared reference for bones, tendon and quadriceps; this is
 // not a contact solver or a patient-specific patellofemoral tracking model.
 const [lo,hi]=part.bounds,x=(lo[0]+hi[0])/2,z=(lo[2]+hi[2])/2;
 const distal=new T.Vector3(x,lo[1],z),proximal=new T.Vector3(x,hi[1],z);
 const length=proximal.distanceTo(distal),d=distal.applyMatrix4(kneeMatrices(atlas,s).upper),p=proximal.applyMatrix4(matrix);
 const correction=d.clone().add(p.clone().sub(d).normalize().multiplyScalar(length)).sub(p);
 const translation=new T.Vector3().setFromMatrixPosition(matrix).add(correction);
 return matrix.setPosition(translation);
}
export function createKneeTendonRig(atlas:Atlas,geometries:Map<string,T.BufferGeometry>,s:KneeState){
 const part=atlas.parts.find(p=>p.name.toLowerCase()===s.side+' patellar ligament'),source=part&&geometries.get(part.id);
 if(!part||!source)return;
 const geometry=source.clone(),rest=new Float32Array(source.attributes.position.array),weights=new Float32Array(rest.length/3);
 geometry.deleteAttribute('partIndex');geometry.setAttribute('normal',new T.BufferAttribute(new Float32Array(rest.length),3));
 const lo=part.bounds[0][1],hi=part.bounds[1][1];
 for(let i=0;i<weights.length;i++)weights[i]=T.MathUtils.smoothstep((rest[i*3+1]-lo)/(hi-lo),.12,.84);
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xf1ddae,roughness:.75,side:T.DoubleSide}));mesh.userData.partId=part.id;mesh.name=part.name;
 return {mesh,rest,weights,atlas,key:''};
}
export type KneeTendonRig=NonNullable<ReturnType<typeof createKneeTendonRig>>;
export function updateKneeTendonRig(rig:KneeTendonRig,s:KneeState){
 const key=JSON.stringify([s.id,s.progress]);if(key===rig.key)return;
 const distal=kneeMatrices(rig.atlas,s).upper,proximal=patellaMatrix(rig.atlas,s),v=new T.Vector3(),p=new T.Vector3(),pos=rig.mesh.geometry.attributes.position as T.BufferAttribute;
 // Blend endpoint displacements, rather than rotations about the remote hinge.
 // This keeps the short tendon between its bone attachments instead of taking
 // an arc around the knee. Endpoint patches still follow their bone exactly.
 for(let i=0;i<pos.count;i++){v.fromArray(rig.rest,i*3).applyMatrix4(distal);p.fromArray(rig.rest,i*3).applyMatrix4(proximal);v.lerp(p,rig.weights[i]);pos.setXYZ(i,v.x,v.y,v.z);}
 pos.needsUpdate=true;rig.mesh.geometry.computeVertexNormals();rig.mesh.geometry.computeBoundingBox();rig.mesh.geometry.computeBoundingSphere();rig.key=key;
}
export function disposeKneeTendonRig(rig:KneeTendonRig){rig.mesh.removeFromParent();rig.mesh.geometry.dispose();rig.mesh.material.dispose();}
