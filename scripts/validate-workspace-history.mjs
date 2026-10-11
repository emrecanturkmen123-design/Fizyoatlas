import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {WorkspaceHistory,navigationIdentity,parentWorkspaceRoute} from '../app/workspace-history.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
import {Button} from '../components/ui/button.tsx';
function browser(hash){
 const events=new EventTarget(),entries=[{hash,state:{other:'preserved'}}];let index=0,backs=0;
 const location={get hash(){return entries[index].hash;},set hash(h){entries.splice(index+1);entries.push({hash:h,state:null});index++;events.dispatchEvent(new Event('hashchange'));},get href(){return 'https://atlas.test/'+this.hash;}};
 const navigate=delta=>{if(index+delta<0||index+delta>=entries.length)return;index+=delta;events.dispatchEvent(new Event('popstate'));events.dispatchEvent(new Event('hashchange'));};
 const history={get state(){return entries[index].state;},replaceState(state,title,h){entries[index]={hash:h,state};},pushState(state,title,h){entries.splice(index+1);entries.push({hash:h,state});index++;},back(){backs++;navigate(-1);},forward(){navigate(1);}};
 return {location,history,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),get entries(){return entries;},get backs(){return backs;}};
}
const b=browser('#atlas?tur=connective&bolge=knee'),h=new WorkspaceHistory(b);h.adopt();assert.equal(b.history.state.other,'preserved');assert(!h.hasPrevious);
const initial=b.location.hash,lab=workspaceHash({lesson:'lab',structure:'quadriceps tendon',compare:'patellar ligament',side:'left',labFrame:'aligned',yaw:65,labContext:false});h.write(lab);assert(h.hasPrevious);
for(let i=0;i<20;i++){const next={...parseWorkspaceRoute(lab),labMode:i%2?'clinical':'compare',yaw:i,zoom:1.5};assert.equal(navigationIdentity(next),navigationIdentity(parseWorkspaceRoute(lab)));h.write(workspaceHash(next),true);}
assert.equal(b.entries.length,2,'lab controls do not fill back history');const saved=b.location.hash;h.write('#test?tendon=quadriceps+tendon&taraf=sol');h.back(parseWorkspaceRoute(b.location.hash));h.adopt('popstate');assert.equal(b.location.hash,saved);b.history.forward();h.adopt('popstate');assert(b.location.hash.startsWith('#test'));h.back(parseWorkspaceRoute(b.location.hash));h.adopt('popstate');
const restored=new WorkspaceHistory(b);restored.adopt();restored.back(parseWorkspaceRoute(b.location.hash));restored.adopt('popstate');assert.equal(b.location.hash,initial,'refresh keeps previous workspace and filter');
const direct=browser('#inceleme?gosterim=section&taraf=sol'),deep=new WorkspaceHistory(direct);direct.addEventListener('popstate',()=>deep.adopt('popstate'));deep.adopt();deep.back(parseWorkspaceRoute(direct.location.hash));assert.equal(direct.location.hash,'#atlas');assert.equal(direct.backs,0,'deep links cannot leave the site');
assert.equal(parentWorkspaceRoute({lesson:'regional-course'}).lesson,'courses');assert.equal(parentWorkspaceRoute({lesson:'shoulder'}).lesson,'movements');assert.equal(parentWorkspaceRoute({lesson:'study'}),undefined);
const native=browser('#atlas'),nativeHistory=new WorkspaceHistory(native);nativeHistory.adopt();native.addEventListener('hashchange',()=>nativeHistory.adopt('hashchange'));native.location.hash='#inceleme';assert(nativeHistory.hasPrevious);assert.equal(native.entries.length,2,'native hash links use the existing entry');nativeHistory.back({lesson:'lab'});assert.equal(native.location.hash,'#atlas');
// Exercise the real Home route coordinator. Only GPU scene and DOM portals are stubs.
registerHooks({load(url,context,next){if(url.endsWith('.css'))return {format:'module',shortCircuit:true,source:'export default {};'};if(url.endsWith('/app/scene.tsx'))return {format:'module',shortCircuit:true,source:'export default function Scene(){return null;}'};
 if(url.endsWith('/components/ui/sheet.tsx'))return {format:'module',shortCircuit:true,source:`import React from 'react';export function Sheet({open,children}){return open?children:null;}export const SheetContent=React.forwardRef(({children},ref)=>React.createElement('section',{ref},children));export const SheetTitle=React.forwardRef(({children},ref)=>React.createElement('h2',{ref},children));export function SheetDescription({children}){return React.createElement('p',{},children);}`};return next(url,context);}});
