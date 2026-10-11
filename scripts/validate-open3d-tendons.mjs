import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as T from 'three';
import {tendonParts} from '../app/tendon-model.ts';
import {clinicalStructure} from '../app/clinical-structures.ts';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';
import {poseMatrices,angleFor} from '../app/shoulder-motion.ts';
import {requiredChunks} from '../app/model-demand.ts';
import {createLimbRig,updateLimbRig,disposeLimbRig} from '../app/limb-muscles.ts';
import {patellaMatrix} from '../app/knee-tendon.ts';
import {SHOULDER_MOVES} from '../app/shoulder.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),source=JSON.parse(fs.readFileSync('public/models/open3d-tendon-source.json'));
const baseline='8027add0170f5233c3a3396673a09e6a4c6c8419',before=JSON.parse(execFileSync('git',['show',baseline+':public/models/atlas.json'],{maxBuffer:20e6})),buffers=new Map(),historical=new Map(),geometries=new Map();
function arrays(a,p,old=false){const url='public'+a.chunks[p.chunk].url,cache=old?historical:buffers;if(!cache.has(url))cache.set(url,old?execFileSync('git',['show',baseline+':'+url],{maxBuffer:40e6}):fs.readFileSync(url));const b=cache.get(url);return [b.subarray(p.positions,p.positions+p.vertexCount*12),b.subarray(p.normals,p.normals+p.vertexCount*6),b.subarray(p.indices,p.indices+p.indexCount*4)];}
assert.equal(atlas.parts.length,before.parts.length+10+JSON.parse(fs.readFileSync('public/models/distal-tendon-source.json')).parts.length+JSON.parse(fs.readFileSync('public/models/knee-course-source.json')).parts.length+JSON.parse(fs.readFileSync('public/models/pectoral-nerves-source.json')).parts.length);assert.equal(source.parts.length,10);assert.equal(new Set(atlas.parts.map(p=>p.id)).size,atlas.parts.length);assert.equal(atlas.triangles,atlas.parts.reduce((n,p)=>n+p.indexCount/3,0));
for(const p of before.parts){const now=atlas.parts.find(x=>x.id===p.id);assert(now);for(const k of ['name','system','conceptId','vertexCount','indexCount','bounds'])assert.deepEqual(now[k],p[k]);const a=arrays(before,p,true),b=arrays(atlas,now);a.forEach((v,i)=>assert(v.equals(b[i]),p.id+' source unchanged'));}
for(const record of source.parts){const p=atlas.parts.find(p=>p.id===record.id);assert.equal(p.clinicalKey,record.key);assert.equal(p.modelRole,'body');assert.equal(p.vertexCount,record.vertices);assert.equal(p.indexCount,record.triangles*3);arrays(atlas,p).forEach((v,i)=>assert.equal(createHash('sha256').update(v).digest('hex'),record[['positionsSHA256','normalsSHA256','indicesSHA256'][i]]));assert.equal(tendonParts(atlas,record.key,record.side)[0].id,p.id);assert.equal(clinicalStructure(p.name).key,record.key);if(record.key==='common extensor tendon')assert.equal(record.components.length,4);}
for(const p of atlas.parts.filter(p=>['skeletal','muscular','connective'].includes(p.system))){const a=arrays(atlas,p),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(a[0].buffer.slice(a[0].byteOffset,a[0].byteOffset+a[0].length)),3));g.setIndex(new T.BufferAttribute(new Uint32Array(a[2].buffer.slice(a[2].byteOffset,a[2].byteOffset+a[2].length)),1));geometries.set(p.id,g);}
let poses=0,anchors=0,proximal=0;
const base={visible:['skeletal','muscular'],selected:[],hidden:[],explode:0,isolate:false,view:'front',rotate:false,reset:0};
for(const side of ['right','left'])for(const move of SHOULDER_MOVES){const s={side,id:move.id,progress:0,motion:true,playing:false,anatomicalMuscles:true,antagonists:true,cuff:true,tendons:true},chunks=new Set(requiredChunks(atlas,{...base,shoulder:s})),loaded=new Map([...geometries].filter(([id])=>chunks.has(atlas.parts.find(p=>p.id===id).chunk))),rig=createShoulderRig(atlas,loaded,s);assert.equal(rig.tendons.filter(t=>t.distalWeights).length,3);
 for(const t of rig.tendons.filter(t=>t.distalWeights)){assert(t.distalWeights.some(w=>w===1),'has rigid humeral insertion vertices');assert(t.distalWeights.some(w=>w===0),t.mesh.name+' has muscle-following tissue boundary; min='+Math.min(...t.distalWeights));}
 for(const scapula of [false,true])for(const progress of [0,10,25,50,75,90,100,0]){const state={...s,scapula,progress};updateShoulderRig(rig,state);poses++;const pose=poseMatrices(atlas,state);
  for(const t of rig.tendons.filter(t=>t.distalWeights)){const p=t.mesh.geometry.attributes.position;assert(p.array.every(Number.isFinite));assert(t.mesh.geometry.attributes.normal.array.every(Number.isFinite));assert.deepEqual(geometries.get(t.mesh.userData.partId).attributes.position.array,t.rest);
   for(let i=0;i<p.count;i++){if(t.distalWeights[i]===1){const want=new T.Vector3().fromArray(t.rest,i*3).applyMatrix4(pose.upper);assert(want.distanceTo(new T.Vector3().fromBufferAttribute(p,i))<2e-7);anchors++;}if(t.distalWeights[i]===0){const j=t.nearest[i],want=new T.Vector3().fromArray(t.rest,i*3).add(new T.Vector3().fromBufferAttribute(t.muscle.mesh.geometry.attributes.position,j).sub(new T.Vector3().fromArray(t.muscle.rest,j*3)));assert(want.distanceTo(new T.Vector3().fromBufferAttribute(p,i))<2e-7);proximal++;}if(angleFor(state)===0)assert(new T.Vector3().fromBufferAttribute(p,i).distanceTo(new T.Vector3().fromArray(t.rest,i*3))<2e-7);}
  }
 }
 disposeShoulderRig(rig);
}
let kneePoses=0,kneeAnchors=0;
for(const side of ['right','left'])for(const id of ['flexion','extension']){
 const knee={side,id,progress:0,motion:true,playing:false,anatomicalMuscles:true,tendons:true,antagonists:true},state={...base,knee},chunks=new Set(requiredChunks(atlas,state)),loaded=new Map([...geometries].filter(([key])=>chunks.has(atlas.parts.find(p=>p.id===key).chunk))),rig=createLimbRig(atlas,loaded,state),body=rig.surfaces.find(h=>h.part.clinicalKey==='quadriceps tendon');assert(body);assert.equal(body.part.modelRole,'body');assert.equal(rig.surfaces.filter(h=>/rectus femoris|vastus/.test(h.part.name.toLowerCase())&&h.part.system==='muscular').length,4);
 for(const progress of [...Array.from({length:21},(_,i)=>i*5),0]){const s={...state,knee:{...knee,progress}};updateLimbRig(rig,s);kneePoses++;const p=body.mesh.geometry.attributes.position;assert(p.array.every(Number.isFinite));assert(body.mesh.geometry.attributes.normal.array.every(Number.isFinite));assert.deepEqual(geometries.get(body.part.id).attributes.position.array,body.rest);
  for(let i=0;i<p.count;i++)if(body.calfFollowers[i].blend===0){const want=new T.Vector3().fromArray(body.rest,i*3).applyMatrix4(patellaMatrix(atlas,s.knee));assert(want.distanceTo(new T.Vector3().fromBufferAttribute(p,i))<2e-7);kneeAnchors++;}
 }
 disposeLimbRig(rig);
}
console.log(`PASS: ${kneePoses} bilateral quadriceps motion poses; four muscle heads; ${kneeAnchors} patellar attachment checks.`);
console.log(`PASS: all ${before.parts.length} previous meshes unchanged byte for byte; 10 new source hashes, 4 distinct extensor contributors, preferred body selection, ${poses} bilateral shoulder poses, ${anchors} humeral and ${proximal} muscle anchor checks, neutral restoration and demanded buffers.`);
