import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {create,act} from 'react-test-renderer';
import Lab from '../app/anatomy-lab.tsx';
import {Button} from '../components/ui/button.tsx';
import {MUSCLES,muscleFor} from '../app/education-data.ts';
import {MUSCLE_COMPARISON_ITEMS,MUSCLE_COMPARISON_PAIRS,muscleComparisonItem,muscleComparisonSelection,muscleComparisonPalette,muscleComparisonFacts,suggestedMuscleComparison} from '../app/muscle-comparison.ts';
import {comparisonFrames} from '../app/comparison-options.ts';
import {cameraPoint} from '../app/anatomy-lab-geometry.ts';
import {sideOf} from '../app/innervation.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json')),parts=new Map(atlas.parts.map(p=>[p.id,p]));
assert.equal(MUSCLE_COMPARISON_ITEMS.length,42);assert.equal(new Set(MUSCLE_COMPARISON_ITEMS.map(x=>x.key)).size,42);assert.equal(MUSCLE_COMPARISON_PAIRS.length,6);
for(const item of MUSCLE_COMPARISON_ITEMS){
 assert(muscleComparisonItem(suggestedMuscleComparison(item.key)));assert.notEqual(suggestedMuscleComparison(item.key),item.key);
 for(const side of ['right','left']){
  const selection=muscleComparisonSelection(atlas,item.key,side);assert(selection.selected.length,item.key+' '+side);
  for(const key of item.keys)assert(selection.selected.some(id=>muscleFor(parts.get(id).name)?.key===key),'each group member has real source geometry: '+key);
  for(const id of selection.selected){const p=parts.get(id);assert.equal(p.system,'muscular');assert.equal(sideOf(p.name),side);assert(item.keys.includes(muscleFor(p.name)?.key));}
  for(const id of selection.context){const p=parts.get(id);assert.equal(p.system,'skeletal');assert(!sideOf(p.name)||sideOf(p.name)===side);}
 }
 for(const field of ['action','nerve','origin','insertion']){
  const facts=muscleComparisonFacts(item.key,field);assert.equal(facts.length,item.keys.length);
  for(const f of facts){const m=MUSCLES.find(m=>m.key===f.key);assert.equal(f.text,m[field]);assert.equal(f.source,m.source);assert.equal(f.additionalSource,m.additionalSource);assert(f.text);}
 }
}
for(const pair of MUSCLE_COMPARISON_PAIRS)for(const side of ['right','left']){
 const a=muscleComparisonSelection(atlas,'muscle:'+pair.left,side),b=muscleComparisonSelection(atlas,'muscle:'+pair.right,side);
 assert.equal(suggestedMuscleComparison('muscle:'+pair.left),'muscle:'+pair.right);
 const colors=muscleComparisonPalette(atlas,a.selected,b.selected),reverse=muscleComparisonPalette(atlas,b.selected,a.selected);
 assert.equal(new Set(colors.members.map(m=>m.color)).size,colors.members.length,'distinct group colors');
 for(const member of colors.members){assert.equal(reverse.members.find(m=>m.key===member.key).color,member.color);for(const id of member.ids)assert.equal(colors.partColors.get(id),member.color);}
 const opposite=side==='right'?'left':'right',oppositeColors=muscleComparisonPalette(atlas,muscleComparisonSelection(atlas,'muscle:'+pair.left,opposite).selected,muscleComparisonSelection(atlas,'muscle:'+pair.right,opposite).selected);
 for(const member of colors.members)assert.equal(oppositeColors.members.find(m=>m.key===member.key).color,member.color,'stable color across sides');
 for(const framing of ['centered','aligned']){
  const frames=comparisonFrames(atlas,a.selected,b.selected,framing);assert.equal(frames[0].span,frames[1].span,'same physical scale');
  if(framing==='aligned')assert.deepEqual(frames[0],frames[1],'same anatomical coordinates');
  for(const [index,ids] of [a.selected,b.selected].entries())for(const id of ids){
   const p=parts.get(id);for(const x of p.bounds.map(v=>v[0]))for(const y of p.bounds.map(v=>v[1]))for(const z of p.bounds.map(v=>v[2]))for(const yaw of [-180,-75,0,60,180])for(const pitch of [-80,0,75]){
    const q=cameraPoint([x,y,z],frames[index].center,yaw,pitch);assert(Math.abs(q[0])<=frames[index].span/2+1e-6);assert(Math.abs(q[1])<=frames[index].span/2+1e-6,'full selected bounds fit at every camera angle');
   }
  }
 }
}
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}})};
globalThis.document={activeElement:null,addEventListener(){},removeEventListener(){}};
let observed=0,disconnected=0;globalThis.ResizeObserver=class{observe(){observed++;}disconnect(){disconnected++;}};
globalThis.requestAnimationFrame=f=>setTimeout(f,0);globalThis.cancelAnimationFrame=clearTimeout;
const drawn={fills:0,colors:new Set(),labels:[]};
const context={scale(){},fillRect(){},beginPath(){},closePath(){},fill(){drawn.fills++;drawn.colors.add(this.fillStyle);},moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));},lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));},fillText(t){drawn.labels.push(t);}};
const nodeMock=e=>e.type==='canvas'?{clientWidth:480,clientHeight:350,getContext:()=>context}:e.type==='h2'?{focus(){}}:null;
let requests=0;globalThis.fetch=async url=>{requests++;return new Response(fs.readFileSync('public'+url));};
let root,route,opened;const props={atlas,initialRoute:{labKind:'muscles',structure:'muscle:quadriceps',compare:'muscle:hamstrings',side:'left'},onClose(){},onQuiz(){},onStructure:k=>opened=k,onRouteChange:r=>route=r};
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):'';
const button=label=>root.root.findAllByType(Button).find(b=>text(b)===label),select=label=>root.root.findAll(n=>(n.type==='select'||n.type==='input')&&n.props['aria-label']===label)[0];
const disclosure=async label=>{const trigger=root.root.findAllByType('button').find(b=>b.props['data-slot']==='collapsible-trigger'&&text(b).startsWith(label));assert(trigger,label);await act(async()=>trigger.props.onClick({nativeEvent:new Event('click')}));};
const settle=async()=>{for(let i=0;i<100;i++){await act(async()=>{await new Promise(r=>setTimeout(r,10));});if(!root.root.findAllByProps({role:'status'}).some(n=>text(n).includes('Kaynak yüzeyler hazırlanıyor')))return;}throw Error('Model loading did not finish');};
await act(async()=>{root=create(React.createElement(Lab,props),{createNodeMock:nodeMock});});await settle();
assert.equal(root.root.findAllByType('canvas').length,2);assert(drawn.fills>100,'actual source triangles drawn');assert(drawn.labels.includes('3D kaynak yüzeylerinin izdüşümü'));
const initialColors=muscleComparisonPalette(atlas,muscleComparisonSelection(atlas,'muscle:quadriceps','left').selected,muscleComparisonSelection(atlas,'muscle:hamstrings','left').selected);
for(const member of initialColors.members)assert(drawn.colors.has(member.color),'source faces use the labeled member color');
assert.equal(root.root.findAllByProps({'aria-label':'Seçilen kasların renkleri'}).length,2);
assert(root.root.findAllByType('th').some(n=>text(n)==='Hareket katkısı'));assert(root.root.findAllByType('th').some(n=>text(n)==='Motor innervasyon'));
await disclosure('Origo, insertio ve kaynakları karşılaştır');assert(root.root.findAllByType('th').some(n=>text(n)==='Origo'));
assert(root.root.findAllByType('a').some(n=>n.props.href===MUSCLES.find(m=>m.key==='biceps femoris').additionalSource),'short-head source retained');
await act(async()=>select('Hazır kas çifti').props.onChange({target:{value:'calf'}}));await settle();assert.equal(route.structure,'muscle:gastrocnemius');assert.equal(route.compare,'muscle:soleus');
await act(async()=>select('İncelenen taraf').props.onChange({target:{value:'right'}}));await settle();assert.equal(route.side,'right');assert(root.root.findAllByType('figcaption').every(c=>text(c).startsWith('Sağ')));
await disclosure('Kamera ve çevre yapılar');
await act(async()=>select('Ortak kamera dönüşü').props.onChange({target:{value:'65'}}));await act(async()=>select('Ortak kamera eğimi').props.onChange({target:{value:'-35'}}));await act(async()=>button('Anatomik konum').props.onClick());
const saved=parseWorkspaceRoute(workspaceHash({lesson:'lab',...route}));assert.equal(saved.labKind,'muscles');assert.equal(saved.yaw,65);assert.equal(saved.pitch,-35);
await act(async()=>root.root.findAllByType(Button).find(b=>text(b)==='Atlas kartını aç').props.onClick());assert.equal(opened,'muscle:gastrocnemius');
await act(async()=>button('Bilgiyi karşılaştır').props.onClick());await settle();assert.equal(root.root.findAllByType('canvas').length,0);assert(root.root.findAllByType('table').length);assert(!select('Tendon karşılaştırması'));
await act(async()=>button('Bağ ve tendonlar').props.onClick());await settle();assert.equal(route.labKind,undefined);assert(!route.structure.startsWith('muscle:'));
await act(async()=>button('Kaslar').props.onClick());await settle();assert.equal(route.structure,'muscle:quadriceps');assert(!button('Kaynak model kesiti'));
await act(async()=>root.unmount());await act(async()=>{root=create(React.createElement(Lab,{...props,initialRoute:saved}),{createNodeMock:nodeMock});});await settle();
await disclosure('Kamera ve çevre yapılar');
assert.equal(select('Hazır kas çifti').props.value,'calf');assert.equal(select('Ortak kamera dönüşü').props.value,65);assert.equal(select('Ortak kamera eğimi').props.value,-35);assert.equal(button('Anatomik konum').props['aria-pressed'],true);assert.equal(root.root.findAllByType('canvas').length,2);
await act(async()=>root.unmount());assert.equal(observed,disconnected,'source canvas observers cleaned up');assert(requests>0);
console.log('PASS: all 42 muscles/groups on both sides, six presets, exact published facts and sources, distinct stable member colors, shared physical scale and full rotational framing; real source Canvas 2D drawing, controls, kind/mode switching, card callbacks and deep-link reload. Browser pixels and GPU are not tested.');
