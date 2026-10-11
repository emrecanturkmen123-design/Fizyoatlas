import assert from 'node:assert/strict';
import fs from 'node:fs';
import {registerHooks} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
import {Button} from '../components/ui/button.tsx';
import {Select} from '../components/ui/select.tsx';
import HandPanel from '../app/hand-panel.tsx';
import {handPose} from '../app/hand-motion.ts';
import ShoulderPanel from '../app/shoulder-panel.tsx';
import ElbowPanel from '../app/elbow-panel.tsx';
import KneePanel from '../app/knee-panel.tsx';
import LowerPanel from '../app/lower-panel.tsx';
import GaitPanel from '../app/gait-panel.tsx';
import {elementsFor} from '../app/education-data.ts';
import {movementLesson,inspectMovement} from '../app/movement-inspection.ts';
import {poseMatrices} from '../app/shoulder-motion.ts';
import {elbowMatrices} from '../app/elbow-motion.ts';
import {kneeMatrices} from '../app/knee-motion.ts';
import {GAIT_PHASES} from '../app/gait-data.ts';
import {gaitPhase} from '../app/gait-motion.ts';
import {posedSelectionBounds,frameModelBounds} from '../app/model-framing.ts';
import {Box3,Group,Mesh,BoxGeometry,MeshBasicMaterial,PerspectiveCamera,Vector3} from 'three';
import {lowerMatrices} from '../app/lower-motion.ts';
import {parseWorkspaceRoute,workspaceHash} from '../app/workspace-route.ts';
import {sideOf,matchesMuscle} from '../app/innervation.ts';
const atlas=JSON.parse(fs.readFileSync('public/models/atlas.json'));
function browser(hash){
 const events=new EventTarget(),entries=[{hash,state:{other:'preserved'}}];let index=0,backs=0;
 const location={get hash(){return entries[index].hash;},set hash(h){entries.splice(index+1);entries.push({hash:h,state:null});index++;events.dispatchEvent(new Event('hashchange'));},get href(){return 'https://atlas.test/'+this.hash;}};
 const navigate=delta=>{if(index+delta<0||index+delta>=entries.length)return;index+=delta;events.dispatchEvent(new Event('popstate'));events.dispatchEvent(new Event('hashchange'));};
 const history={get state(){return entries[index].state;},replaceState(state,title,h){entries[index]={hash:h,state};},pushState(state,title,h){entries.splice(index+1);entries.push({hash:h,state});index++;},back(){backs++;navigate(-1);},forward(){navigate(1);}};
 return {location,history,addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),get entries(){return entries;},get backs(){return backs;}};
}
registerHooks({load(url,context,next){if(url.endsWith('.css'))return {format:'module',shortCircuit:true,source:'export default {};'};if(url.endsWith('/app/scene.tsx'))return {format:'module',shortCircuit:true,source:'export default function Scene(props){globalThis.sceneProps=props;return null;}'};
 if(url.endsWith('/components/ui/sheet.tsx'))return {format:'module',shortCircuit:true,source:`import React from 'react';export function Sheet({open,children,onOpenChange}){return open?React.createElement('section',{'data-test-sheet':true,onOpenChange},children):null;}export const SheetContent=React.forwardRef(({children},ref)=>React.createElement('section',{ref},children));export const SheetTitle=React.forwardRef(({children},ref)=>React.createElement('h2',{ref},children));export function SheetDescription({children}){return React.createElement('p',{},children);}`};return next(url,context);}});
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
const button=label=>buttons().find(b=>text(b).replace(/^\d+\.\s*/, '').includes(label));
const click=async label=>{assert(button(label),label);await act(async()=>button(label).props.onClick());await settle();};
const mount=async hash=>{app=browser(hash);globalThis.window=app;globalThis.location=app.location;globalThis.history=app.history;await act(async()=>{root=create(React.createElement(Home));});await settle();};
const scene=()=>globalThis.sceneProps.state;


