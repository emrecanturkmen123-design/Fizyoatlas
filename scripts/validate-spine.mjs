import fs from 'node:fs';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import {SPINE_REGIONS,spineParts,spineRegion,spineState,vertebraLabel,selectSpinePart} from '../app/spine.ts';import {lessonFromHash} from '../app/lesson-routes.ts';import {separateStructures} from '../app/separation.ts';import {toggleLayer} from '../app/layer-state.ts';import Panel from '../app/spine-panel.tsx';
const a=JSON.parse(fs.readFileSync('public/models/atlas.json'));assert.equal(lessonFromHash('#omurga'),'spine');assert.equal(new Set(SPINE_REGIONS.map(r=>r.color)).size,5);
for(const [i,r] of SPINE_REGIONS.entries()){assert.equal(spineParts(a,r.id).length,[7,12,5,1,1][i],r.id);const s=spineState({reset:0,focus:0,lower:{motion:true},attachments:{},explode:1,isolate:true,hidden:a.parts.map(p=>p.id)},a,r.id);assert(s.selected.every(id=>spineRegion(a.parts.find(p=>p.id===id))===r.id));assert.equal(s.lower,undefined);assert.equal(s.attachments,undefined);assert.equal(s.explode,0);assert.equal(s.isolate,false);assert.equal(s.hidden.length,0);assert.equal(separateStructures(s,60).spine,undefined);assert.equal(toggleLayer(s,'muscular').spine,undefined);const html=render(React.createElement(Panel,{value:r.id,onRegion:()=>{},onClose:()=>{}}));assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);for(const region of SPINE_REGIONS)assert(html.includes(region.name));}
assert.equal(spineParts(a).length,26);assert(!spineParts(a).some(p=>/disc|disk|cord|nerve/i.test(p.name)));
const meta=JSON.parse(fs.readFileSync('public/models/coccyx-source.json'));assert(meta.transform.sacrumEnvelopeRmsMm<9);assert.equal(meta.sourceObject,'Coccyx');
console.log('PASS: 26 actual spine meshes, 5 distinct regions, all region focus states, deep link, accessible legend and exit restoration.');

const expected=[...Array.from({length:7},(_,i)=>'C'+(i+1)),...Array.from({length:12},(_,i)=>'T'+(i+1)),...Array.from({length:5},(_,i)=>'L'+(i+1)),'Sakrum','Koksiks'];
assert.deepEqual(spineParts(a).map(p=>vertebraLabel(p).code).sort(),expected.sort());
let current=spineState({reset:4,focus:7},a,'cervical');
for(const [name,code] of [['Atlas','C1'],['Fifth cervical vertebra','C5'],['Twelfth thoracic vertebra','T12'],['Fifth lumbar vertebra','L5']]){
 const part=a.parts.find(p=>p.name===name);const previous=current;current=selectSpinePart(current,part);
 assert.deepEqual(current.selected,[part.id]);assert.equal(current.reset,previous.reset);assert.equal(current.focus,previous.focus);
 const html=render(React.createElement(Panel,{selected:part,value:current.spine,onRegion:()=>{},onClose:()=>{}}));assert(html.includes('<strong>'+code+'</strong>'));assert(html.includes('role="status"'));
 const focused=selectSpinePart(current,part,true);assert.equal(focused.focus,current.focus+1);
}
console.log('PASS: every vertebra label, consecutive single-vertebra selections, announced C1/C5/T12/L5 labels and double-click focus.');
