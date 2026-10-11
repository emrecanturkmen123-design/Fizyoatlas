import {applyMotionContextOpacity} from '../app/motion-context-opacity.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {HAND_MOVES,HAND_DIGITS,handPose,handAngles,handBone,handBoneChain,handContextParts,handSoftParts,handMuscleParts} from '../app/hand-motion.ts';
import {createHandRig,updateHandRig,disposeHandRig} from '../app/hand-rig.ts';
import {requiredChunks} from '../app/model-demand.ts';
import {elementsFor,muscleFor} from '../app/education-data.ts';
import {nervesForMuscle} from '../app/innervation.ts';
import {muscleReview} from '../app/muscle-review.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
import {REGIONAL_COURSES} from '../app/regional-course-content.ts';
import {regionalMotionState,regionalTransform,regionalContext} from '../app/regional-course-data.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),v=a=>new T.Vector3().fromArray(a),near=(a,b)=>assert(a.distanceTo(b)<1e-7,`joint gap ${a.distanceTo(b)}`),mat=m=>assert(m.elements.every(Number.isFinite));
assert.equal(HAND_MOVES.length,13);
const base={side:'right',digit:'all',progress:0,playing:false,motion:true,anatomicalMuscles:true,tendons:true,id:'finger-flexion'};
let poses=0;
for(const side of ['right','left']){
 const bones=atlas.parts.filter(p=>handBone(p,side));assert.equal(bones.length,27);
 for(const move of HAND_MOVES){assert(move.keys.every(key=>muscleFor(key)&&muscleReview(key).roots&&nervesForMuscle(key).length));
  for(const digit of ['all',...HAND_DIGITS])for(const progress of [0,25,50,75,100]){
   const s={...base,side,id:move.id,digit,progress},pose=handPose(atlas,s);assert.equal(pose.matrices.size,27);pose.matrices.forEach(mat);
   assert(handMuscleParts(atlas,s).length,move.id+side);
   for(const finger of HAND_DIGITS){const pivots=pose.pivots[finger],chain=pose.chains[finger];for(let j=0;j<3;j++)near(v(pivots[j]).applyMatrix4(chain[j]),v(pivots[j]).applyMatrix4(chain[j+1]));
    if(digit!=='all'&&finger!==digit)for(const matrix of chain)assert.deepEqual(matrix.elements,pose.wrist.elements,'unselected finger remains neutral');
   }
   const thumb=pose.pivots.thumb,chain=pose.chains.thumb;for(let j=1;j<3;j++)near(v(thumb[j]).applyMatrix4(chain[j-1]),v(thumb[j]).applyMatrix4(chain[j]));
   const hash=workspaceHash({lesson:'hand',motion:move.id,side,progress,handDigit:digit,motionMuscles:true,motionLayers:['tendons']}),route=parseWorkspaceRoute(hash);assert.equal(route.motion,move.id);assert.equal(route.handDigit,digit);assert.equal(route.progress??0,progress);assert.equal(route.side,side);
   poses++;
  }
 }
 for(const digit of HAND_DIGITS){const s={...base,side,id:'finger-flexion',digit,progress:20},pose=handPose(atlas,s),tip=v(pose.pivots[digit][2]).add(v(pose.pivots[digit][2]).sub(v(pose.pivots[digit][1])).normalize().multiplyScalar(.012)),delta=tip.clone().applyMatrix4(pose.chains[digit][3]).sub(tip);assert(delta.dot(pose.palmar)>0,'flexion initially moves toward palm');}
 const extension=handPose(atlas,{...base,side,id:'finger-extension',progress:100});extension.matrices.forEach(m=>assert.deepEqual(m.elements,new T.Matrix4().elements,'extension ends at reference'));
 for(const id of ['radial-deviation','ulnar-deviation']){const p=handPose(atlas,{...base,side,id,progress:100}),middle=v(p.pivots.middle[0]),delta=middle.clone().applyMatrix4(p.wrist).sub(middle);assert((side==='right'?-1:1)*delta.x*(id==='radial-deviation'?1:-1)>0,'deviation points toward named side');}
 assert.equal(handAngles({...base,id:'dip-flexion',progress:100}).pip,0);assert.equal(handAngles({...base,id:'pip-flexion',progress:100}).dip,0);
}
const geometries=new Map(),buffers=new Map();
for(const p of atlas.parts.filter(p=>handBone(p,'right')||handSoftParts(atlas,base).some(x=>x.id===p.id))){if(!buffers.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);buffers.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=buffers.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));g.computeVertexNormals();geometries.set(p.id,g);}
assert(handSoftParts(atlas,base).every(p=>p.bounds[1][1]>.7),'no leg or foot source meshes in hand rig');
assert(elementsFor(atlas,['extensor digitorum']).every(id=>!/(longus|brevis)/i.test(atlas.parts.find(p=>p.id===id).name)),'hand extensor excludes foot extensors');
const original=new Map([...geometries].map(([id,g])=>[id,g.attributes.position.array.slice()]));
const rig=createHandRig(atlas,geometries,base),t0=performance.now();let frameMs=0;
assert.equal(rig.meshes.filter(h=>h.part.system==='skeletal').length,27);assert(rig.meshes.some(h=>h.part.system==='connective'));
for(const move of HAND_MOVES)for(const progress of [0,50,100]){const start=performance.now();updateHandRig(rig,{...base,id:move.id,progress});frameMs=Math.max(frameMs,performance.now()-start);
 for(const h of rig.meshes){assert([...h.mesh.geometry.attributes.position.array].every(Number.isFinite));if(h.rest){for(let i=0;i<h.rest.length;i+=3)if(h.rest[i+1]>.925)assert.deepEqual(Array.from(h.mesh.geometry.attributes.position.array.slice(i,i+3)),Array.from(h.rest.slice(i,i+3)),'proximal source origin unchanged');}}
}
for(const [id,g] of geometries)assert.deepEqual(g.attributes.position.array,original.get(id),'source buffer unchanged');
const visible=new Set([...handContextParts(atlas,'right'),...handSoftParts(atlas,base)].map(p=>p.id)),state={visible:['skeletal','muscular'],selected:[],explode:0,isolate:false,view:'front',rotate:false,reset:0,hidden:atlas.parts.filter(p=>!visible.has(p.id)).map(p=>p.id),hand:base};
for(const muscles of [false,true])for(const tendons of [false,true]){const needed=new Set(requiredChunks(atlas,{...state,hand:{...base,anatomicalMuscles:muscles,tendons}})),expected=rig.meshes.filter(h=>h.part.system==='skeletal'||h.part.system==='muscular'&&muscles||h.part.system==='connective'&&tendons);assert(expected.every(h=>needed.has(h.part.chunk)),'demand provides every enabled source surface');}
const visibleMuscles=rig.meshes.filter(m=>m.part.system==='muscular');assert(visibleMuscles.length>1);
const picked=visibleMuscles[0],other=visibleMuscles[1],positionBefore=picked.mesh.geometry.attributes.position.array.slice();
applyMotionContextOpacity([rig.group],new Set([picked.part.id]),.15);assert.equal(picked.mesh.material.opacity,1);assert.equal(other.mesh.material.opacity,.15);assert.deepEqual(picked.mesh.geometry.attributes.position.array,positionBefore);
applyMotionContextOpacity([rig.group],new Set([other.part.id]),.3);assert.equal(picked.mesh.material.opacity,.3);assert.equal(other.mesh.material.opacity,1);
applyMotionContextOpacity([rig.group],new Set(),.3);assert(rig.meshes.every(m=>m.mesh.material.opacity===1&&!m.mesh.material.transparent));
disposeHandRig(rig);assert.equal(rig.meshes.length,0);geometries.forEach(g=>g.dispose());
const course=REGIONAL_COURSES.find(c=>c.id==='hand-foundations');
for(const side of ['left','right'])for(let motionStop=0;motionStop<course.motions.length;motionStop++){const p={side,motionStop},s=regionalMotionState(course,p);assert(s.hand?.motion,'hand course uses actual joint poses');assert.equal(regionalContext(atlas,course,side).filter(x=>handBone(x,side)).length,27);const bone=atlas.parts.find(x=>handBoneChain(x)?.digit==='index'&&handBone(x,side));assert(regionalTransform(atlas,s,bone));}
console.log(`PASS: ${poses} source hand poses, bilateral 27-bone chains, flexion/deviation direction, independent fingers, isolated joints, 13 sourced muscle links, URL round trips, real geometry deformation/source preservation and course poses. ${rig.meshes.length?rig.meshes.length:'Rig disposed'}; slowest CPU update ${frameMs.toFixed(1)} ms, total rig exercise ${(performance.now()-t0).toFixed(0)} ms. GPU not tested.`);
