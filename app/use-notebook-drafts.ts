import {useEffect,useRef,useState} from 'react';
import {newNotebookId,parseNotebookEntry,type NotebookEntry} from './notebook-data';
import {readBrowserDraft,writeBrowserDraft,removeBrowserDraft} from './browser-drafts';

const KEY='atlas-notebook-drafts-v2', LEGACY_KEY='atlas-notebook-draft';
type DraftState={drafts:Record<string,NotebookEntry>;active:string};
// An unfinished title is valid in a draft; account saves still require a title.
function parseDraft(value:unknown):NotebookEntry|null{
 if(!value||typeof value!=='object')return null;
 const e=value as NotebookEntry;
 if(typeof e.title!=='string'||e.title.length>120)return null;
 const p=parseNotebookEntry({...e,title:e.title.trim()?e.title:'Taslak'});
 return p?{...p,title:e.title,updatedAt:Number.isFinite(e.updatedAt)?e.updatedAt:0}:null;
}
function parseState(value:unknown):DraftState|null{
 if(!value||typeof value!=='object'||!Array.isArray((value as {entries?:unknown}).entries))return null;
 const raw=value as {entries:unknown[];active?:unknown},drafts:Record<string,NotebookEntry>={};
 for(const e of raw.entries){const p=parseDraft(e);if(p)drafts[p.id]=p;}
 const active=typeof raw.active==='string'&&drafts[raw.active]?raw.active:Object.keys(drafts)[0]??'';
 return {drafts,active};
}
const encode=(state:DraftState)=>({entries:Object.values(state.drafts),active:state.active});
// Preserve both notes if a legacy tab and the browser contain different edits.
function mergeLegacy(saved:DraftState,legacy:DraftState):DraftState{
 const drafts={...saved.drafts};
 for(const d of Object.values(legacy.drafts)){
  if(!drafts[d.id])drafts[d.id]=d;
  else if(JSON.stringify(drafts[d.id])!==JSON.stringify(d)){const id=newNotebookId();drafts[id]={...d,id};}
 }
 return {drafts,active:saved.active||legacy.active};
}
function readState(){
 return readBrowserDraft(KEY,parseState,mergeLegacy,encode);
}
function restore():DraftState{
 let state=readState()??{drafts:{},active:''};
 const legacy=readBrowserDraft(LEGACY_KEY,parseDraft);
 if(legacy)state=mergeLegacy(state,{drafts:{[legacy.id]:legacy},active:legacy.id});
 return state;
}
export function useNotebookDrafts(entries:NotebookEntry[]){
 const [state,setState]=useState(restore),[error,setError]=useState('');
 const failed=useRef(false),base=useRef(state);
 function persist(){
  try{
   const latest=readState(),drafts={...latest?.drafts};
   for(const id of Object.keys(base.current.drafts))if(!state.drafts[id])delete drafts[id];
   for(const d of Object.values(state.drafts)){
    const old=base.current.drafts[d.id],other=drafts[d.id];
    const changed=JSON.stringify(old)!==JSON.stringify(d);
    if(changed&&other&&JSON.stringify(other)!==JSON.stringify(old)&&JSON.stringify(other)!==JSON.stringify(d)){
     const id=newNotebookId();drafts[id]={...other,id};
    }
    if(changed||!other)drafts[d.id]=d;
   }
   const next={drafts,active:state.active&&drafts[state.active]?state.active:Object.keys(drafts)[0]??''};
   writeBrowserDraft(KEY,encode(next));
   const legacy=readBrowserDraft(LEGACY_KEY,parseDraft);
   if(legacy)removeBrowserDraft(LEGACY_KEY,legacy,parseDraft);
   base.current=next;failed.current=false;setError('');
   if(JSON.stringify(next)!==JSON.stringify(state))setState(next);
  }catch{
   failed.current=true;
   setError('Taslak bu tarayıcıda saklanamadı. Yazdıkların açık sayfada korunuyor; sekmeyi kapatmadan yeniden dene.');
  }
 }
 useEffect(persist,[state]);
 useEffect(()=>{
  const warn=(e:BeforeUnloadEvent)=>{if(failed.current){e.preventDefault();e.returnValue='';}};
  window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 },[]);
 function setDraft(entry:NotebookEntry|null){
  setState(prev=>{
   const drafts={...prev.drafts};
   if(entry)return {drafts:{...drafts,[entry.id]:drafts[entry.id]&&prev.active!==entry.id?drafts[entry.id]:entry},active:entry.id};
   delete drafts[prev.active];return {drafts,active:Object.keys(drafts)[0]??''};
  });
 }
 const drafts=Object.values(state.drafts).filter(d=>{const saved=entries.find(e=>e.id===d.id);return !saved||(['title','note','collection','hash','archived'] as const).some(k=>saved[k]!==d[k]);});
 return {draft:state.drafts[state.active]??null,setDraft,drafts,error,retry:persist};
}
