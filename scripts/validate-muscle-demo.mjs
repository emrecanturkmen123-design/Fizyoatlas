import fs from 'node:fs';import assert from 'node:assert/strict';
import {demoPaths,muscleDemo,disposeMuscleDemo} from '../app/muscle-demo.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const side of ['left','right']){let lastB=Infinity,lastT=0;for(let progress=0;progress<=100;progress+=10){const s={id:'flexion',side,progress,motion:true,muscleDemo:true,playing:false},p=demoPaths(atlas,s);assert.ok(p.biceps.getLength()<lastB);assert.ok(p.triceps.getLength()>lastT);lastB=p.biceps.getLength();lastT=p.triceps.getLength();const group=muscleDemo(atlas,s);assert.equal(group.children.length,2);for(const mesh of group.children){assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));assert.ok(mesh.geometry.boundingSphere.radius<.5);}disposeMuscleDemo(group);const reverse=demoPaths(atlas,{...s,id:'extension',progress:100-progress});assert.ok(Math.abs(reverse.biceps.getLength()-p.biceps.getLength())<1e-8);}
assert.equal(muscleDemo(atlas,{id:'pronation',side,progress:50,motion:true,muscleDemo:true}).children.length,0);}
console.log('PASS: bilateral schematic lengths, reversible poses, finite geometry, forearm rotation exclusion.');
