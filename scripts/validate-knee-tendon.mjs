import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {createKneeTendonRig,updateKneeTendonRig,patellaMatrix,disposeKneeTendonRig} from '../app/knee-tendon.ts';
import {kneeMatrices} from '../app/knee-motion.ts';
const a=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometries=new Map();
for(const p of a.parts.filter(p=>/patellar ligament/i.test(p.name))){const b=fs.readFileSync('public'+a.chunks[p.chunk].url),buffer=b.buffer.slice(b.byteOffset,b.byteOffset+b.length),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));geometries.set(p.id,g);}
let poses=0,endpoints=0;
for(const side of ['left','right'])for(const id of ['flexion','extension']){
 const state={side,id,progress:0,motion:true,tendons:true,playing:false,antagonists:false},rig=createKneeTendonRig(a,geometries,state);assert(rig);
 const endCenter=(weight,array)=>{const center=new T.Vector3();let count=0;for(let i=0;i<rig.weights.length;i++)if(rig.weights[i]===weight){center.add(new T.Vector3().fromArray(array,i*3));count++;}return center.divideScalar(count);};
 const referenceSpan=endCenter(0,rig.rest).distanceTo(endCenter(1,rig.rest));
 for(let progress=0;progress<=100;progress+=2){const s={...state,progress};updateKneeTendonRig(rig,s);poses++;
  const pos=rig.mesh.geometry.attributes.position;assert(pos.array.every(Number.isFinite));assert(rig.mesh.geometry.attributes.normal.array.every(Number.isFinite));
  const span=endCenter(0,pos.array).distanceTo(endCenter(1,pos.array));assert(span/referenceSpan>.8&&span/referenceSpan<1.2,'schematic tendon must not over-stretch at deep flexion');
  const distal=kneeMatrices(a,s).upper,proximal=patellaMatrix(a,s);
  for(let i=0;i<pos.count;i++)if(rig.weights[i]===0||rig.weights[i]===1){const matrix=rig.weights[i]===0?distal:proximal,expected=new T.Vector3().fromArray(rig.rest,i*3).applyMatrix4(matrix);assert(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<1e-7);endpoints++;}
  if(progress===0&&id==='flexion')for(let i=0;i<pos.array.length;i++)assert(Math.abs(pos.array[i]-rig.rest[i])<1e-7,'rest surface stays unchanged');
  assert.deepEqual(geometries.get(rig.mesh.userData.partId).attributes.position.array,rig.rest);
 }
 disposeKneeTendonRig(rig);
}
console.log(`PASS: ${poses} bilateral flexion/extension poses, ${endpoints} attachment-vertex checks; finite normals and preserved source geometry. Teaching path is not clinical kinematic validation.`);
