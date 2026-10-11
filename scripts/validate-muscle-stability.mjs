import assert from 'node:assert/strict';import fs from 'node:fs';import * as T from 'three';
import {createShoulderRig,updateShoulderRig,disposeShoulderRig} from '../app/shoulder-muscles.ts';
import {poseMatrices} from '../app/shoulder-motion.ts';
import {rigidBlend,poseGuards,guardDepth} from '../app/muscle-stability.ts';
import {createMuscleRig,updateMuscleRig,disposeMuscleRig} from '../app/anatomical-muscles.ts';
import {around,jointAnchors} from '../app/shoulder-motion.ts';
import {elbowAngle} from '../app/elbow-motion.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometries=new Map(),chunks=new Map();
for(const p of atlas.parts.filter(p=>p.system==='muscular'||/^(left|right) (humerus|radius|ulna)$/i.test(p.name))){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometries.set(p.id,g);}
const rotated=rigidBlend(new T.Matrix4(),new T.Matrix4().makeRotationZ(Math.PI*2/3))(new T.Vector3(1,0,0),.5);assert(Math.abs(rotated.length()-1)<1e-8,'blend must not collapse cross-section');
const stats={before:{depth:0,strain:0},after:{depth:0,strain:0}};
for(const side of ['left','right'])for(const id of ['abduction','flexion','internal','external'])for(const progress of [75,100]){
 const state={id,side,progress,motion:true,anatomicalMuscles:true,plane:false,antagonists:true,scapula:true};
 const rig=createShoulderRig(atlas,geometries,state);assert(rig.guards.length>0);updateShoulderRig(rig,state);const pose=poseMatrices(atlas,state),guards=poseGuards(rig.guards,b=>b==='humerus'?pose.upper:pose.lower);
 for(const s of rig.surfaces){const before=new T.BufferAttribute(new Float32Array(s.rest.length),3),after=s.mesh.geometry.getAttribute('position');for(let i=0;i<before.count;i++){const p=new T.Vector3().fromArray(s.rest,i*3),a=p.clone().applyMatrix4(s.scapularOrigin?pose.scapula:new T.Matrix4()),b=p.clone().applyMatrix4(pose.upper);a.lerp(b,s.weights[i]);before.setXYZ(i,a.x,a.y,a.z);if(s.weights[i]===0||s.weights[i]===1)assert(a.distanceTo(new T.Vector3().fromBufferAttribute(after,i))<2e-7);}
  for(const [label,pos]of [['before',before],['after',after]]){assert(pos.array.every(Number.isFinite));for(let i=0;i<pos.count;i++)if(s.constraints.mobility[i]){const p=new T.Vector3().fromBufferAttribute(pos,i);stats[label].depth+=Math.max(0,...guards.map(g=>guardDepth(p,g)));}for(const [a,b,rest]of s.constraints.edges){const d=new T.Vector3().fromBufferAttribute(pos,a).distanceTo(new T.Vector3().fromBufferAttribute(pos,b));stats[label].strain+=Math.max(0,d/Math.max(rest,.001/1.8)-1.8);}}
 }
 disposeShoulderRig(rig);
}
console.log(JSON.stringify(stats));
assert(stats.after.depth<stats.before.depth*.6,'bone-core penetration must decrease');
assert(stats.after.strain<stats.before.strain,'excessive edge stretch must decrease');
console.log('PASS: high-angle bilateral shoulder anchors, finite surfaces, reduced bone-core overlap and edge stretch.',JSON.stringify(stats));
const elbowStats={before:0,after:0};
for(const side of ['left','right']){
 const rig=createMuscleRig(atlas,geometries,side),originalGuards=rig.guards,originalConstraints=rig.heads.map(h=>h.constraints);
 for(const progress of [75,100]){
  const state={id:'flexion',side,progress,motion:true,anatomicalMuscles:true},angle=elbowAngle(state),joint=jointAnchors(atlas,side).elbow,guards=poseGuards(originalGuards,b=>b==='humerus'?new T.Matrix4():around(joint,new T.Vector3(1,0,0),-T.MathUtils.degToRad(angle)));
  for(const label of ['before','after']){
   rig.angle=NaN;rig.guards=label==='before'?[]:originalGuards;rig.heads.forEach((h,i)=>h.constraints=label==='before'?{...originalConstraints[i],edges:[]}:originalConstraints[i]);
   updateMuscleRig(rig,state);
   for(const h of rig.heads){const pos=h.mesh.geometry.getAttribute('position');assert(pos.array.every(Number.isFinite));for(let i=0;i<pos.count;i++)if(h.constraints.mobility[i])elbowStats[label]+=Math.max(0,...guards.map(g=>guardDepth(new T.Vector3().fromBufferAttribute(pos,i),g)));}
  }
 }
 disposeMuscleRig(rig);
}
assert(elbowStats.after<elbowStats.before*.6,'elbow bone-core overlap decreases');
console.log('PASS: bilateral high-angle biceps/triceps bone-core overlap reduced.',elbowStats);
