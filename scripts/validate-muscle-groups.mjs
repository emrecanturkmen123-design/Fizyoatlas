import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {Button} from '../components/ui/button.tsx';
import {Disclosure} from '../app/disclosure.tsx';
import {MUSCLE_GROUPS} from '../app/attachments.ts';
import {elementsFor,MUSCLES} from '../app/education-data.ts';
import {requiredChunks} from '../app/model-demand.ts';
import {muscleGroupFor,thighStudyState} from '../app/muscle-group-study.ts';
import {structureCoverage} from '../app/coverage.tsx';
import {buildSearchIndex,querySearch} from '../app/anatomy-search.ts';
import {sideOf} from '../app/innervation.ts';
import {selectionPalette,muscleSelectionColor} from '../app/selection-palette.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
const buffers=new Map();
for(const [key,group] of Object.entries(MUSCLE_GROUPS)){
 assert.equal(querySearch(buildSearchIndex(atlas),key)[0].name,group.name);
 for(const side of ['left','right']){
  const name=(side==='left'?'Left ':'Right ')+group.name;
  assert.equal(muscleGroupFor(name).key,key);
  const ids=elementsFor(atlas,group.keys).filter(id=>sideOf(atlas.parts.find(p=>p.id===id).name)===side);
  assert.equal(ids.length,4,'four source meshes on each side, including both biceps femoris heads');
  assert(structureCoverage(atlas,name,ids).card);
  const state={selected:ids,rotate:false,reset:0,...thighStudyState(name)},chunks=requiredChunks(atlas,state);
  assert.equal(state.view,key==='quadriceps'?'front':'back');
  for(const id of ids){
   const p=atlas.parts.find(p=>p.id===id);assert(chunks.includes(p.chunk));assert(!state.hidden.includes(id));
   if(!buffers.has(p.chunk))buffers.set(p.chunk,fs.readFileSync('public'+atlas.chunks[p.chunk].url));
   const data=buffers.get(p.chunk);assert(p.vertexCount>0&&p.indexCount>0);assert(p.indices+p.indexCount*4<=data.length);
   const bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];
   for(let i=0;i<p.vertexCount*3;i++){const v=data.readFloatLE(p.positions+i*4);assert(Number.isFinite(v));bounds[0][i%3]=Math.min(bounds[0][i%3],v);bounds[1][i%3]=Math.max(bounds[1][i%3],v);}
   for(let axis=0;axis<3;axis++){assert(bounds[0][axis]>=p.bounds[0][axis]-.000001&&bounds[1][axis]<=p.bounds[1][axis]+.000001,'camera bounds contain the simplified source mesh');assert(bounds[1][axis]>bounds[0][axis]);}
   for(let i=0;i<p.indexCount;i++)assert(data.readUInt32LE(p.indices+i*4)<p.vertexCount);
  }
  assert.equal(state.hidden.length,0,'the full reference body stays available by default');
 }
}
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
const sideSelect=()=>root.root.findAll(n=>n.type==='select'&&n.props['aria-label']==='Kas grubunun tarafı')[0];
const button=label=>buttons().find(b=>text(b).replace(/^\d+\.\s*/, '').startsWith(label));
const click=async label=>{assert(button(label),label);await act(async()=>button(label).props.onClick());await settle();};
const mount=async hash=>{app=browser(hash);globalThis.window=app;globalThis.location=app.location;globalThis.history=app.history;await act(async()=>{root=create(React.createElement(Home));});await settle();};
const scene=()=>globalThis.sceneProps.state;
const assertGroup=(key,side)=>{
 const group=MUSCLE_GROUPS[key],ids=elementsFor(atlas,group.keys).filter(id=>!side||sideOf(atlas.parts.find(p=>p.id===id).name)===side);
 assert.deepEqual(new Set(scene().selected),new Set(ids));
 assert.equal(sideSelect().props.value,side??'both');
 assert.equal(scene().view,key==='quadriceps'?'front':'back');assert(scene().contextOpacity<1);assert(scene().focus>0);assert.equal(scene().explode,0);
 const route=parseWorkspaceRoute(app.location.hash);assert.equal(route.muscle,key);assert.equal(route.side,side);
 assert(button(group.name).props['aria-pressed']);
 assert(!text(root.toJSON()).includes('Bu kasın ayrıntılı eğitim kartı henüz eklenmedi'));
 for(const k of group.keys)assert(button(MUSCLES.find(m=>m.key===k).name));
 const swatches=root.root.findAll(n=>n.type==='span'&&n.props.className==='selection-swatch');assert.equal(swatches.length,group.keys.length);assert.deepEqual(swatches.map(n=>n.props.style.backgroundColor),group.keys.map(muscleSelectionColor));assert.equal(selectionPalette(atlas,scene()).members.length,group.keys.length);
};
for(const key of Object.keys(MUSCLE_GROUPS)){
 await mount('#atlas');await click(MUSCLE_GROUPS[key].name);assertGroup(key,undefined);
 await act(async()=>sideSelect().props.onChange({target:{value:'left'}}));await settle();assertGroup(key,'left');
 const hash=app.location.hash;
 await act(async()=>root.unmount());await act(async()=>{root=create(React.createElement(Home));});await settle();assert.equal(app.location.hash,hash);assertGroup(key,'left');
 const member=key==='quadriceps'?'vastus intermedius':'biceps femoris';
 const memberButton=buttons().find(b=>text(b).includes(MUSCLES.find(m=>m.key===member).name)&&text(b).includes('3D model ve bilgi kartı'));assert(memberButton);
 await act(async()=>memberButton.props.onClick());await settle();
 assert.equal(parseWorkspaceRoute(app.location.hash).muscle,member);assert.equal(parseWorkspaceRoute(app.location.hash).side,'left');
 assert(scene().selected.every(id=>sideOf(atlas.parts.find(p=>p.id===id).name)==='left'));assert.equal(scene().selected.length,key==='quadriceps'?1:2);
 assert.equal(scene().hidden.length,0);assert.equal(scene().isolate,false);assert(scene().contextOpacity>0&&scene().contextOpacity<1,'deep member retains transparent body context');
 await act(async()=>buttons().find(b=>b.props['aria-label']==='Önceki bölüme dön').props.onClick());await settle();assertGroup(key,'left');
 await act(async()=>sideSelect().props.onChange({target:{value:'right'}}));await settle();assertGroup(key,'right');
 await act(async()=>sideSelect().props.onChange({target:{value:'both'}}));await settle();assertGroup(key,undefined);
 // Optional isolation persists on refresh, side changes and browser back.
 await click('Yalnız grubu göster');assert(scene().isolate);assert(parseWorkspaceRoute(app.location.hash).isolate);
 await act(async()=>root.unmount());await act(async()=>{root=create(React.createElement(Home));});await settle();assert(scene().isolate);
 await act(async()=>sideSelect().props.onChange({target:{value:'left'}}));await settle();assert(scene().isolate);assertGroup(key,'left');
 const pick=buttons().find(b=>text(b).includes(MUSCLES.find(m=>m.key===member).name)&&text(b).includes('3D model ve bilgi kartı'));
 await act(async()=>pick.props.onClick());await settle();assert(!scene().isolate);assert(!parseWorkspaceRoute(app.location.hash).isolate);
 await act(async()=>buttons().find(b=>b.props['aria-label']==='Önceki bölüme dön').props.onClick());await settle();assert(scene().isolate);assertGroup(key,'left');
 await click('Ana modelde göster');assert(!scene().isolate);assert(!parseWorkspaceRoute(app.location.hash).isolate);assert.equal(scene().hidden.length,0);
 // Leaving the local thigh study must restore distant anatomy.
 await click('M. deltoid');assert.equal(scene().hidden.length,0);assert(scene().selected.length>0);assert(scene().focus>0);
 await act(async()=>root.unmount());
 // A sided deep link must retain group identity and its attachment controls.
 await mount(workspaceHash({lesson:'study',muscle:key,side:'right',attachment:'both'}));
 assert.equal(parseWorkspaceRoute(app.location.hash).muscle,key);assert.equal(scene().attachments.key,key);
 assert.equal(sideSelect().props.value,'right');assert.equal(scene().selected.filter(id=>atlas.parts.find(p=>p.id===id).system==='muscular').length,4);
 const attachmentControls=()=>root.root.findAllByType(Disclosure).find(d=>d.props.title==='Origo ve insertioyu modelde göster').props.children.props;
 await act(async()=>attachmentControls().onChange({key,side:'left',mode:'both'}));await settle();
 assert.equal(parseWorkspaceRoute(app.location.hash).muscle,key);assert.equal(parseWorkspaceRoute(app.location.hash).side,'left');assert.equal(sideSelect().props.value,'left');
 assert(scene().selected.every(id=>sideOf(atlas.parts.find(p=>p.id===id).name)==='left'));
 await act(async()=>attachmentControls().onChange(undefined));await settle();assertGroup(key,'left');
 assert.equal(scene().hidden.length,0,'closing attachment markers retains the full reference body');
 await act(async()=>root.unmount());
}
console.log('PASS: 16 source meshes and indices, bilateral body context/chunk demand; real Home group cards, both/left/right, refresh, deep-member inspection, back and sided attachment deep links. GPU rendering and DOM portals are stubbed.');
