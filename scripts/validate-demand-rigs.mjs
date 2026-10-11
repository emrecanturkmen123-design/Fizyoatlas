import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {requiredChunks} from '../app/model-demand.ts';
import {createLimbRig,disposeLimbRig} from '../app/limb-muscles.ts';
import {createShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';
import {createMuscleRig,disposeMuscleRig} from '../app/anatomical-muscles.ts';
import {createKneeTendonRig,disposeKneeTendonRig} from '../app/knee-tendon.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),all=new Map(),buffers=new Map();
for(const p of atlas.parts){if(!buffers.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);buffers.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=buffers.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));all.set(p.id,g);}
const base={visible:['skeletal','muscular'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'side'};
const moving={progress:0,playing:false,motion:true,anatomicalMuscles:true,antagonists:true,tendons:true,achilles:true,cuff:true};let checks=0;
for(const side of ['left','right']){
 const cases=[
  {state:{...base,knee:{...moving,side,id:'extension'}},create:(map,s)=>createLimbRig(atlas,map,s),dispose:disposeLimbRig,ids:r=>r.surfaces.map(h=>h.part.id)},
  {state:{...base,lower:{...moving,side,id:'dorsiflexion',joint:'ankle'}},create:(map,s)=>createLimbRig(atlas,map,s),dispose:disposeLimbRig,ids:r=>r.surfaces.map(h=>h.part.id)},
  {state:{...base,lower:{...moving,side,id:'flexion',joint:'hip'}},create:(map,s)=>createLimbRig(atlas,map,s),dispose:disposeLimbRig,ids:r=>r.surfaces.map(h=>h.part.id)},
  {state:{...base,elbow:{...moving,side,id:'pronation'}},create:(map,s)=>createLimbRig(atlas,map,s),dispose:disposeLimbRig,ids:r=>r.surfaces.map(h=>h.part.id)},
  {state:{...base,elbow:{...moving,side,id:'flexion'}},create:map=>createMuscleRig(atlas,map,side),dispose:disposeMuscleRig,ids:r=>r.heads.map(h=>h.part.id)},
  ...['abduction','external','internal'].map(id=>({state:{...base,shoulder:{...moving,side,id}},create:(map,s)=>createShoulderRig(atlas,map,s.shoulder),dispose:disposeShoulderRig,ids:r=>r.group.children.filter(h=>h.userData.partId).map(h=>h.userData.partId)})),
  {state:{...base,knee:{...moving,side,id:'flexion'}},create:(map,s)=>createKneeTendonRig(atlas,map,s.knee),dispose:disposeKneeTendonRig,ids:r=>[r.mesh.userData.partId]}
 ];
 for(const c of cases){const chunks=new Set(requiredChunks(atlas,c.state)),available=new Map(atlas.parts.filter(p=>chunks.has(p.chunk)).map(p=>[p.id,all.get(p.id)])),expected=c.create(all,c.state),loaded=c.create(available,c.state);assert(expected&&loaded);assert.deepEqual(c.ids(loaded).sort(),c.ids(expected).sort(),'demand loading must supply all production rig surfaces');checks++;c.dispose(expected);c.dispose(loaded);}
}
console.log(`PASS: ${checks} bilateral production rigs have identical surface coverage with demanded buffers and full atlas buffers.`);
