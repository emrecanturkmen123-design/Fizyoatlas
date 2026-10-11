import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {createLimbRig,updateLimbRig,disposeLimbRig} from '../app/limb-muscles.ts';
import {elbowMatrices} from '../app/elbow-motion.ts';
import {requiredChunks} from '../app/model-demand.ts';

const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const buffers=new Map(),geometry=new Map();
for(const part of atlas.parts.filter(p=>['skeletal','muscular','connective'].includes(p.system))){
 if(!buffers.has(part.chunk)){const b=fs.readFileSync('public'+atlas.chunks[part.chunk].url);buffers.set(part.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
 const b=buffers.get(part.chunk),g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,part.positions,part.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,part.indices,part.indexCount),1));geometry.set(part.id,g);
}
const base={visible:['skeletal'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'front'};
let poses=0,attachments=0;
for(const side of ['right','left'])for(const id of ['pronation','supination']){
 const elbow={side,id,progress:0,motion:true,anatomicalMuscles:true,tendons:true,playing:false},state={...base,elbow};
 const needed=new Set(requiredChunks(atlas,state)),loaded=new Map([...geometry].filter(([id])=>needed.has(atlas.parts.find(p=>p.id===id).chunk)));
 const rig=createLimbRig(atlas,loaded,state),tendon=rig.surfaces.find(s=>s.part.name.toLowerCase()===side+' biceps distal tendon');assert(tendon,'source tendon must exist in the demand-loaded forearm rig');
 const reference=new Float32Array(geometry.get(tendon.part.id).attributes.position.array);
 assert(!rig.surfaces.some(s=>s.part.name.toLowerCase().includes('biceps long head tendon')));
 for(let progress=0;progress<=100;progress+=2){
  const s={...state,elbow:{...elbow,progress}};updateLimbRig(rig,s);const position=tendon.mesh.geometry.attributes.position,normal=tendon.mesh.geometry.attributes.normal;
  assert(position.array.every(Number.isFinite));assert(normal.array.every(Number.isFinite));poses++;
  const radial=elbowMatrices(atlas,s.elbow).lower;
  for(let i=0;i<position.count;i++)if(tendon.weights[i]===1){
   const expected=new T.Vector3().fromArray(tendon.rest,i*3).applyMatrix4(radial);
   const error=expected.distanceTo(new T.Vector3().fromBufferAttribute(position,i));assert(error<1e-7,`distal attachment must rotate exactly with radius: ${side}/${id}/${progress}/${i}, error ${error}`);attachments++;
  }else if(tendon.weights[i]===0){
   assert(new T.Vector3().fromArray(tendon.posedForearm,i*3).distanceTo(new T.Vector3().fromBufferAttribute(position,i))<1e-7,'proximal posed end remains with biceps');
  }
  assert.deepEqual(geometry.get(tendon.part.id).attributes.position.array,reference);
 }
 disposeLimbRig(rig);
 const off=createLimbRig(atlas,loaded,{...state,elbow:{...elbow,tendons:false}});assert(!off.surfaces.some(s=>s.part.system==='connective'));disposeLimbRig(off);
}
assert(attachments>100);
console.log(`PASS: ${poses} bilateral pronation/supination poses, ${attachments} exact radial attachment checks, posed muscle transition, finite normals, toggle-off and unchanged source arrays.`);
