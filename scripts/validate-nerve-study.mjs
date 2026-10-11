import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {Button} from '../components/ui/button.tsx';
import {NERVES,nerveParts,targetParts,sideOf} from '../app/innervation.ts';
import {nerveStudySelection} from '../app/nerve-study.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const n of NERVES)for(const side of [undefined,'left','right'])for(const requested of ['nerve','targets']){
 const s=nerveStudySelection(atlas,n,side,requested),meshes=nerveParts(atlas,n,side),expected=requested==='nerve'&&meshes.length?meshes:targetParts(atlas,n,side);
 assert.deepEqual(new Set(s.selected),new Set(expected.map(p=>p.id)));assert(s.selected.length,n.id+' has source selection');
 if(side)assert(s.selected.every(id=>sideOf(atlas.parts.find(p=>p.id===id).name)===side));
 assert.equal(s.focus,requested==='nerve'&&meshes.length?'nerve':'targets');
 assert.equal(s.visible.includes('nervous'),s.focus==='nerve');
 assert.equal(s.view,n.id.includes('gluteal')?'back':'front');
}
assert.equal(parseWorkspaceRoute('#atlas?sinir=femoral&sinirgosterim=invalid').nerveFocus,undefined);
assert.equal(parseWorkspaceRoute('#atlas?sinirgosterim=kaslar').nerveFocus,undefined);
function browser(hash){
 const events=new EventTarget(),entries=[{hash,state:{other:'preserved'}}];let index=0,backs=0;
 const location={get hash(){return entries[index].hash;},set hash(h){entries.splice(index+1);entries.push({hash:h,state:null});index++;events.dispatchEvent(new Event('hashchange'));},get href(){return 'https://atlas.test/'+this.hash;}};
 const navigate=delta=>{if(index+delta<0||index+delta>=entries.length)return;index+=delta;events.dispatchEvent(new Event('popstate'));events.dispatchEvent(new Event('hashchange'));};
 const history={get state(){return entries[index].state;},replaceState(state,title,h){entries[index]={hash:h,state};},pushState(state,title,h){entries.splice(index+1);entries.push({hash:h,state});index++;},back(){backs++;navigate(-1);},forward(){navigate(1);}};
 return {location,history,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),get entries(){return entries;},get backs(){return backs;}};
}
registerHooks({load(url,context,next){if(url.endsWith('.css'))return {format:'module',shortCircuit:true,source:'export default {};'};if(url.endsWith('/app/scene.tsx'))return {format:'module',shortCircuit:true,source:'export default function Scene(props){globalThis.sceneProps=props;return null;}'};
 if(url.endsWith('/components/ui/sheet.tsx'))return {format:'module',shortCircuit:true,source:`import React from 'react';export function Sheet({open,children}){return open?children:null;}export const SheetContent=React.forwardRef(({children},ref)=>React.createElement('section',{ref},children));export const SheetTitle=React.forwardRef(({children},ref)=>React.createElement('h2',{ref},children));export function SheetDescription({children}){return React.createElement('p',{},children);}`};return next(url,context);}});
globalThis.document={activeElement:null,addEventListener(){},removeEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},getElementById(){return null;}};
globalThis.HTMLInputElement=class{};globalThis.HTMLTextAreaElement=class{};
globalThis.requestAnimationFrame=f=>setTimeout(f,0);globalThis.cancelAnimationFrame=clearTimeout;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};globalThis.localStorage=storage();globalThis.sessionStorage=storage();
globalThis.fetch=async url=>url.startsWith('/models/')?new Response(fs.readFileSync('public'+url)):new Response('{}',{status:401});

const {default:Home}=await import('../app/page.tsx');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let root,app;
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):n?.children?text(n.children):'';
const settle=async()=>{for(let i=0;i<5;i++)await act(async()=>{await new Promise(r=>setTimeout(r,20));});};
const buttons=()=>root.root.findAllByType(Button);
const sideSelect=()=>root.root.findAll(n=>n.type==='select'&&n.props['aria-label']==='Sinir kartının tarafı')[0];
const button=label=>buttons().find(b=>text(b).replace(/^\d+\.\s*/, '').startsWith(label));
const click=async label=>{assert(button(label),label);await act(async()=>button(label).props.onClick());await settle();};
const mount=async hash=>{app=browser(hash);globalThis.window=app;globalThis.location=app.location;globalThis.history=app.history;await act(async()=>{root=create(React.createElement(Home));});await settle();};
const scene=()=>globalThis.sceneProps.state;

const changeSide=async side=>{assert(sideSelect());await act(async()=>sideSelect().props.onChange({target:{value:side}}));await settle();};
const assertSelection=(id,side,focus)=>{
 const n=NERVES.find(n=>n.id===id),expected=(focus==='nerve'?nerveParts:targetParts)(atlas,n,side).map(p=>p.id);
 assert.deepEqual(new Set(scene().selected),new Set(expected));
 const route=parseWorkspaceRoute(app.location.hash);assert.equal(route.nerve,id);assert.equal(route.side,side);assert.equal(route.nerveFocus,focus==='targets'?'targets':undefined);
 assert.equal(scene().visible.includes('nervous'),focus==='nerve');assert.deepEqual(scene().hidden,[]);assert.equal(scene().explode,0);
 assert.equal(sideSelect().props.value,side??'both');
 assert.equal(button('Kasları birlikte göster').props['aria-pressed'],focus==='targets');
 if(focus==='nerve')assert.equal(button('Sinirin kendisini göster').props['aria-pressed'],true);
};
await mount('#atlas?tur=nerves');await click('N. femoralis');const historyCount=app.entries.length;
assertSelection('femoral',undefined,'nerve');await changeSide('left');assertSelection('femoral','left','nerve');
await click('Kasları birlikte göster');assertSelection('femoral','left','targets');await changeSide('right');assertSelection('femoral','right','targets');
assert.equal(app.entries.length,historyCount,'side and display mode adjust the card without filling browser history');
const hash=app.location.hash;await act(async()=>root.unmount());await act(async()=>{root=create(React.createElement(Home));});await settle();
assert.equal(app.location.hash,hash);assertSelection('femoral','right','targets');
await act(async()=>app.history.back());await settle();assert.equal(parseWorkspaceRoute(app.location.hash).nerve,undefined);
await act(async()=>app.history.forward());await settle();assertSelection('femoral','right','targets');
await changeSide('both');assertSelection('femoral',undefined,'targets');await click('Sinirin kendisini göster');assertSelection('femoral',undefined,'nerve');
await act(async()=>root.unmount());
for(const id of ['inferior-gluteal','superior-gluteal']){
 await mount(workspaceHash({lesson:'study',tab:'nerves',nerve:id,side:'left'}));
 assert.equal(scene().view,'back');assertSelection(id,'left',id==='inferior-gluteal'?'targets':'nerve');
 await changeSide('right');assert.equal(scene().view,'back');assertSelection(id,'right',id==='inferior-gluteal'?'targets':'nerve');
 if(id==='inferior-gluteal'){assert(!button('Sinirin kendisini göster'));assert(root.root.findAllByType('p').some(p=>text(p).includes('ayrı 3D çizimi kaynak modelde yok')));}
 await act(async()=>root.unmount());
}
console.log('PASS: all 24 nerves on both sides use actual source IDs; actual Home side/display controls, refresh/back/forward and selected buttons; posterior gluteal view and explicit inferior gluteal source limitation. GPU not tested.');
