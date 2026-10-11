import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {CLINICAL_STRUCTURES,geometryLabel} from '../app/clinical-structures.ts';
import {connectiveSelection} from '../app/connective-study.ts';
import {CONNECTIVE_FINDINGS,findingScene,findingChoice,projectFinding,pickFinding} from '../app/model-finding.ts';
import {requiredChunks} from '../app/model-demand.ts';
import {createMuscleRig,updateMuscleRig,disposeMuscleRig} from '../app/anatomical-muscles.ts';
import {createLimbRig,updateLimbRig,disposeLimbRig} from '../app/limb-muscles.ts';
import {elbowMatrices} from '../app/elbow-motion.ts';
import {patellaMatrix} from '../app/knee-tendon.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const provenance=JSON.parse(fs.readFileSync('public/models/tendon-completion-source.json'));
const extensor=JSON.parse(fs.readFileSync('public/models/extensor-region-source.json'));
const baseline='88365d1913ad0bf8e398dd3560ba5a91c5509e49';
const old=JSON.parse(execFileSync('git',['show',baseline+':public/models/atlas.json'],{maxBuffer:20e6}));
const buffers=new Map(),oldBuffers=new Map();
function buffer(a,p,historical=false){const cache=historical?oldBuffers:buffers,url='public'+a.chunks[p.chunk].url;if(!cache.has(url))cache.set(url,historical?execFileSync('git',['show',baseline+':'+url],{maxBuffer:40e6}):fs.readFileSync(url));return cache.get(url);}
const arrays=(a,p,historical=false)=>{const b=buffer(a,p,historical);return [b.subarray(p.positions,p.positions+p.vertexCount*12),b.subarray(p.normals,p.normals+p.vertexCount*6),b.subarray(p.indices,p.indices+p.indexCount*4)];};
for(const p of old.parts){const now=atlas.parts.find(x=>x.id===p.id);assert(now,p.id);for(const field of ['name','system','conceptId','vertexCount','indexCount','bounds'])assert.deepEqual(now[field],p[field]);const previous=arrays(old,p,true),current=arrays(atlas,now);for(let i=0;i<3;i++)assert(current[i].equals(previous[i]),p.name+' source arrays preserved');}
assert.equal(atlas.parts.length-old.parts.length,20+JSON.parse(fs.readFileSync('public/models/distal-tendon-source.json')).parts.length+JSON.parse(fs.readFileSync('public/models/knee-course-source.json')).parts.length+JSON.parse(fs.readFileSync('public/models/pectoral-nerves-source.json')).parts.length);
for(const p of [...provenance.parts,...extensor.parts]){const part=atlas.parts.find(x=>x.id===p.id),bytes=arrays(atlas,part);assert.equal(part.vertexCount,p.vertices);assert.equal(part.indexCount,p.triangles*3);for(const [i,key]of ['positionsSHA256','normalsSHA256','indicesSHA256'].entries())assert.equal(createHash('sha256').update(bytes[i]).digest('hex'),p[key]);}
assert.equal(provenance.unavailableFullBodies.length,4);
assert.equal(CLINICAL_STRUCTURES.filter(s=>geometryLabel(s)==='Yalnız tutunma yüzeyi').length,0);
const geometries=new Map();
const mesh=p=>{const b=buffer(atlas,p),ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.length);return {part:p,positions:new Float32Array(ab,p.positions,p.vertexCount*3),indices:new Uint32Array(ab,p.indices,p.indexCount)};};
for(const p of atlas.parts.filter(p=>p.system==='skeletal'||p.system==='muscular'||p.system==='connective')){const m=mesh(p),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(m.positions,3));g.setIndex(new T.BufferAttribute(m.indices,1));geometries.set(p.id,g);}
assert.equal(CONNECTIVE_FINDINGS.length,CLINICAL_STRUCTURES.filter(s=>s.modelScope!=='context').length*2);
const candidateGroups=new Map();let hitChecks=0;
for(const q of CONNECTIVE_FINDINGS){const scene=findingScene(atlas,q.id);assert(scene);assert.equal(scene.targetIds.length,1);assert.equal(findingChoice(atlas,q.id,scene.targetIds[0]),q.answer);assert.equal(findingChoice(atlas,q.id,'missing-id'),undefined);assert.equal(findingChoice(atlas,q.id,scene.parts.find(p=>p.system==='skeletal').id),'Kas veya kemik');
 const group=q.region+q.side,ids=[...scene.candidateIds].sort();if(candidateGroups.has(group))assert.deepEqual(ids,candidateGroups.get(group));else{candidateGroups.set(group,ids);const meshes=scene.parts.map(mesh);for(const view of ['front','back','side']){const triangles=projectFinding(meshes,view,600,420);assert(triangles.length);assert(triangles.every(t=>t.p.flat().every(Number.isFinite)));assert.equal(pickFinding(triangles,-1e6,-1e6),undefined);for(const target of scene.candidateIds){const own=triangles.filter(t=>t.partId===target);assert(own.length);const hits=own.filter((_,i)=>i%Math.max(1,Math.floor(own.length/30))===0).map(t=>pickFinding(triangles,t.p.reduce((v,p)=>v+p[0],0)/3,t.p.reduce((v,p)=>v+p[1],0)/3));hitChecks+=hits.filter(id=>id===target).length;}}}
 for(const partId of scene.candidateIds.filter(id=>!scene.targetIds.includes(id)))assert.notEqual(findingChoice(atlas,q.id,partId),q.answer);
 const selection=connectiveSelection(atlas,q.structureKey,q.side);assert.equal(selection.structures.length,1);assert(selection.context.length);assert(selection.context.every(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase().includes(q.side)));
}
assert(hitChecks>100,'real triangle picking must find multiple source candidate surfaces');
// An overlapping wrong tendon has the same priority as the requested target.
const a={partId:'first',system:'connective',p:[[0,0,0],[10,0,0],[0,10,0]],depth:0},b={...a,partId:'second',depth:1};assert.equal(pickFinding([a,b],2,2),'second');
const base={visible:['skeletal','muscular'],selected:[],explode:0,isolate:false,rotate:false,reset:0,view:'front'};let attachmentChecks=0;
for(const side of ['right','left']){
 const elbow={side,id:'flexion',progress:0,playing:false,motion:true,anatomicalMuscles:true,tendons:true},es={...base,elbow},chunks=new Set(requiredChunks(atlas,es)),available=new Map([...geometries].filter(([id])=>chunks.has(atlas.parts.find(p=>p.id===id).chunk))),rig=createMuscleRig(atlas,available,side,true);assert.equal(rig.tendons.length,2);const off=createMuscleRig(atlas,available,side,false);assert.equal(off.tendons.length,0);disposeMuscleRig(off);
 const disabled=requiredChunks(atlas,{...es,elbow:{...elbow,tendons:false}});assert(!disabled.some(c=>atlas.parts.some(p=>p.chunk===c&&p.name.toLowerCase()===side+' biceps distal tendon')));
 for(const progress of [0,25,50,75,100,0]){const s={...elbow,progress};updateMuscleRig(rig,s);for(const tendon of rig.tendons){const pos=tendon.mesh.geometry.attributes.position;assert(pos.array.every(Number.isFinite));assert(tendon.mesh.geometry.attributes.normal.array.every(Number.isFinite));for(let i=0;i<pos.count;i++)if(tendon.distal&&tendon.proximalBlend[i]===0||!tendon.distal&&tendon.proximalBlend[i]===1){const expected=new T.Vector3().fromArray(tendon.rest,i*3);if(tendon.distal)expected.applyMatrix4(elbowMatrices(atlas,s).upper);assert(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<1e-7);attachmentChecks++;}const original=geometries.get(tendon.mesh.userData.partId).attributes.position.array;assert.deepEqual(original,tendon.rest);if(!progress)assert.deepEqual(pos.array,tendon.rest);}}
 disposeMuscleRig(rig);
 const knee={side,id:'flexion',progress:0,playing:false,motion:true,anatomicalMuscles:true,tendons:true},ks={...base,knee},demand=new Set(requiredChunks(atlas,ks)),loaded=new Map([...geometries].filter(([id])=>demand.has(atlas.parts.find(p=>p.id===id).chunk))),limb=createLimbRig(atlas,loaded,ks),quad=limb.surfaces.find(s=>s.part.clinicalKey==='quadriceps tendon');assert(quad);
 for(const progress of [0,25,50,75,100,0]){const s={...ks,knee:{...knee,progress}};updateLimbRig(limb,s);const pos=quad.mesh.geometry.attributes.position;assert(pos.array.every(Number.isFinite));assert(quad.mesh.geometry.attributes.normal.array.every(Number.isFinite));for(let i=0;i<pos.count;i++)if(quad.calfFollowers[i].blend===0){const expected=new T.Vector3().fromArray(quad.rest,i*3).applyMatrix4(patellaMatrix(atlas,s.knee));assert(expected.distanceTo(new T.Vector3().fromBufferAttribute(pos,i))<1e-7);attachmentChecks++;}assert.deepEqual(geometries.get(quad.part.id).attributes.position.array,quad.rest);if(!progress)for(let i=0;i<pos.array.length;i++)assert(Math.abs(pos.array[i]-quad.rest[i])<1e-7);}
 disposeLimbRig(limb);
}
assert(attachmentChecks>100);
for(const side of ['right','left']){const study=connectiveSelection(atlas,'common extensor tendon',side);assert(study.context.some(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase()===side+' extensor carpi radialis brevis proximal tendon'));assert(!findingScene(atlas,`locate:common extensor tendon:${side}`).parts.some(p=>p.id.startsWith('ZA-extensor-region-')),'auxiliary tendon region must not become an unanswerable quiz candidate');}
console.log(`PASS: ${old.parts.length} existing meshes preserved byte for byte; 20 earlier source imports and 38 distal source surfaces; historical source hashes retained; 66 bilateral finding questions, ${hitChecks} real triangle hits, equal candidate priority, demanded buffers and ${attachmentChecks} moving attachment checks. The previous ECRB context region remains available alongside the four-component source complex.`);
