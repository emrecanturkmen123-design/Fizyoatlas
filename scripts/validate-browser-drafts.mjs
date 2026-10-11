import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {useKneeCourse} from '../app/use-knee-course.ts';
import {useRegionalCourse} from '../app/use-regional-course.ts';
import {useNotebookDrafts} from '../app/use-notebook-drafts.ts';
import {freshKneeCourse,parseKneeCourse} from '../app/knee-course-data.ts';
import {freshRegionalCourse,regionalDraftKey,parseRegionalCourse} from '../app/regional-course-data.ts';
import {REGIONAL_COURSES} from '../app/regional-course-content.ts';
import {readCourseDrafts} from '../app/course-overview.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const listeners=new Map();
globalThis.window={addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
function storage(){const data=new Map();return {data,fail:false,getItem:k=>data.get(k)??null,setItem(k,v){if(this.fail)throw Error('quota');data.set(k,v);},removeItem:k=>data.delete(k),clear:()=>data.clear()};}
globalThis.localStorage=storage();globalThis.sessionStorage=storage();
const guest=async()=>new Response('{}',{status:401});globalThis.fetch=guest;
async function hook(fn){let value,root;function Probe(){value=fn();return null;}await act(async()=>{root=create(React.createElement(Probe));});return {get value(){return value;},root};}

const courses=[{key:'atlas-knee-course-draft',fresh:freshKneeCourse,parse:parseKneeCourse,hook:useKneeCourse,structure:'femur'},...REGIONAL_COURSES.map(c=>({key:regionalDraftKey(c.id),fresh:()=>freshRegionalCourse(c.id),parse:parseRegionalCourse,hook:()=>useRegionalCourse(c.id),structure:c.structures[0].key}))];
for(const c of courses){
 const original={...c.fresh(),step:'motion',side:'left',observed:[c.structure]};
 sessionStorage.setItem(c.key,JSON.stringify(original));
 let h=await hook(c.hook);assert.deepEqual(h.value.progress.observed,original.observed);assert.equal(h.value.progress.side,'left');
 assert.equal(sessionStorage.getItem(c.key),null,'legacy removed after successful migration');assert(c.parse(JSON.parse(localStorage.getItem(c.key))));
 await act(async()=>h.value.save({...h.value.progress,step:'chain'}));await act(async()=>h.root.unmount());
 globalThis.sessionStorage=storage();h=await hook(c.hook);
 assert.equal(h.value.progress.step,'chain','a new tab restores the saved step');assert.deepEqual(h.value.progress.observed,original.observed);await act(async()=>h.root.unmount());
}
assert.equal(readCourseDrafts().length,6);

// Failed durable migration retains the recoverable tab copy and reports failed edits.
localStorage.clear();sessionStorage.setItem(courses[0].key,JSON.stringify({...freshKneeCourse(),observed:['femur']}));localStorage.fail=true;
let h=await hook(useKneeCourse);assert.deepEqual(h.value.progress.observed,['femur']);assert(sessionStorage.getItem(courses[0].key));
await act(async()=>h.value.save({...h.value.progress,step:'motion'}));assert.equal(h.value.status,'error');let warned=false;listeners.get('beforeunload')({preventDefault(){warned=true;}});assert(warned);
localStorage.fail=false;await act(async()=>h.value.retry());assert.equal(h.value.status,'guest');assert.equal(sessionStorage.getItem(courses[0].key),null);await act(async()=>h.root.unmount());

// Import cleanup follows a confirmed account write, and does not erase another tab's changes.
for(const c of [courses[0],courses[1]]){
 localStorage.clear();sessionStorage.clear();const draft={...c.fresh(),observed:[c.structure],step:'motion'};localStorage.setItem(c.key,JSON.stringify(draft));let fail=true,finish;
 globalThis.fetch=async(url,options)=>options?.method==='PUT'?(fail?new Response('{}',{status:503}):new Promise(resolve=>finish=resolve)):new Response(JSON.stringify({authenticated:true,progress:[c.fresh()]}));
 h=await hook(c.hook);assert(h.value.pendingDraft);await act(async()=>h.value.importDraft());assert.equal(h.value.status,'error');assert(localStorage.getItem(c.key),'failed import preserves guest draft');
 fail=false;await act(async()=>{void h.value.retry();});const changed={...draft,step:'chain'};localStorage.setItem(c.key,JSON.stringify(changed));
 await act(async()=>finish(new Response(JSON.stringify({progress:{...h.value.progress,revision:1}}))));assert.equal(h.value.status,'ready');assert.equal(JSON.parse(localStorage.getItem(c.key)).step,'chain','in-flight import keeps another tab edits');await act(async()=>h.root.unmount());
 localStorage.setItem(c.key,JSON.stringify(draft));globalThis.fetch=async(url,options)=>new Response(JSON.stringify(options?.method==='PUT'?{progress:{...draft,revision:1}}:{authenticated:true,progress:[c.fresh()]}));
 h=await hook(c.hook);await act(async()=>h.value.importDraft());assert.equal(localStorage.getItem(c.key),null,'confirmed unchanged import removes browser draft');await act(async()=>h.root.unmount());
}

for(const c of [courses[0],courses[1]]){
 localStorage.clear();sessionStorage.clear();const draft={...c.fresh(),observed:[c.structure],step:'motion'};localStorage.setItem(c.key,JSON.stringify(draft));let conflict=true;
 globalThis.fetch=async(url,options)=>options?.method==='PUT'?new Response(JSON.stringify({progress:conflict?{...c.fresh(),revision:2}:{...JSON.parse(options.body),revision:3}}),{status:conflict?409:200}):new Response(JSON.stringify({authenticated:true,progress:[c.fresh()]}));
 h=await hook(c.hook);await act(async()=>h.value.importDraft());assert(h.value.conflict);
 await act(async()=>h.value.useAccount());assert(!h.value.conflict);conflict=false;
 await act(async()=>h.value.save({...h.value.progress,step:'chain'}));assert(localStorage.getItem(c.key),'cancelled account import must not erase the browser draft on a later save');await act(async()=>h.root.unmount());
}

globalThis.fetch=guest;localStorage.clear();sessionStorage.clear();const A={id:'note-draft-A',title:'A',note:'Korunan not',collection:'',hash:'#diz',updatedAt:0,archived:false},B={...A,id:'note-draft-B',title:'B'};
sessionStorage.setItem('atlas-notebook-drafts-v2',JSON.stringify({entries:[A,B],active:A.id}));
h=await hook(()=>useNotebookDrafts([]));assert.equal(h.value.drafts.length,2);assert.equal(sessionStorage.getItem('atlas-notebook-drafts-v2'),null);
await act(async()=>h.value.setDraft({...h.value.draft,title:''}));await act(async()=>h.root.unmount());sessionStorage.clear();h=await hook(()=>useNotebookDrafts([]));assert.equal(h.value.draft.title,'');assert.equal(h.value.draft.note,A.note,'unfinished empty title does not discard a note');
// A second tab adds a draft; editing this tab must preserve it.
const saved=JSON.parse(localStorage.getItem('atlas-notebook-drafts-v2'));saved.entries.push({...A,id:'note-other-tab',title:'Diğer sekme'});localStorage.setItem('atlas-notebook-drafts-v2',JSON.stringify(saved));
await act(async()=>h.value.setDraft({...h.value.draft,note:'Yeni not'}));assert.equal(h.value.drafts.length,3);
localStorage.fail=true;await act(async()=>h.value.setDraft({...h.value.draft,note:'Henüz kaydedilmeyen'}));assert(h.value.error);localStorage.fail=false;await act(async()=>h.value.retry());assert(!h.value.error);await act(async()=>h.root.unmount());sessionStorage.clear();h=await hook(()=>useNotebookDrafts([]));assert.equal(h.value.draft.note,'Henüz kaydedilmeyen');assert.equal(h.value.drafts.length,3);await act(async()=>h.root.unmount());
console.log('PASS: six courses and multiple notebook drafts survive new tabs, legacy copies migrate safely, empty titles recover, failed writes retain edits with retry/unload warning, import cleanup waits for success and preserves other-tab changes.');
