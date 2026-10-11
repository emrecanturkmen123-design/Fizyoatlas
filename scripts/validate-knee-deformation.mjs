import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {createLimbRig,updateLimbRig,disposeLimbRig,boneMatrix} from '../app/limb-muscles.ts';import {kneeAnchor} from '../app/knee-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),map=new Map(),chunks=new Map();
assert(atlas.parts.filter(p=>/iliotibial tract/i.test(p.name)).every(p=>p.system==='connective'),'fascia must not render as an immobile bone during motion');
for(const p of atlas.parts.filter(p=>p.system==='muscular')){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));map.set(p.id,g);}
let poses=0,protectedVertices=0;
for(const side of ['left','right'])for(const id of ['flexion','extension']){
 const state={visible:['skeletal','muscular'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'side',knee:{id,side,progress:0,motion:true,anatomicalMuscles:true,playing:false,antagonists:true}},rig=createLimbRig(atlas,map,state),ky=kneeAnchor(atlas,side).y;
 for(const progress of [0,15,30,45,60,75,90,100]){const s={...state,knee:{...state.knee,progress}};updateLimbRig(rig,s);poses++;
  for(const h of rig.surfaces){const pos=h.mesh.geometry.attributes.position,calf=/gastrocnemius/i.test(h.part.name);assert(pos.array.every(Number.isFinite));assert(h.mesh.geometry.attributes.normal.array.every(Number.isFinite));
   for(let i=0;i<pos.count;i++){const y=h.rest[i*3+1];if(calf?y<ky-.12:y>ky+.14){const expected=new T.Vector3().fromArray(h.rest,i*3).applyMatrix4(boneMatrix(rig,calf?h.insertionBone:h.originBone,s));assert(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<2e-7,'muscle belly stays rigid with its segment');protectedVertices++;}}
   assert.deepEqual(map.get(h.part.id).attributes.position.array,h.rest);
  }
 }
 disposeLimbRig(rig);
}
console.log(`PASS ${poses} knee poses and ${protectedVertices} protected-belly checks; preserved source and connective tissue classification.`);
