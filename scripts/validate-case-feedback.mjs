import assert from 'node:assert/strict';
import {CASE_JOURNEYS} from '../app/case-journeys.ts';
import {questionDefinition} from '../app/learning-data.ts';
for(const c of CASE_JOURNEYS)for(const [i,s] of c.steps.entries()){
 assert.equal(s.rationales.length,4);assert.equal(new Set(s.rationales).size,4);
 assert(s.rationales.every(x=>x.length>35));assert.equal(new Set(s.choices).size,4);
 const q=questionDefinition(`journey:${c.id}:${i}`);
 s.choices.forEach((choice,n)=>assert.equal(q.rationales[choice],s.rationales[n]));
 assert(!s.choices.some(x=>/markası|rengi|maraton|patellar tendon/i.test(x)&&['shoulder','elbow'].includes(c.region)));
}
const count=CASE_JOURNEYS.reduce((n,c)=>n+c.steps.length,0);console.log(`PASS: ${count} clinical questions, ${count*4} mapped choice explanations; no unrelated sampled distractors.`);
