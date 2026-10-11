import fs from 'node:fs';
import * as T from 'three';
import {createKneeTendonRig,updateKneeTendonRig,patellaMatrix,disposeKneeTendonRig} from '../app/knee-tendon.ts';
import {kneeMatrices,kneeAngle} from '../app/knee-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const geometries=new Map(),buffers=new Map(),scenes=[];
for(const p of atlas.parts.filter(p=>/^(left|right) (femur|tibia|patella|patellar ligament)$/i.test(p.name))){
 if(!buffers.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);buffers.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}
 const b=buffers.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometries.set(p.id,g);
}
for(const side of ['right','left']){
 const state={id:'flexion',side,progress:0,motion:true,tendons:true,antagonists:false,playing:false},rig=createKneeTendonRig(atlas,geometries,state);
 for(const progress of [0,50,100]){
  const s={...state,progress};updateKneeTendonRig(rig,s);const pose=kneeMatrices(atlas,s),objects=[];
  const add=(name,g,color)=>objects.push({name,color,p:Array.from(g.attributes.position.array),i:Array.from(g.index.array)});
  for(const p of atlas.parts.filter(p=>p.name.toLowerCase().startsWith(side+' ')&&/^(left|right) (femur|tibia|patella)$/i.test(p.name))){const matrix=p.name.endsWith('tibia')?pose.upper:p.name.endsWith('patella')?patellaMatrix(atlas,s):new T.Matrix4(),g=geometries.get(p.id).clone().applyMatrix4(matrix);add(p.name,g,[.86,.83,.72]);g.dispose();}
  add(rig.mesh.name,rig.mesh.geometry,[.05,.53,.57]);scenes.push({side,angle:kneeAngle(s),center:pose.knee.toArray(),objects});
 }
 disposeKneeTendonRig(rig);
}
fs.writeFileSync(process.argv[2]??'/tmp/knee-tendon-review.json',JSON.stringify(scenes));
