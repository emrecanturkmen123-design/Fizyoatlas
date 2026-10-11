import assert from 'node:assert/strict';
import fs from 'node:fs';
import {elbowAngle,elbowMatrices} from '../app/elbow-motion.ts';
import {demoPaths} from '../app/muscle-demo.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json','utf8'));
for(const side of ['left','right'])for(const contraction of ['concentric','eccentric','isometric']){
 const states=[0,50,100].map(progress=>({side,contraction,id:contraction==='eccentric'?'extension':'flexion',progress,motion:true,playing:false,muscleDemo:true}));
 const angles=states.map(elbowAngle),lengths=states.map(s=>demoPaths(atlas,s).biceps.getLength());
 assert.deepEqual(angles,contraction==='concentric'?[30,75,120]:contraction==='eccentric'?[120,75,30]:[90,90,90]);
 if(contraction==='concentric')assert(lengths[0]>lengths[1]&&lengths[1]>lengths[2]);
 if(contraction==='eccentric')assert(lengths[0]<lengths[1]&&lengths[1]<lengths[2]);
 if(contraction==='isometric')assert(lengths.every(x=>x===lengths[0]));
 for(const s of states)assert(elbowMatrices(atlas,s).upper.elements.every(Number.isFinite));
}
console.log('PASS: bilateral contraction angles, muscle length direction and fixed isometric pose');
