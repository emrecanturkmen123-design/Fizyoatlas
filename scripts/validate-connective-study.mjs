import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';import {EducationCard} from '../app/education.tsx';import {buildSearchIndex,querySearch} from '../app/anatomy-search.ts';
import assert from 'node:assert/strict';import fs from 'node:fs';
import {CLINICAL_STRUCTURES} from '../app/clinical-structures.ts';import {CONNECTIVE_STUDIES,connectiveSelection,selectedConnectiveSide} from '../app/connective-study.ts';import {LIGAMENT_INFO} from '../app/ligament-data.ts';import {TENDON_INFO} from '../app/tendon-data.ts';import {CASE_JOURNEYS,journeyTargets} from '../app/case-journeys.ts';import {structureCoverage} from '../app/coverage.tsx';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const entry of CLINICAL_STRUCTURES){assert(TENDON_INFO[entry.key]||LIGAMENT_INFO[entry.key]);for(const side of ['right','left']){
 const c=connectiveSelection(atlas,entry.key,side),shown=[...c.selected,...c.context],contextOnly=entry.modelScope==='context';
 assert(c.selected.length);assert(shown.every(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase().includes(side)));
 assert.equal(selectedConnectiveSide(atlas,c.selected),side);assert(shown.every(id=>!c.hidden.includes(id)));
 assert.equal(new Set([...shown,...c.hidden]).size,atlas.parts.length);
 assert.equal(c.structures.length,contextOnly?0:1);assert.equal(structureCoverage(atlas,entry.name,c.selected).model,contextOnly?0:1);
 if(contextOnly)assert(c.selected.every(id=>atlas.parts.find(p=>p.id===id).system==='muscular'));
 if(entry.key==='biceps long head tendon')assert(c.context.filter(id=>atlas.parts.find(p=>p.id===id).system==='muscular').every(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase()===`long head of ${side} biceps brachii`),'exclude triceps and short biceps head');
 if(entry.key==='common extensor tendon')assert(c.context.some(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase()===`${side} extensor carpi radialis brevis`));
 if(entry.key==='common extensor tendon')assert(c.context.every(id=>!/(digitorum longus|digitorum brevis)/i.test(atlas.parts.find(p=>p.id===id).name)),'forearm tendon context excludes toe extensors');
 const study=CONNECTIVE_STUDIES[entry.key];if(study.caseId){const journey=CASE_JOURNEYS.find(c=>c.id===study.caseId);assert(journey);const ids=journeyTargets(atlas,journey);assert(ids.length);
  const targetKey=entry.key==='biceps long head tendon'?'biceps brachii':entry.key==='common extensor tendon'?'extensor carpi radialis brevis':entry.key;
  assert(ids.some(id=>atlas.parts.find(p=>p.id===id).name.toLowerCase().endsWith(targetKey)),entry.key+' related case targets its stated anatomy');
 }
}}
for(const entry of CLINICAL_STRUCTURES){const html=render(React.createElement(EducationCard,{name:entry.name,system:'connective'}));assert(html.includes(entry.name));assert(html.includes('Tutunma noktaları')||html.includes('Kas–tendon–kemik bağlantısı')||html.includes('Yerel doku ilişkisi')||html.includes('Konumu'));}
assert(querySearch(buildSearchIndex(atlas),'patellar tendon').some(c=>c.id.startsWith('ZA-patellar-')));
for(const query of ['biseps uzun baş tendonu','ortak ekstansör tendon'])assert(querySearch(buildSearchIndex(atlas),query)[0].id.startsWith('clinical-study:'));
assert(querySearch(buildSearchIndex(atlas),'patellar tendon').filter(c=>c.id.startsWith('clinical-study:')).every(c=>c.id==='clinical-study:patellar ligament'),'unrelated cards must not inherit patellar aliases');
console.log(`PASS ${CLINICAL_STRUCTURES.length} cards × both sides: same-side context, visibility, honest mesh coverage, correct heads, case targets and search aliases.`);
