import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {toggleLayer} from '../app/layer-state.ts';import {NERVES,nerveParts,targetParts,nerveForName} from '../app/innervation.ts';import {lessonFromHash} from '../app/lesson-routes.ts';
const a=JSON.parse(fs.readFileSync('public/models/atlas.json')),original=JSON.parse(execFileSync('git',['show','b169bd42c46dbe5a31d4f7e2ea27098f0976d9fb:public/models/atlas.json'],{maxBuffer:8e6}));
const metadata=p=>Object.fromEntries(Object.entries(p).filter(([k])=>!['chunk','positions','normals','indices'].includes(k)));
const current=new Map(a.parts.map(p=>[p.id,p])),oldBuffers=new Map(),newBuffers=new Map();
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const p of original.parts){const next=current.get(p.id);assert(next,p.id);assert.deepEqual(metadata(next),metadata(p),p.id+' metadata preserved');
 if(!oldBuffers.has(p.chunk))oldBuffers.set(p.chunk,execFileSync('git',['show','b169bd42c46dbe5a31d4f7e2ea27098f0976d9fb:public'+original.chunks[p.chunk].url],{maxBuffer:16e6}));
 if(!newBuffers.has(next.chunk))newBuffers.set(next.chunk,fs.readFileSync('public'+a.chunks[next.chunk].url));
 for(const [field,size]of [['positions',p.vertexCount*12],['normals',p.vertexCount*6],['indices',p.indexCount*4]])assert.equal(digest(oldBuffers.get(p.chunk).subarray(p[field],p[field]+size)),digest(newBuffers.get(next.chunk).subarray(next[field],next[field]+size)),p.id+' '+field+' unchanged');
}
const supplement=a.parts.filter(p=>p.id.startsWith('ZA-')&&['nervous','muscular'].includes(p.system));assert.equal(supplement.length,74);assert.equal(supplement.filter(p=>p.system==='nervous').length,72);assert.equal(supplement.filter(p=>p.system==='muscular').length,2);
for(const c of a.chunks){const raw=fs.readFileSync('public'+c.url);assert.equal(digest(zlib.gunzipSync(fs.readFileSync('public'+c.gzip))),digest(raw),c.url+' matching gzip');}
const state={visible:['skeletal','muscular'],selected:['old'],hidden:[],isolate:true,explode:1,rotate:true,reset:0,view:'front',elbow:{motion:true}};const on=toggleLayer(state,'nervous');assert.equal(on.highlightedSystem,'nervous');assert.deepEqual(on.visible,['skeletal','muscular','nervous']);assert(!on.elbow);assert(!on.isolate);assert.equal(on.explode,0);assert.deepEqual(on.selected,[]);const off=toggleLayer(on,'nervous');assert.equal(off.highlightedSystem,undefined);assert.deepEqual(off.visible,state.visible);assert.equal(toggleLayer(on,'skeletal').highlightedSystem,'nervous');
for(const id of ['musculocutaneous','radial','median','thoracodorsal','axillary','suprascapular','long-thoracic','superior-gluteal','femoral','deep-fibular','tibial'])for(const side of ['left','right']){const n=NERVES.find(n=>n.id===id),parts=nerveParts(a,n,side);assert(parts.length,id+' 3D nerve exists');for(const p of parts)assert.equal(nerveForName(p.name)?.id,id);assert(targetParts(a,n,side).length,id+' motor targets');}
assert.equal(lessonFromHash('#latissimus'),'latissimus');
console.log('PASS: v30 geometry and metadata preserved through repacking; 74 licensed supplement surfaces, matching gzip; nerve focus toggle/restoration and bilateral nerve-to-muscle links including latissimus.');
