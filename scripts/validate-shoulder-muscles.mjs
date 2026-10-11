import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';
import {SHOULDER_MOVES,shoulderRoles} from '../app/shoulder.ts';import {poseMatrices,angleFor} from '../app/shoulder-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometries=new Map(),chunks=new Map();
for(const p of atlas.parts.filter(p=>p.system==='muscular')){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometries.set(p.id,g);}
for(const side of ['left','right'])for(const move of SHOULDER_MOVES){const s={id:move.id,side,progress:0,motion:true,anatomicalMuscles:true,plane:false,antagonists:true,cuff:false,tendons:false},rig=createShoulderRig(atlas,geometries,s),roles=shoulderRoles(atlas,move,side);
 assert.deepEqual(new Set(rig.surfaces.map(h=>h.part.id)),new Set([...roles.agonists,...roles.antagonists]),move.id+' complete source surfaces');
 for(const scapula of [false,true])for(const progress of [0,25,50,75,100]){const state={...s,scapula,progress};updateShoulderRig(rig,state);const pose=poseMatrices(atlas,state);
  for(const h of rig.surfaces){const g=h.mesh.geometry,pos=g.getAttribute('position');assert(pos.array.every(Number.isFinite));assert(g.getAttribute('normal').array.every(Number.isFinite));assert(g.boundingSphere.radius<.6);assert(h.weights.includes(0),'origin remains attached');assert(h.weights.includes(1),'insertion follows humerus');
   for(const weight of [0,1]){const i=h.weights.indexOf(weight),want=new T.Vector3().fromArray(h.rest,i*3);if(weight===1)want.applyMatrix4(pose.upper);else if(h.scapularOrigin)want.applyMatrix4(pose.scapula);assert(new T.Vector3().fromBufferAttribute(pos,i).distanceTo(want)<2e-7,'attachment follows correct bone');}
   if(angleFor(state)===0)assert.deepEqual(pos.array,h.rest,'exact neutral surface');assert.notEqual(g,geometries.get(h.part.id));assert.deepEqual(geometries.get(h.part.id).getAttribute('position').array,h.rest,'source untouched');
  }
 }
 disposeShoulderRig(rig);assert.equal(rig.group.children.length,0);
}
console.log('PASS: all source muscle surfaces for six movements, both sides, scapular mode, finite normals, fixed origins, bone-bound insertions, exact rest and source preservation.');
