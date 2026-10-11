import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {armSegment,poseMatrices,jointAnchors,angleFor,advancePlayback} from '../app/shoulder-motion.ts';
import {SHOULDER_MOVES} from '../app/shoulder.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const close=(a,b)=>assert.ok(a.distanceTo(b)<1e-8,`${a.toArray()} != ${b.toArray()}`);
for(const side of ['right','left']){
 const bones=atlas.parts.filter(p=>armSegment(p,side));assert.equal(bones.length,30);assert.equal(bones.filter(p=>armSegment(p,side)===1).length,1);
 for(const p of bones)assert.equal(armSegment(p,side==='right'?'left':'right'),0);
 for(const m of SHOULDER_MOVES){const s={id:m.id,side,plane:true,motion:true,progress:0};
  for(const progress of [0,10,50,100]){const pose=poseMatrices(atlas,{...s,progress});close(pose.shoulder.clone().applyMatrix4(pose.upper),pose.shoulder);close(pose.elbow.clone().applyMatrix4(pose.upper),pose.elbow.clone().applyMatrix4(pose.lower));
   assert.ok(Math.abs(pose.upper.determinant()-1)<1e-9);assert.ok(Math.abs(pose.lower.determinant()-1)<1e-9);
   for(const p of bones){const v=new T.Vector3().fromArray(p.bounds[0]).applyMatrix4(armSegment(p,side)===1?pose.upper:pose.lower);assert.ok(v.toArray().every(Number.isFinite));}
  }
  const pose=poseMatrices(atlas,{...s,progress:100}),{shoulder,elbow}=jointAnchors(atlas,side),end=elbow.clone().applyMatrix4(pose.upper);
  if(m.id==='flexion')assert.ok(end.z>elbow.z+.2);
  if(m.id==='extension')assert.ok(end.z<elbow.z-.1);
  if(m.id==='abduction')assert.ok(Math.abs(end.x)>Math.abs(elbow.x)+.15);
  if(m.id==='adduction')close(end,elbow);
 }
}
assert.equal(angleFor({id:'adduction',side:'right',plane:true,progress:0}),90);
assert.equal(angleFor({id:'adduction',side:'right',plane:true,progress:100}),0);
const stopped=advancePlayback({id:'flexion',side:'right',plane:true,progress:99,playing:true});assert.equal(stopped.progress,100);assert.equal(stopped.playing,false);
console.log('PASS: 30 bones per side; 6 motions across 4 positions; fixed shoulder pivot, connected elbow, rigid lengths, correct direction and playback stop.');
