import fs from 'node:fs';
import * as T from 'three';
import {handBone,handSoftParts,HAND_MOVES} from '../app/hand-motion.ts';
import {createHandRig,updateHandRig,disposeHandRig} from '../app/hand-rig.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),buffers=new Map(),geometries=new Map();
const side=process.argv[3]??'right',base={side,digit:'all',progress:0,playing:false,motion:true,anatomicalMuscles:true,tendons:true,id:'finger-flexion'},ids=new Set([...atlas.parts.filter(p=>handBone(p,side)),...handSoftParts(atlas,base)].map(p=>p.id));
for(const p of atlas.parts.filter(p=>ids.has(p.id))){if(!buffers.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);buffers.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=buffers.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setAttribute('normal',new T.BufferAttribute(new Int16Array(b,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometries.set(p.id,g);}
const rig=createHandRig(atlas,geometries,base),out=[];
for(const [id,progress] of [['finger-flexion',0],['finger-flexion',50],['finger-flexion',100],['wrist-flexion',100],['thumb-abduction',100],['thumb-opposition',100]]){
 updateHandRig(rig,{...base,id,progress});const objects=rig.meshes.map(h=>{const g=h.mesh.geometry.clone().applyMatrix4(h.mesh.matrixWorld),entry={name:h.part.name,system:h.part.system,color:h.mesh.material.color.toArray(),p:Array.from(g.attributes.position.array),i:Array.from(g.index.array)};g.dispose();return entry;});
 out.push({name:HAND_MOVES.find(m=>m.id===id).name+' · %'+progress,side,objects});
}
fs.writeFileSync(process.argv[2]??'/tmp/hand-review.json',JSON.stringify(out));disposeHandRig(rig);geometries.forEach(g=>g.dispose());