const pose=s=>s.hand??s.shoulder??s.elbow??s.knee??s.lower??s.gait;
const matrix=s=>s.hand?{upper:handPose(atlas,s.hand).wrist}:s.shoulder?poseMatrices(atlas,s.shoulder):s.elbow?elbowMatrices(atlas,s.elbow):s.knee?kneeMatrices(atlas,s.knee):s.lower?lowerMatrices(atlas,s.lower):undefined;
const assertPose=(expected,lesson)=>{
 assert.equal(movementLesson(scene()),lesson,'inspection stays in movement');
 assert.deepEqual(pose(scene()),{...expected,playing:false},'all movement options and position retained');
 assert.equal(root.root.findByType('main').props['data-workspace'],'movements');
 assert.equal(parseWorkspaceRoute(app.location.hash).lesson,lesson);
 assert(!root.root.findAllByProps({'aria-label':'Hareket çalışmaları'}).length,'no movement menu over model');
};
const rows=[
 ['hand','finger-flexion','flexor digitorum profundus',HandPanel],
 ['shoulder','abduction','deltoid',ShoulderPanel],
 ['elbow','flexion','biceps brachii',ElbowPanel],
 ['knee','flexion','biceps femoris',KneePanel],
 ['hip','flexion','rectus femoris',LowerPanel],
 ['ankle','plantarflexion','soleus',LowerPanel],
 ['gait',undefined,'soleus',GaitPanel]
];
let cases=0;
for(const [lesson,motion,rowKey,Panel] of rows)for(const side of ['left','right']){
 await mount(workspaceHash({lesson,motion,progress:63,side:lesson==='gait'?undefined:side,motionMuscles:true,motionLayers:lesson==='gait'?['plane','fast']:lesson==='shoulder'?['plane','antagonists','cuff','tendons','scapula']:['plane','antagonists','tendons']}));
 assert.equal(pose(scene()).progress,63);
 if(lesson!=='gait'){await act(async()=>root.root.findByType(Panel).props.onChange({...pose(scene()),progress:71}));}
 const before={...pose(scene())};const beforeMatrix=matrix(scene());const beforeReset=scene().reset,view=scene().view;
 const key=lesson==='gait'?GAIT_PHASES[gaitPhase((63+(side==='left'?50:0))%100)].keys.find(k=>elementsFor(atlas,[k]).some(id=>sideOf(atlas.parts.find(p=>p.id===id).name)===side)):rowKey;assert(key);
 const id=elementsFor(atlas,[key]).find(id=>sideOf(atlas.parts.find(p=>p.id===id).name)===side);assert(id,key);
 await act(async()=>globalThis.sceneProps.onSelect(id));await settle();
 assertPose(before,lesson);assert.deepEqual(scene().selected,[id]);assert.equal(scene().reset,beforeReset);assert.equal(scene().view,view);
 if(beforeMatrix)assert.deepEqual(matrix(scene()).upper.elements,beforeMatrix.upper.elements,'posed bone matrix unchanged');
 assert.equal(parseWorkspaceRoute(app.location.hash).concept,id,'exact clicked source mesh saved');
 assert(parseWorkspaceRoute(app.location.hash).motionMuscles,'muscle overlay survives navigation');
 const deep=app.location.hash;
 await click('Modelde göster');assertPose(before,lesson);
 await act(async()=>root.root.findAllByProps({'data-test-sheet':true})[0].props.onOpenChange(false));await settle();
 assert.equal(pose(scene()).progress,before.progress);assert.equal(parseWorkspaceRoute(app.location.hash).concept,undefined);assert(root.root.findByType(Panel));
 assert(lesson==='gait'?scene().gait.muscles:pose(scene()).anatomicalMuscles,'muscle overlay stays visible on return');
 await act(async()=>app.history.forward());await settle();assert.equal(app.location.hash,deep);assertPose(before,lesson);assert.deepEqual(scene().selected,[id]);
 await act(async()=>root.unmount());await mount(deep);assertPose(before,lesson);assert.deepEqual(scene().selected,[id]);
 // A direct card URL has no prior history. Close falls back to this same movement,
 // not the neutral Atlas or an external history entry.
 await act(async()=>root.root.findAllByProps({'data-test-sheet':true})[0].props.onOpenChange(false));await settle();
 assert.equal(parseWorkspaceRoute(app.location.hash).concept,undefined);assert.equal(pose(scene()).progress,before.progress);assert(root.root.findByType(Panel));
 // The movement panel's muscle link uses the same path and the selected side.
 await act(async()=>{const props=root.root.findByType(Panel).props;if(lesson==='shoulder')props.onMuscle(undefined,key);else props.onMuscle(key);});await settle();
 assert.equal(movementLesson(scene()),lesson);assert.equal(pose(scene()).progress,before.progress);assert(scene().selected.length);
 if(lesson!=='gait')assert(scene().selected.every(id=>sideOf(atlas.parts.find(p=>p.id===id).name)===side));
 await act(async()=>root.unmount());cases++;
}
// A playing movement pauses for inspection without advancing or losing its options.
const moving={explode:0,visible:['skeletal'],selected:[],isolate:false,view:'side',rotate:false,reset:5,knee:{id:'flexion',side:'left',motion:true,progress:72,playing:true,anatomicalMuscles:true,plane:true,antagonists:true,tendons:true}};
const paused=inspectMovement(moving,['sample']);assert.equal(paused.knee.playing,false);assert.equal(paused.knee.progress,72);assert.equal(paused.knee.plane,true);assert.equal(paused.reset,5);

// A focus request frames the transformed, deformed geometry of the clicked mesh.
const group=new Group(),mesh=new Mesh(new BoxGeometry(1,2,1),new MeshBasicMaterial());mesh.userData.partId='source';group.add(mesh);group.position.set(3,1,-2);mesh.geometry.translate(0,2,0);mesh.rotation.z=.6;
const bounds=posedSelectionBounds([group],new Set(['source']));assert(!bounds.isEmpty());assert(bounds.getCenter(new Vector3()).distanceTo(new Vector3(0,0,0))>3);
const camera=new PerspectiveCamera(40,1.5,.01,40),viewport={left:0,right:900,top:0,bottom:600};assert(frameModelBounds(camera,bounds,viewport,900,600,new Vector3(1,.1,1)));camera.updateMatrixWorld(true);
for(let i=0;i<8;i++){const p=new Vector3(i&1?bounds.max.x:bounds.min.x,i&2?bounds.max.y:bounds.min.y,i&4?bounds.max.z:bounds.min.z).project(camera);assert(Math.abs(p.x)<=1&&Math.abs(p.y)<=1,'posed bounds fit inside viewport');}
mesh.visible=false;assert(posedSelectionBounds([group],new Set(['source'])).isEmpty());mesh.visible=true;assert(posedSelectionBounds([group],new Set(['other'])).isEmpty());mesh.geometry.dispose();mesh.material.dispose();

console.log(`PASS: ${cases} real Home flows across hand, shoulder, elbow, knee, hip, ankle and gait; source mesh click, exact pose/side/options and bone matrices, card focus, close, back/forward, fresh deep links and panel muscle links. GPU/DOM portals stubbed; browser pixels not tested.`);
