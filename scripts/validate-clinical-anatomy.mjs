import {tendonParts} from '../app/tendon-model.ts';
import fs from 'node:fs';import assert from 'node:assert/strict';import {CLINICAL_STRUCTURES,clinicalStructure} from '../app/clinical-structures.ts';import {buildSearchIndex,querySearch} from '../app/anatomy-search.ts';import {muscleFor} from '../app/education-data.ts';import {CASE_JOURNEYS,journeyTargets} from '../app/case-journeys.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),meta=JSON.parse(fs.readFileSync('public/models/clinical-source.json'));assert.equal(meta.parts.length,16);
for(const item of CLINICAL_STRUCTURES){const parts=['right','left'].flatMap(side=>tendonParts(atlas,item.key,side));assert.equal(parts.length,2,item.key);for(const p of parts){assert.equal(p.system,'connective');assert(clinicalStructure(p.name));assert.equal(muscleFor(p.name),undefined);assert(p.indexCount>=96);assert(p.bounds[1][1]-p.bounds[0][1]<.4);}}
for(const c of CASE_JOURNEYS.filter(c=>['ankle-sprain','rotator-cuff','acl-rehab','achilles'].includes(c.id))){const ids=journeyTargets(atlas,c);assert(ids.length>0);assert(ids.every(id=>atlas.parts.some(p=>p.id===id&&p.system==='connective'&&/\bright\b/i.test(p.name)&&clinicalStructure(p.name))));}
const search=buildSearchIndex(atlas);for(const query of ['öçb','aşil tendonu','atfl','cfl','ptfl','supraspinatus tendon tutunması'])assert(querySearch(search,query).some(c=>c.elements.some(id=>atlas.parts.some(p=>p.id===id&&p.system==='connective'&&clinicalStructure(p.name)))),query);
for(const fit of Object.values(meta.localRegistration))assert(fit.envelopeRmsMm<6,'registration residual too large');
const footprints=meta.parts.filter(p=>p.sourceSelection.includes('footprint'));assert.equal(footprints.length,6);assert(footprints.every(p=>p.name.includes('insertion surface')));
console.log('PASS: 16 clinical surfaces + 2 Achilles + 2 extracted patellar surfaces, 10 modelled structures, Turkish search aliases, direct case targets, explicit footprint limits, local envelope residual <6 mm.');

const { clinicalTestIllustrations } = await import('../app/clinical-test-illustration-data.ts');
const { tests } = JSON.parse(fs.readFileSync('app/clinical-reference.json', 'utf8'));
assert.deepEqual(Object.keys(clinicalTestIllustrations).sort(), tests.map(test => test.id).sort());

for (const test of tests) {
  const illustration = clinicalTestIllustrations[test.id];
  assert(illustration.caption.trim() && illustration.drawing.length > 0, test.id);
}
assert(!clinicalTestIllustrations.homans.drawing.some(item => item.kind === 'hand' || item.kind === 'arrow'));
console.log(`PASS: ${tests.length} test-specific illustrations, including the Homans safety card.`);
