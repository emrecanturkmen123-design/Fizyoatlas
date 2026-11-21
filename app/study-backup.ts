import { EMPTY_LEARNING, parseLearning, type LearningData } from './learning-data';
import { parseCaseProgress, progressKey, type CaseProgress } from './case-progress';
import { mergeKneeCourseDraft, parseKneeCourse } from './knee-course-data';
import { mergeRegionalDraft, parseRegionalCourse } from './regional-course-data';
import { parseQuizSession } from './quiz-session';

import { LEARNING_KEY, CASES_KEY, KNEE_DRAFT_KEY, QUIZ_DRAFT_PREFIX } from './study-storage-keys';

type Backup = { format:'fizyo-atlas-study'; version:1; records:Record<string,unknown> };
const format='fizyo-atlas-study';
const readValue=(storage:Storage,key:string)=>{
  const raw=storage.getItem(key);
  if(!raw)return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
};

function mergeLearning(current:LearningData,incoming:LearningData):LearningData {
  const history=[...new Map([...(incoming.history??[]),...(current.history??[])].map(a=>[a.attemptId,a])).values()]
    .sort((a,b)=>b.answeredAt-a.answeredAt).slice(0,1000);
  const answers=new Map([...incoming.answers,...current.answers].map(a=>[a.questionId,a]));
  for(const latest of [...history].reverse())answers.set(latest.questionId,{questionId:latest.questionId,correct:latest.correct});
  return {authenticated:false,favorites:[...new Set([...current.favorites,...incoming.favorites])],answers:[...answers.values()],history};
}

function cases(value:unknown):CaseProgress[]|null {
  if(!Array.isArray(value)||value.length>100)return null;
  const entries=value.map(parseCaseProgress);
  return entries.every((item): item is CaseProgress=>!!item)?entries:null;
}

function combine(key:string, value:unknown, old:unknown):unknown {
  if(key===LEARNING_KEY){
    const incoming=parseLearning(value);
    if(incoming.authenticated)return null;
    let current=EMPTY_LEARNING;
    try { current=parseLearning(old); } catch {}
    return mergeLearning(current,incoming);
  }
  if(key===CASES_KEY){
    const incoming=cases(value);
    if(!incoming)return null;
    const result=new Map((cases(old)??[]).map(item=>[progressKey(item),item]));
    for(const item of incoming){
      const id=progressKey(item),current=result.get(id);
      if(!current||item.index>current.index)result.set(id,item);
    }
    return [...result.values()];
  }
  if(key===KNEE_DRAFT_KEY){
    const incoming=parseKneeCourse(value),current=parseKneeCourse(old);
    if(!incoming)return null;
    return current?mergeKneeCourseDraft(current,incoming):incoming;
  }
  if(key.startsWith('atlas-course-draft-')){
    const incoming=parseRegionalCourse(value),current=parseRegionalCourse(old);
    if(!incoming||key!=='atlas-course-draft-'+incoming.courseId)return null;
    return current?.courseId===incoming.courseId?mergeRegionalDraft(current,incoming):incoming;
  }
  if(key.startsWith(QUIZ_DRAFT_PREFIX)){
    const incoming=parseQuizSession(value),current=parseQuizSession(old);
    if(!incoming||key!==QUIZ_DRAFT_PREFIX+incoming.key)return null;
    return current??incoming;
  }
  return null;
}

function knownPrefix(key:string) {
  return [LEARNING_KEY,CASES_KEY,KNEE_DRAFT_KEY].includes(key)||key.startsWith('atlas-course-draft-')||key.startsWith(QUIZ_DRAFT_PREFIX);
}

export function makeStudyBackup(storage:Storage):Backup {
  const records:Backup['records']={};
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(!key||!knownPrefix(key))continue;
    try {
      const value=combine(key,readValue(storage,key),null);
      if(value!==null)records[key]=value;
    } catch { /* An unusable record can still be recovered separately from browser storage. */ }
  }
  return {format,version:1,records};
}

export function parseStudyBackup(text:string):Backup {
  const payload=JSON.parse(text) as Partial<Backup>|null;
  if(payload?.format!==format||payload.version!==1||!payload.records||typeof payload.records!=='object'||Array.isArray(payload.records))throw Error();
  const entries=Object.entries(payload.records);
  if(!entries.length||entries.length>200)throw Error();
  const records=Object.fromEntries(entries.map(([key,value])=>{
    const parsed=combine(key,value,null);
    if(parsed===null)throw Error();
    return [key,parsed];
  }));
  return {format,version:1,records};
}

export function restoreStudyBackup(storage:Storage,backup:Backup) {
  const changes=Object.entries(backup.records).map(([key,value])=>{
    const next=combine(key,value,readValue(storage,key));
    if(next===null)throw Error('Çalışma kaydı geçersiz.');
    return {key,old:storage.getItem(key),next:JSON.stringify(next)};
  });
  let written=0;
  try {
    for(const change of changes){
      storage.setItem(change.key,change.next);
      written++;
    }
  } catch(error) {
    for(const change of changes.slice(0,written)){
      try {
        if(change.old===null)storage.removeItem(change.key);
        else storage.setItem(change.key,change.old);
      } catch { /* Browser storage may be unavailable. */ }
    }
    throw error;
  }
}
