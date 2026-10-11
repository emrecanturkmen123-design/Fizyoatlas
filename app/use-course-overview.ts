import {useEffect,useState} from 'react';
import {courseOverview,readCourseDrafts} from './course-overview';
export function useCourseOverview(){
 const [records,setRecords]=useState<unknown[]>([]),[status,setStatus]=useState<'loading'|'account'|'guest'|'error'>('loading'),[warnings,setWarnings]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setStatus('loading');setWarnings(false);
  void fetch('/api/courses',{cache:'no-store'}).then(async response=>{
   if(response.status===401){const drafts=readCourseDrafts();if(active){setRecords(drafts);setStatus('guest');}return;}
   if(!response.ok)throw Error();
   const data=await response.json() as {authenticated?:boolean;progress?:unknown[];warnings?:number};
   if(data.authenticated!==true||!Array.isArray(data.progress))throw Error();
   if(active){setRecords(data.progress);setWarnings(!!data.warnings);setStatus('account');}
  }).catch(()=>{if(active)setStatus('error');});return()=>{active=false;};
 },[attempt]);
 return {courses:courseOverview(records),status,warnings,retry:()=>setAttempt(n=>n+1)};
}
