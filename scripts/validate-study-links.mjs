import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {Button} from '../components/ui/button.tsx';
import {MUSCLES} from '../app/education-data.ts';
import {muscleLessons} from '../app/muscle-lessons.ts';
import {NERVES,nerveParts,targetParts} from '../app/innervation.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
import {parseRegionalCourse,regionalDraftKey} from '../app/regional-course-data.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
for(const m of MUSCLES)assert(muscleLessons(m.key).length,m.key+' has a learning path');
const source=JSON.parse(fs.readFileSync('public/models/pectoral-nerves-source.json'));
assert.equal(source.parts.length,4);assert(source.verifiedBoneEnvelopeRmsMm<5);
const data=fs.readFileSync('public'+atlas.chunks[atlas.parts.find(p=>p.id===source.parts[0].id).chunk].url);
assert.equal(crypto.createHash('sha256').update(data).digest('hex'),source.sha256);
for(const r of source.parts){
 const p=atlas.parts.find(p=>p.id===r.id);assert.equal(p.system,'nervous');assert(p.indexCount>0&&p.vertexCount>0);
 for(const [field,size,hash] of [['positions',p.vertexCount*12,'positionsSHA256'],['normals',p.vertexCount*6,'normalsSHA256'],['indices',p.indexCount*4,'indicesSHA256']])assert.equal(crypto.createHash('sha256').update(data.subarray(p[field],p[field]+size)).digest('hex'),r[hash]);
 for(let i=0;i<p.vertexCount*3;i++)assert(Number.isFinite(data.readFloatLE(p.positions+i*4)));
 for(let i=0;i<p.indexCount;i++)assert(data.readUInt32LE(p.indices+i*4)<p.vertexCount);
}
for(const id of ['lateral-pectoral','medial-pectoral'])for(const side of ['left','right'])assert.equal(nerveParts(atlas,NERVES.find(n=>n.id===id),side).length,1);
const old=JSON.parse(execFileSync('git',['show','HEAD:public/models/atlas.json'],{maxBuffer:30*1024*1024}));
assert.deepEqual(atlas.parts.slice(0,old.parts.length),old.parts,'all existing geometry descriptors unchanged');
assert.deepEqual(atlas.chunks.slice(0,old.chunks.length),old.chunks,'all existing chunks unchanged');
for(const chunk of old.chunks)assert.deepEqual(fs.readFileSync('public'+chunk.url),execFileSync('git',['show','HEAD:public'+chunk.url],{maxBuffer:30*1024*1024}));
const tests=['serratus anterior','gluteus minimus','tibialis posterior','fibularis longus','fibularis brevis','flexor carpi radialis','flexor carpi ulnaris','extensor carpi radialis longus','extensor carpi radialis brevis'];
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

for(const key of tests){
 const initial=workspaceHash({lesson:'study',muscle:key,side:'left'}),link=muscleLessons(key)[0];
 await mount(initial);await click('Hareketini incele');
 let route=parseWorkspaceRoute(app.location.hash);assert.equal(route.lesson,link.lesson);assert.equal(route.side,'left');
 if(link.lesson==='regional-course'){
  assert.equal(route.courseId,link.id);assert.equal(route.courseStep,'motion');assert.equal(route.courseMotion,link.stop);
  const saved=parseRegionalCourse(JSON.parse(sessionStorage.getItem(regionalDraftKey(link.id))));assert(saved);assert.equal(saved.motionStop,link.stop);assert.equal(saved.side,'left');assert.equal(saved.checks.length,3);
 }else assert.equal(route.motion,link.id);
 const deepLink=app.location.hash;
 await act(async()=>buttons().find(b=>b.props['aria-label']==='Önceki bölüme dön').props.onClick());await settle();assert.equal(parseWorkspaceRoute(app.location.hash).muscle,key);
 await act(async()=>app.history.forward());await settle();assert.equal(app.location.hash,deepLink);
 await act(async()=>root.unmount());await act(async()=>{root=create(React.createElement(Home));});await settle();assert.equal(app.location.hash,deepLink);await act(async()=>root.unmount());
}
await mount(workspaceHash({lesson:'study',tab:'nerves',nerve:'inferior-gluteal',side:'left'}));
assert.deepEqual(new Set(scene().selected),new Set(targetParts(atlas,NERVES.find(n=>n.id==='inferior-gluteal'),'left').map(p=>p.id)));
assert(scene().selected.length);assert(!scene().visible.includes('nervous'));
await act(async()=>root.unmount());
assert.equal(parseWorkspaceRoute('#bolge-dersi?kurs=hand-foundations&durak=999').courseMotion,undefined);
assert.equal(parseWorkspaceRoute('#bolge-dersi?kurs=hand-foundations&durak=-1').courseMotion,undefined);
console.log('PASS: all 40 muscle cards have learning paths; nine actual Home links preserve side, stop, refresh/back/forward; four source nerves, array hashes and unchanged previous chunks; honest inferior gluteal muscle fallback. GPU and visual device rendering are not tested.');
