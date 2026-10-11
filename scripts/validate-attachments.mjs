import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {ATTACHMENTS,attachmentTargets} from '../app/attachments.ts';
import {nearestVertex} from '../app/attachment-projection.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const chunks=new Map();let n=0;
for(const key of Object.keys(ATTACHMENTS))for(const side of ['right','left']){
 const targets=attachmentTargets(atlas,{key,side,mode:'both'});assert.equal(targets.length,ATTACHMENTS[key].origin.length+ATTACHMENTS[key].insertion.length,`${key} ${side} coverage`);
 for(const t of targets){const p=atlas.parts.find(p=>p.id===t.boneId);assert.ok(p);assert.ok(!p.name.toLowerCase().includes(side==='right'?'left':'right'));assert.ok(t.seed.every(Number.isFinite));
 if(!chunks.has(p.chunk))chunks.set(p.chunk,fs.readFileSync('public'+atlas.chunks[p.chunk].url));const raw=chunks.get(p.chunk);const a=new Float32Array(raw.buffer,raw.byteOffset+p.positions,p.vertexCount*3);const point=nearestVertex(new T.BufferAttribute(a,3),t.seed);assert.ok(point.toArray().every(Number.isFinite));assert.ok(point.distanceTo(new T.Vector3().fromArray(t.seed))<.15,'seed within regional distance of bone');n++;
 }
 for(const mode of ['origin','insertion'])assert.ok(attachmentTargets(atlas,{key,side,mode}).every(t=>t.kind===mode));
}
console.log(`PASS: ${n} bilateral attachment markers resolve to existing bone vertices; all configured muscles and groups, side separation and origin/insertion filters.`);
