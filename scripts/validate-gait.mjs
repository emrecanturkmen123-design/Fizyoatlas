import {applyMotionContextOpacity} from '../app/motion-context-opacity.ts';
import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from 'three';
import {createGaitModel,gaitPose,gaitPhase,gaitSupport,gaitContact,gaitSegment,GAIT_SAMPLES,GAIT_STRIDE} from '../app/gait-motion.ts';
import {createGaitRig,updateGaitRig,disposeGaitRig} from '../app/gait-rig.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),geometries=new Map(),chunks=new Map();
for(const p of atlas.parts.filter(p=>['skeletal','muscular'].includes(p.system))){if(!chunks.has(p.chunk)){const b=fs.readFileSync('public'+atlas.chunks[p.chunk].url);chunks.set(p.chunk,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}const b=chunks.get(p.chunk),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));geometries.set(p.id,g);}
const model=createGaitModel(atlas,geometries),rig=createGaitRig(atlas,geometries);let maxLengthError=0,maxStep=0;
for(let p=0;p<=100;p+=.25){const pose=gaitPose(model,p);for(const side of ['right','left']){const leg=pose.legs[side],rest=model.legs[side];
 assert(leg.foot.elements.every(Number.isFinite));assert(Math.abs(leg.foot.determinant()-1)<1e-9);assert(leg.clearance>=-1e-7,'no floor penetration '+p+' '+side);
 if(leg.phase<60)assert(Math.abs(leg.clearance)<1e-7,'planted foot '+p+' '+side);else if(leg.phase>60.01&&leg.phase<99.99)assert(leg.clearance>0,'swing clearance');
 maxLengthError=Math.max(maxLengthError,Math.abs(leg.hip.distanceTo(leg.knee)-rest.lengths[0]),Math.abs(leg.knee.distanceTo(leg.ankle)-rest.lengths[1]));
 assert(leg.hip.clone().applyMatrix4(leg.thigh.clone().invert()).distanceTo(rest.hip)<1e-7);
 assert(rest.knee.clone().applyMatrix4(leg.thigh).distanceTo(rest.knee.clone().applyMatrix4(leg.shin))<1e-7,'connected knee');
 assert(rest.ankle.clone().applyMatrix4(leg.shin).distanceTo(rest.ankle.clone().applyMatrix4(leg.foot))<1e-7,'connected ankle');
 const prev=gaitPose(model,Math.max(0,p-.25)).legs[side];maxStep=Math.max(maxStep,leg.ankle.distanceTo(prev.ankle));
 }
 assert(pose.legs.right.phase<60||pose.legs.left.phase<60,'always at least one stance foot');
}
for(const [progress,expected] of [[0,5],[6,15],[20,5],[40,5]]){const l=gaitPose(model,progress).legs.right,flex=180-T.MathUtils.radToDeg(l.hip.clone().sub(l.knee).angleTo(l.ankle.clone().sub(l.knee)));assert(Math.abs(flex-expected)<.01,'stance knee angle '+progress);}
console.log({maxLengthError,maxStep});assert(maxLengthError<1e-7,'preserve bone lengths');assert(maxStep<.025,'smooth frame-to-frame motion');
for(const boundary of [2,10,30,50,60,73,87])for(const side of ['right','left']){const a=gaitPose(model,boundary-.0001).legs[side],b=gaitPose(model,boundary+.0001).legs[side];assert(a.ankle.distanceTo(b.ankle)<.0001,'continuous phase boundary '+boundary);}
for(const side of ['right','left']){const a=gaitPose(model,0).legs[side],b=gaitPose(model,100).legs[side];assert(a.ankle.clone().add(new T.Vector3(0,0,GAIT_STRIDE)).distanceTo(b.ankle)<1e-7,'same pose on next initial contact');}
for(let i=0;i<8;i++){const p=GAIT_SAMPLES[i];assert.equal(gaitPhase(p),i);updateGaitRig(rig,{progress:p,playing:false,speed:1,muscles:false,plane:false});assert(!rig.plane.visible);assert(rig.muscles.every(m=>!m.mesh.visible));updateGaitRig(rig,{progress:p,playing:false,speed:1,muscles:true,plane:true});assert(rig.plane.visible);assert(rig.muscles.some(m=>m.mesh.visible));for(const {mesh} of rig.muscles.filter(m=>m.mesh.visible))assert(mesh.geometry.attributes.position.array.every(Number.isFinite));}
for(const side of ['right']){const offset=0;for(const [a,b,pivot] of [[0,9,'heel'],[30,59,'toe']]){const point=model.legs[side][pivot],pa=point.clone().applyMatrix4(gaitPose(model,(a-offset+100)%100).legs[side].foot),pb=point.clone().applyMatrix4(gaitPose(model,(b-offset+100)%100).legs[side].foot);assert(Math.abs(pa.x-pb.x)<1e-7&&Math.abs(pa.z-pb.z)<1e-7,'no stance pivot sliding');}}
assert.equal(gaitPhase(100),0);assert.equal(gaitSupport(0),'Çift destek');assert.equal(gaitSupport(55),'Çift destek');assert.equal(gaitSupport(20),'Sağ tek destek');assert.equal(gaitSupport(80),'Sol tek destek');assert.equal(gaitContact(66),'Zeminden ayrı');
assert.equal(atlas.parts.filter(p=>gaitSegment(p)).length,64);
// Real source gait muscles must fade independently of the selected source mesh.
const picked=rig.muscles.find(m=>m.mesh.visible),other=rig.muscles.find(m=>m!==picked&&m.mesh.visible);assert(picked&&other);
assert.notEqual(picked.mesh.material,other.mesh.material,'source muscles have independent opacity');
const poseBefore=picked.mesh.geometry.attributes.position.array.slice(),boneBefore=rig.bones[0].mesh.matrix.elements.slice();
assert(applyMotionContextOpacity([rig.group],new Set([picked.part.id]),.2));
assert.equal(picked.mesh.material.opacity,1);assert.equal(other.mesh.material.opacity,.2);assert.equal(other.mesh.material.depthWrite,false);
assert.equal(rig.boneMaterial.opacity,.2);assert.deepEqual(picked.mesh.geometry.attributes.position.array,poseBefore);assert.deepEqual(rig.bones[0].mesh.matrix.elements,boneBefore);
applyMotionContextOpacity([rig.group],new Set(),.2);assert(rig.muscles.every(m=>m.mesh.material.opacity===1&&!m.mesh.material.transparent&&m.mesh.material.depthWrite));assert.equal(rig.boneMaterial.opacity,1);
let disposed=0;for(const m of rig.muscles)m.mesh.material.addEventListener('dispose',()=>disposed++);
const count=rig.muscles.length;disposeGaitRig(rig);assert.equal(disposed,count,'individual muscle materials released');console.log('PASS: eight bilateral poses; 401 cycle samples; sole clearance; rigid bone lengths; connected hip/knee/ankle; phase and cycle continuity; optional muscles/plane; single/double support.');
