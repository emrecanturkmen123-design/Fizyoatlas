import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
const {createShoulderRig,updateShoulderRig,disposeShoulderRig}=await import(process.argv[2]??'../app/shoulder-muscles.ts');import {SHOULDER_MOVES} from '../app/shoulder.ts';import {poseMatrices,jointAnchors} from '../app/shoulder-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),map=new Map(),chunks=new Map();for(const p of atlas.parts.filter(p=>['muscular','skeletal'].includes(p.system))){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));map.set(p.id,g);}
let checked=0,cuffChecked=0,poses=0;
for(const side of ['left','right'])for(const move of SHOULDER_MOVES){const initial={side,id:move.id,plane:false,anatomicalMuscles:true,motion:true,antagonists:true,cuff:true,tendons:false,progress:0},rig=createShoulderRig(atlas,map,initial);
for(const scapula of [false,true])for(const progress of [0,25,50,75,100]){const s={...initial,progress,scapula};updateShoulderRig(rig,s);const pose=poseMatrices(atlas,s);poses++;
for(const h of rig.surfaces.filter(h=>/deltoid|coracobrachialis/i.test(h.part.name))){const pos=h.mesh.geometry.attributes.position;
// This is an anatomical region invariant, independent of the implementation's
// weights: tissue well below the proximal cap must keep its shape on humerus.
for(let i=0;i<pos.count;i++)if(h.rest[3*i+1]<jointAnchors(atlas,side).shoulder.y-.09){const expected=new T.Vector3().fromArray(h.rest,3*i).applyMatrix4(pose.upper);assert(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<2e-7,'shoulder belly folds away from humerus');checked++;}
}
for(const h of rig.surfaces.filter(h=>/subscapularis|infraspinatus/i.test(h.part.name))){
 const pos=h.mesh.geometry.attributes.position,xs=Array.from({length:pos.count},(_,i)=>Math.abs(h.rest[3*i])),medial=Math.min(...xs),lateral=Math.max(...xs);
 for(let i=0;i<pos.count;i++)if(xs[i]<medial+(lateral-medial)*.25){const expected=new T.Vector3().fromArray(h.rest,3*i).applyMatrix4(pose.scapula);assert(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<2e-7,'medial cuff belly sinks into scapula');cuffChecked++;}
}
}disposeShoulderRig(rig);}
assert(checked>5000);assert(cuffChecked>1000);console.log('PASS',cuffChecked,'fixed scapular belly vertices;',poses,'shoulder poses;',checked,'belly vertices remain rigid on humerus, including abducted isolated deltoid.');
