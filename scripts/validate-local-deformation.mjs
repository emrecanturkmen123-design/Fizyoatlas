import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {createLimbRig,updateLimbRig,disposeLimbRig,boneMatrix} from '../app/limb-muscles.ts';import {lowerAnchor,LOWER_MOVES} from '../app/lower-motion.ts';import {elbowMatrices} from '../app/elbow-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),map=new Map(),chunks=new Map();for(const p of atlas.parts.filter(p=>p.system==='muscular')){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));map.set(p.id,g);}
const base={visible:['skeletal'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'side'};let protectedVertices=0,forearmVertices=0;
for(const side of ['right','left'])for(const m of [...LOWER_MOVES,...['pronation','supination'].map(id=>({joint:'forearm',id}))]){
 const key=m.joint==='forearm'?'elbow':'lower',value={joint:m.joint,id:m.id,side,motion:true,anatomicalMuscles:true,antagonists:true,achilles:true,progress:0,playing:false,plane:false},state={...base,[key]:value},rig=createLimbRig(atlas,map,state);
 for(const progress of [0,25,50,75,100]){value.progress=progress;updateLimbRig(rig,state);
 for(const h of rig.surfaces){const pos=h.mesh.geometry.attributes.position;
 for(let i=0;i<pos.count;i++){
 const rest=new T.Vector3().fromArray(h.rest,i*3);
 if(h.forearmTip){
  const pose=elbowMatrices(atlas,value),twist=pose.lower.clone().multiply(pose.upper.clone().invert()),limit=h.forearmTip.clone().applyMatrix4(twist).distanceTo(h.forearmTip);
  assert(new T.Vector3().fromBufferAttribute(pos,i).distanceTo(new T.Vector3().fromArray(h.posedForearm,i*3))<=limit+2e-7,'biceps surface cannot swing farther than its radial attachment');
 }else if(m.joint==='forearm'&&!/biceps/i.test(h.part.name)){
  assert(h.posedForearm,'forearm needs a bent-elbow reference');
  if(h.weights[i]>=.3){const bent=rest.clone().applyMatrix4(elbowMatrices(atlas,value).upper);assert(bent.distanceTo(new T.Vector3().fromArray(h.posedForearm,i*3))<2e-7,'distal forearm follows elbow bend before axial rotation');forearmVertices++;}
 }else if(m.joint!=='forearm'){
  const anchor=lowerAnchor(atlas,value);
  const protectedHip=m.joint==='hip'&&/rectus femoris|semitendinosus|semimembranosus/i.test(h.part.name)&&rest.y<anchor.y-.24;
  const protectedCalf=m.joint==='ankle'&&rest.y>anchor.y+.30;
  if(protectedHip||protectedCalf){const want=rest.applyMatrix4(boneMatrix(rig,protectedHip?h.insertionBone:h.originBone,state));assert(want.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<2e-7,'muscle belly keeps its limb segment instead of bowing away');protectedVertices++;}
 }
 }
 }
 }disposeLimbRig(rig);
}
assert(protectedVertices>10000);assert(forearmVertices>1000);console.log('PASS local deformation:',protectedVertices,'protected hip/calf vertices;',forearmVertices,'bent forearm vertices.');
