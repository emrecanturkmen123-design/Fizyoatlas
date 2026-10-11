import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {CUFF,cuffParts} from '../app/shoulder-study.ts';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';
import {SHOULDER_MOVES} from '../app/shoulder.ts';
import {poseMatrices} from '../app/shoulder-motion.ts';
import {attachmentTargets} from '../app/attachments.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometries=new Map(),chunks=new Map();
for(const p of atlas.parts.filter(p=>['muscular','connective','skeletal'].includes(p.system))){
 if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
 const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometries.set(p.id,g);
}
let poses=0;const exports=[];
for(const side of ['right','left']){
 for(const c of CUFF){const parts=cuffParts(atlas,side,c.key);assert.equal(parts.filter(p=>p.system==='muscular').length,1);assert.equal(parts.filter(p=>p.system==='connective').length,1);const targets=attachmentTargets(atlas,{key:c.key,side,mode:'both'});assert.equal(targets.length,2);assert(targets.every(t=>atlas.parts.find(p=>p.id===t.boneId).name.toLowerCase().startsWith(side)));}
 for(const move of SHOULDER_MOVES){const s={id:move.id,side,motion:true,anatomicalMuscles:true,plane:false,progress:0,antagonists:false},rig=createShoulderRig(atlas,geometries,s);
 assert.equal(rig.tendons.length,4);for(const c of CUFF)assert(rig.surfaces.some(h=>h.part.name.toLowerCase().includes(c.key)));
 for(const scapula of [false,true])for(const progress of [0,25,50,75,100]){const state={...s,scapula,progress};updateShoulderRig(rig,state);poses++;const pose=poseMatrices(atlas,state);
  for(const t of rig.tendons){const pos=t.mesh.geometry.getAttribute('position');assert(pos.array.every(Number.isFinite));assert(t.mesh.geometry.getAttribute('normal').array.every(Number.isFinite));assert(t.mesh.geometry.boundingSphere.radius<.3);assert(t.mesh.userData.partId);assert.deepEqual(geometries.get(t.mesh.userData.partId).getAttribute('position').array,t.rest);
   for(let i=0;i<pos.count;i++){const want=new T.Vector3().fromArray(t.rest,i*3);if(t.muscle){const j=t.nearest[i],mp=t.muscle.mesh.geometry.getAttribute('position');want.add(new T.Vector3().fromBufferAttribute(mp,j).sub(new T.Vector3().fromArray(t.muscle.rest,j*3)));if(t.distalWeights)want.lerp(new T.Vector3().fromArray(t.rest,i*3).applyMatrix4(pose.upper),t.distalWeights[i]);}else want.applyMatrix4(pose.upper);assert(want.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<2e-7,'tendon retains its bone or muscle relation');}
  }
  if(side==='right'&&!scapula&&['abduction','external'].includes(move.id)&&[0,50,100].includes(progress)){
   const objects=[];const add=(name,g,color)=>objects.push({name,color,p:Array.from(g.attributes.position.array),i:Array.from(g.index.array)});
   for(const h of rig.surfaces)add(h.part.name,h.mesh.geometry,[.68,.24,.22]);for(const t of rig.tendons)add(t.mesh.name,t.mesh.geometry,[.95,.88,.7]);
   for(const p of atlas.parts.filter(p=>p.system==='skeletal'&&/^right (scapula|humerus|clavicle)$/i.test(p.name))){const g=geometries.get(p.id).clone();if(/humerus/i.test(p.name))g.applyMatrix4(pose.upper);else if(/scapula/i.test(p.name))g.applyMatrix4(pose.scapula);add(p.name,g,[.75,.76,.72]);g.dispose();}exports.push({name:move.id+'-'+progress,objects});
  }
 }
 disposeShoulderRig(rig);assert.equal(rig.group.children.length,0);assert.equal(rig.tendons.length,0);
 }
 const hidden=createShoulderRig(atlas,geometries,{id:'abduction',side,plane:false,cuff:false,tendons:false});assert.equal(hidden.tendons.length,0);disposeShoulderRig(hidden);
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(exports));
console.log(`PASS: ${poses} poses; 4 cuff muscles and 4 authentic source regions on both sides; humeral insertion patches, muscle-following source bodies, finite geometry, source preservation, disposal and visibility switches.`);
