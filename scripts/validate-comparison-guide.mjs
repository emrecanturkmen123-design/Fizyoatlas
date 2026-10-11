import assert from 'node:assert/strict';
import React from 'react';
import {create,act} from 'react-test-renderer';
import Guide from '../app/comparison-guide.tsx';
import {comparisonGuide} from '../app/comparison-guide-data.ts';
import {MUSCLE_COMPARISON_PAIRS,MUSCLE_COMPARISON_ITEMS} from '../app/muscle-comparison.ts';
import {Button} from '../components/ui/button.tsx';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
globalThis.document={activeElement:null,addEventListener(){},removeEventListener(){}};
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?.children!==undefined?text(n.props.children):n?.children?text(n.children):'';
for(const pair of MUSCLE_COMPARISON_PAIRS){
 const left='muscle:'+pair.left,right='muscle:'+pair.right,guide=comparisonGuide(left,right);assert.deepEqual(guide,comparisonGuide(right,left));assert.equal(guide.questions.length,2);assert(guide.sources.every(s=>s.startsWith('https://')));
 let root,camera=0;await act(async()=>{root=create(React.createElement(Guide,{left,right,onCamera:()=>camera++}));});
 const button=label=>root.root.findAllByType(Button).find(b=>text(b)===label);
 const click=async label=>{assert(button(label),label);await act(async()=>button(label).props.onClick());};
 assert.equal(root.root.findAllByProps({className:'comparison-guide-content'}).length,0);
 await click('Birlikte incele');await click('Anatomik konumda incele');assert.equal(camera,1);await click('Açıklamayı gör');assert(text(root.toJSON()).includes(guide.observation));await click('Sonraki adım');assert(button('Sonraki adım').props.disabled);
 for(const [i,q] of guide.questions.entries()){
  const wrong=(q.answer+1)%q.options.length;await click(q.options[wrong]);assert(text(root.toJSON()).includes('Doğru yanıt: '+q.options[q.answer]));assert(root.root.findAllByProps({role:'status'}).length);assert(button(q.options[q.answer]).props.disabled,'first answer locked');await click(i===guide.questions.length-1?'Bitir':'Sonraki adım');
 }
 assert(text(root.toJSON()).includes('0 / 2'));await click('Yeniden çalış');assert(!text(root.toJSON()).includes('Çalışma tamamlandı'));await act(async()=>root.unmount());
}
for(const a of MUSCLE_COMPARISON_ITEMS)for(const b of MUSCLE_COMPARISON_ITEMS){const g=comparisonGuide(a.key,b.key);if(a.key===b.key){assert.equal(g,undefined);continue;}assert(g);for(const q of g.questions){assert(q.options[q.answer]);assert.equal(new Set(q.options).size,q.options.length);}}
console.log('PASS: six guided pairs in both directions, camera task, explanatory reveal, wrong-answer feedback, gating, first-answer lock, reset and arbitrary pair coverage.');
