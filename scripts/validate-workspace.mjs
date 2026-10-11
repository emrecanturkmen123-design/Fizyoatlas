import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup as render} from 'react-dom/server';
import AtlasIndex from '../app/atlas-index.tsx';import PracticeMenu from '../app/practice-menu.tsx';import MovementMenu from '../app/movement-menu.tsx';import Shoulder from '../app/shoulder-panel.tsx';import {EducationCard} from '../app/education.tsx';import {modelViewport} from '../app/model-viewport.ts';
const noop=()=>{},html=(c,p)=>render(React.createElement(c,p));
const movement=html(MovementMenu,{ready:true,onOpen:noop});assert.equal((movement.match(/<button/g)||[]).length,7);for(const removed of ['Kas kartları','Klinik vakalar','Çalışmalarım','Omurga'])assert(!movement.includes(removed));
const practice=html(PracticeMenu,{ready:true,onOpen:noop});assert.equal((practice.match(/<button/g)||[]).length,3);
const atlas=html(AtlasIndex,{ready:true,onMuscle:noop,onNerve:noop,onSpine:noop});assert(atlas.includes('Omurgayı incele'));assert(atlas.includes('Sinirler'));assert(atlas.includes('M. latissimus dorsi'));
const card=html(EducationCard,{name:'soleus',system:'muscular'});assert(card.indexOf('Origo')<card.indexOf('Kaynaklar ve bilgi notları'));assert(card.includes('aria-expanded="false"')&&!card.includes('href="https://'),'bibliography is collapsed initially while the local printable page remains available');
const shoulder=html(Shoulder,{atlas:null,value:{id:'abduction',side:'right',motion:true,anatomicalMuscles:true,progress:0,playing:false,plane:true},onChange:noop,onAdvance:noop,onClose:noop,onMuscle:noop});assert(shoulder.includes('Oynat'));assert(!shoulder.includes('role="switch"'),'advanced controls are collapsed');assert(shoulder.includes('Görünüm seçenekleri'));assert(shoulder.indexOf('Oynat')<shoulder.indexOf('Görünüm seçenekleri'));
for(const [width,height,panels]of [[1366,900,[{left:20,right:310,top:100,bottom:804}]],[1366,900,[{left:20,right:310,top:100,bottom:804},{left:1006,right:1346,top:100,bottom:804}]],[390,844,[{left:8,right:382,top:506,bottom:836}]],[320,640,[{left:8,right:312,top:380,bottom:632}]],[900,700,[{left:584,right:884,top:100,bottom:604}]]]){const v=modelViewport(width,height,panels);assert(v.left>=0&&v.right<=width);assert(v.bottom<=height&&v.top>=0);assert(v.right-v.left>=120&&v.bottom-v.top>=60);for(const p of panels)if(width<768)assert(v.bottom<p.top);else assert(v.right<p.left||v.left>p.right);}
for(const [width,height] of [[667,375],[844,390]]){
 const panel={left:width*.58,right:width-8,top:84,bottom:height-8},v=modelViewport(width,height,[panel],72);
 assert.equal(v.top,84);assert(v.right<panel.left);assert(v.bottom-v.top>=200,'landscape retains model height beside the lesson');
}
assert.equal(modelViewport(390,844,[],176).top,188,'framing clears the visible toolbar');
console.log('PASS: separate destinations, anatomy-first cards, collapsed controls and model framing at desktop/tablet/mobile, including short landscape screens and toolbar clearance.');
