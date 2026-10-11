import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import * as T from 'three';
import {SHOULDER_MOVES} from '../app/shoulder.ts';import {poseMatrices,motionSegment} from '../app/shoulder-motion.ts';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';
import {ELBOW_MOVES,elbowMatrices,elbowSegment} from '../app/elbow-motion.ts';import {createMuscleRig,updateMuscleRig,disposeMuscleRig} from '../app/anatomical-muscles.ts';
import {LOWER_MOVES,lowerMatrices,lowerSegment} from '../app/lower-motion.ts';import {KNEE_MOVES,kneeMatrices,kneeSegment} from '../app/knee-motion.ts';import {createLimbRig,updateLimbRig,disposeLimbRig} from '../app/limb-muscles.ts';
import {createKneeTendonRig,updateKneeTendonRig,disposeKneeTendonRig,patellaMatrix} from '../app/knee-tendon.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometry=new Map(),chunks=new Map();
for(const p of atlas.parts.filter(p=>['skeletal','muscular','connective'].includes(p.system))){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometry.set(p.id,g);}
const dir=process.argv[2]??'/tmp/motion-review';fs.mkdirSync(dir,{recursive:true});let poses=0;
for(const family of (process.argv[3]?[process.argv[3]]:['shoulder','elbow','hip','knee','ankle'])){const scenes=[],moves=family==='shoulder'?SHOULDER_MOVES:family==='elbow'?ELBOW_MOVES:family==='knee'?KNEE_MOVES:LOWER_MOVES.filter(x=>x.joint===family);
for(const move of moves)for(const side of ['right','left']){
const s={id:move.id,joint:family,side,motion:true,anatomicalMuscles:true,antagonists:true,cuff:true,tendons:true,achilles:true,playing:false,plane:false,progress:0};const base={visible:['skeletal'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'front'};
const state=()=>({...base,[['hip','ankle'].includes(family)?'lower':family]:s});
const arm=family==='elbow'&&['flexion','extension'].includes(s.id),shoulder=family==='shoulder';
const rig=shoulder?createShoulderRig(atlas,geometry,s):arm?createMuscleRig(atlas,geometry,side,true):createLimbRig(atlas,geometry,state());
const kneeTendon=family==='knee'?createKneeTendonRig(atlas,geometry,s):undefined;
for(const progress of [0,50,100]){s.progress=progress;if(shoulder)updateShoulderRig(rig,s);else if(arm)updateMuscleRig(rig,s);else updateLimbRig(rig,state());
if(kneeTendon)updateKneeTendonRig(kneeTendon,s);
const objects=[];const add=(name,g,color)=>{assert(g.attributes.position.array.every(Number.isFinite),name);objects.push({name,color,p:Array.from(g.attributes.position.array),i:Array.from(g.index.array)});};
for(const h of rig.heads??rig.surfaces)add(h.part.name,h.mesh.geometry,h.part.system==='connective'?[.96,.88,.7]:[.68,.25,.22]);for(const h of rig.tendons??[])add(h.mesh.name,h.mesh.geometry,[.96,.88,.7]);
if(kneeTendon)add(kneeTendon.mesh.name,kneeTendon.mesh.geometry,[.96,.88,.7]);
const pose=shoulder?poseMatrices(atlas,s):family==='elbow'?elbowMatrices(atlas,s):family==='knee'?kneeMatrices(atlas,s):lowerMatrices(atlas,s);
for(const matrix of [pose.upper,pose.lower])assert(Math.abs(matrix.determinant()-1)<1e-8);
const relevant=shoulder?/humerus|scapula|clavicle|radius|ulna/:family==='elbow'?/humerus|radius|ulna/:family==='hip'?/hip bone|femur|tibia|fibula/:family==='knee'?/femur|tibia|fibula|patella|calcaneus|talus/:/tibia|fibula|calcaneus|talus|metatarsal/;
for(const p of atlas.parts.filter(p=>p.system==='skeletal'&&p.name.toLowerCase().startsWith(side+' ')&&relevant.test(p.name.toLowerCase()))){const seg=shoulder?motionSegment(p,s):family==='elbow'?elbowSegment(p,s):family==='knee'?kneeSegment(p,s):lowerSegment(p,s);const g=geometry.get(p.id).clone().applyMatrix4(seg===1?pose.upper:seg===2?pose.lower:seg===3?pose.scapula:family==='knee'&&p.name.toLowerCase().endsWith('patella')?patellaMatrix(atlas,s):new T.Matrix4());add(p.name,g,[.8,.79,.72]);g.dispose();}
scenes.push({name:family+' '+move.id+' '+side+' '+progress+'%',id:move.id,side,progress,objects});poses++;
}if(kneeTendon)disposeKneeTendonRig(kneeTendon);if(shoulder)disposeShoulderRig(rig);else if(arm)disposeMuscleRig(rig);else disposeLimbRig(rig);
}fs.writeFileSync(dir+'/'+family+'.json.gz',zlib.gzipSync(JSON.stringify(scenes)));console.log(family,scenes.length,'bilateral exported poses');}
console.log('PASS',poses,'poses, finite production surfaces, rigid bone transforms; inspect CPU projections separately.');