const {default:Home}=await import('../app/page.tsx');const {default:Lab}=await import('../app/anatomy-lab.tsx');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;const app=browser(initial);globalThis.window=app;globalThis.location=app.location;globalThis.history=app.history;
globalThis.document={activeElement:null,addEventListener(){},removeEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},getElementById(){return null;}};
globalThis.HTMLInputElement=class{};globalThis.HTMLTextAreaElement=class{};
globalThis.requestAnimationFrame=f=>setTimeout(f,0);globalThis.cancelAnimationFrame=clearTimeout;globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};globalThis.localStorage=storage();globalThis.sessionStorage=storage();
globalThis.fetch=async url=>url.startsWith('/models/')?new Response(fs.readFileSync('public'+url)):new Response('{}',{status:401});
let root;const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n?.props?text(n.props.children):'';
const settle=async()=>{for(let i=0;i<5;i++)await act(async()=>{await new Promise(r=>setTimeout(r,20));});};
const buttons=()=>root.root.findAllByType(Button);const back=()=>buttons().find(x=>x.props['aria-label']==='Önceki bölüme dön');const select=label=>root.root.findAll(n=>(n.type==='select'||n.type==='input')&&n.props['aria-label']===label)[0];
await act(async()=>{root=create(React.createElement(Home));});await settle();assert.equal(select('Atlas bölgesi').props.value,'knee');assert(!buttons().some(b=>text(b)==='Dizi baştan sona öğren'));
await act(async()=>buttons().find(b=>text(b)==='Karşılaştırma').props.onClick());await settle();assert.equal(app.entries.length,2,'lab defaults replace the entry');assert(root.root.findByType(Lab));
await act(async()=>select('İncelenen taraf').props.onChange({target:{value:'left'}}));await settle();await act(async()=>buttons().find(b=>text(b)==='Bilgiyi karşılaştır').props.onClick());await settle();
await act(async()=>select('Tendon karşılaştırması').props.onChange({target:{value:'achilles-location'}}));await settle();assert.equal(app.entries.length,2);const beforeQuiz=app.location.hash;
await act(async()=>buttons().find(b=>text(b).endsWith(' · 5 soru')).props.onClick());await settle();assert.equal(parseWorkspaceRoute(app.location.hash).lesson,'quiz');assert.equal(parseWorkspaceRoute(app.location.hash).side,'left');
await act(async()=>back().props.onClick());await settle();assert.equal(app.location.hash,beforeQuiz,'actual quiz back restores the exact lab snapshot');assert.equal(select('İncelenen taraf').props.value,'left');assert.equal(select('Tendon karşılaştırması').props.value,'achilles-location');
await act(async()=>app.history.forward());await settle();assert.equal(parseWorkspaceRoute(app.location.hash).lesson,'quiz');await act(async()=>back().props.onClick());await settle();
await act(async()=>back().props.onClick());await settle();assert.equal(app.location.hash,initial);assert.equal(select('Atlas bölgesi').props.value,'knee');assert(buttons().some(b=>b.props['aria-pressed']&&text(b)==='Bağ / tendon'));
// Opening and closing search must keep the previous route.
await act(async()=>buttons().find(b=>b.props['aria-label']==='Yapı ara').props.onClick());await settle();assert.equal(app.location.hash,initial);await act(async()=>back().props.onClick());await settle();assert.equal(app.location.hash,initial);assert.equal(select('Atlas bölgesi').props.value,'knee');
await act(async()=>root.unmount());
console.log('PASS: app history state, deep-link fallback without leaving site, native anchors, replace controls, refresh/back/forward; actual Home Atlas → lab → left clinical comparison → quiz → lab → filtered Atlas and search return. GPU scene/DOM portals are stubbed.');
