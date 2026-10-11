import {useEffect,useRef,useState} from 'react';
import {parseNotebookEntry,type NotebookEntry} from './notebook-data';
const KEY='atlas-notebook-drafts-v2';
function restore(){const drafts:Record<string,NotebookEntry>={};let active='';try{const raw=JSON.parse(sessionStorage.getItem(KEY)??'null');if(raw&&Array.isArray(raw.entries)){for(const e of raw.entries){const p=parseNotebookEntry(e);if(p)drafts[p.id]={...p,updatedAt:e.updatedAt??0};}active=typeof raw.active==='string'?raw.active:'';}else{const p=parseNotebookEntry(JSON.parse(sessionStorage.getItem('atlas-notebook-draft')??'null'));if(p){drafts[p.id]=p;active=p.id;}}}catch{}return {drafts,active};}
export function useNotebookDrafts(entries:NotebookEntry[]){
 const [state,setState]=useState(restore),[error,setError]=useState('');const failed=useRef(false);
 function persist(){try{sessionStorage.setItem(KEY,JSON.stringify({entries:Object.values(state.drafts),active:state.active}));sessionStorage.removeItem('atlas-notebook-draft');failed.current=false;setError('');}catch{failed.current=true;setError('Taslak bu sekmede saklanamadı. Yazdıkların açık sayfada korunuyor; sekmeyi kapatmadan yeniden dene.');}}
 useEffect(persist,[state]);useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(failed.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 function setDraft(entry:NotebookEntry|null){setState(prev=>{const drafts={...prev.drafts};if(entry){return {drafts:{...drafts,[entry.id]:drafts[entry.id]&&prev.active!==entry.id?drafts[entry.id]:entry},active:entry.id};}delete drafts[prev.active];return {drafts,active:Object.keys(drafts)[0]??''};});}
 const drafts=Object.values(state.drafts).filter(d=>{const saved=entries.find(e=>e.id===d.id);return !saved||(['title','note','collection','hash','archived'] as const).some(k=>saved[k]!==d[k]);});
 return {draft:state.drafts[state.active]??null,setDraft,drafts,error,retry:persist};
}
