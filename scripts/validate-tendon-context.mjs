import {DISTAL_STUDIES} from '../app/distal-tendons.ts';
import {connectiveSelection} from '../app/connective-study.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tendonContextParts} from '../app/tendon-context.ts';
import {CLINICAL_STRUCTURES,clinicalStructure} from '../app/clinical-structures.ts';
import {TENDON_INFO} from '../app/tendon-data.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const right=tendonContextParts(atlas,['FJ1405']);
assert.deepEqual(new Set(right),new Set(['FJ1394','FJ1397','FJ1437']));
const left=tendonContextParts(atlas,['FJ1405M']);
assert.deepEqual(new Set(left),new Set(['FJ1394M','FJ1397M','FJ1437M']));
assert.equal(tendonContextParts(atlas,['FJ1405','FJ1405M']).length,6);
assert.deepEqual(tendonContextParts(atlas,[]),[]);
assert.deepEqual(tendonContextParts(atlas,['FJ1437']),[]);
assert.deepEqual(tendonContextParts(atlas,['ZA-clinical-right-anterior-cruciate-ligament']),[]);
for(const [key,card] of Object.entries(TENDON_INFO)){
 const item=CLINICAL_STRUCTURES.find(s=>s.key===key);assert(item);
 assert.equal(clinicalStructure(item.name)?.key,key);
 for(const side of ['left','right']){
  const part=atlas.parts.find(p=>p.system==='connective'&&p.name.toLowerCase()===side+' '+key);assert(part);
  const context=tendonContextParts(atlas,[part.id]);if(!DISTAL_STUDIES.some(s=>s.key===key&&!s.muscles.length))assert(context.some(id=>atlas.parts.find(p=>p.id===id).system==='muscular'),key+' must show its muscle continuation');else assert(connectiveSelection(atlas,key,side).context.some(id=>atlas.parts.find(p=>p.id===id).system==='connective'),key+' shows neighboring tendons');
  assert(context.every(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase().includes(side)));
 }
 assert(card.attachment&&card.muscles&&card.action&&card.clinical&&card.sources.length);
}
console.log('PASS: all ten bilateral tendon card/muscle mappings, including source-named infraspinatus muscle; no opposite-side leakage or unrelated context.');

for(const s of DISTAL_STUDIES)for(const side of ['left','right']){const c=connectiveSelection(atlas,s.key,side);assert(c.context.every(id=>!new RegExp(s.module==='hand'?'\\btoe\\b':'finger|thumb','i').test(atlas.parts.find(p=>p.id===id).name)),s.key+' has no hand/foot leakage');assert(c.context.every(id=>new RegExp('\\b'+side+'\\b','i').test(atlas.parts.find(p=>p.id===id).name)));}for(const key of ['wrist flexor retinaculum','ankle flexor retinaculum'])for(const side of ['left','right'])assert(connectiveSelection(atlas,key,side).context.some(id=>atlas.parts.find(p=>p.id===id).system==='nervous'),'source nerve context');
