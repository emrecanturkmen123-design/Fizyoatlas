import {FOUNDATION_QUESTIONS} from './foundation-questions';
import {MODEL_FINDINGS} from './model-finding';
import {TENDON_QUESTIONS} from './tendon-questions';
import {CLINICAL_STRUCTURES} from './clinical-structures';
import {caseStep,caseFollowup,FOLLOWUP_QUESTION_IDS} from './case-followup';
import {CASE_JOURNEYS} from './case-journeys';
import {ACTION_DISTRACTORS} from './action-distractors';
import {CLINICAL_CASES} from './clinical-cases';
import {MUSCLES} from './education-data';
export const QUESTION_KINDS=['name','nerve','origin','insertion','action'] as const;
export type QuestionKind=typeof QUESTION_KINDS[number];
export interface LearningAttempt {attemptId:string;questionId:string;correct:boolean;answeredAt:number}
export interface LearningData {authenticated:boolean;favorites:string[];answers:{questionId:string;correct:boolean}[];history?:LearningAttempt[]}
export const isFavoriteKey=(key:string)=>MUSCLES.some(m=>m.key===key)||CLINICAL_STRUCTURES.some(s=>'structure:'+s.key===key);
export const EMPTY_LEARNING:LearningData={authenticated:false,favorites:[],answers:[],history:[]};
export function questionDefinition(id:string){
 if(id.startsWith('foundation:')){const q=FOUNDATION_QUESTIONS.find(q=>q.id===id),m=MUSCLES.find(m=>m.key===q?.muscleKey);if(!q||!m)return;return {...q,m,kind:q.topic,reference:true as const};}
 if(id.startsWith('locate:')){const q=MODEL_FINDINGS.find(q=>q.id===id);if(!q)return;return {...q,kind:'locate' as const,reference:true as const};}
 if(id.startsWith('tendon:')){const q=TENDON_QUESTIONS.find(q=>q.id===id),m=MUSCLES.find(m=>m.key===q?.muscleKey);if(!q||!m)return;return {...q,m,kind:'tendon' as const,displayName:CLINICAL_STRUCTURES.find(s=>s.key===q.key)?.name??q.key};}
 if(id.startsWith('journey:')){const chunks=id.split(':');if((chunks.length!==3&&chunks.length!==4)||!/^\d+$/.test(chunks[2]))return undefined;const [,caseId,stepId,followup]=chunks;const c=CASE_JOURNEYS.find(c=>c.id===caseId),index=Number(stepId),path=caseFollowup(caseId,followup),s=c?caseStep(c,index,followup):undefined,m=MUSCLES.find(m=>m.key===c?.quizKey);if(!c||!s||!m||!Number.isInteger(index)||chunks.length===4&&(!path||index<8||index>9))return undefined;return {m,kind:'clinical' as const,region:c.region,answer:s.choices[s.correct],options:s.choices,prompt:c.patient+'. '+s.finding+' '+s.question,rationales:Object.fromEntries(s.choices.map((choice,i)=>[choice,s.rationales?.[i]??s.why])),explanation:s.why,source:path?.source??c.sources[index===9?c.sources.length-1:0].url};}

 if(id.startsWith('case:')){const c=CLINICAL_CASES.find(c=>'case:'+c.id===id),quiz=c?.quiz,m=MUSCLES.find(m=>m.key===quiz?.key);if(!c||!quiz||!m)return undefined;return {m,kind:'clinical' as const,answer:quiz.answer,options:quiz.options,prompt:c.vignette,explanation:c.answer+' '+c.note,source:c.source};}
 const split=id.lastIndexOf('-'),key=id.slice(0,split),kind=id.slice(split+1) as QuestionKind,m=MUSCLES.find(m=>m.key===key);if(!m||!QUESTION_KINDS.includes(kind))return undefined;
 const label=(x:typeof m)=>kind==='nerve'?x.nerve.split(' · ')[0]:x[kind];
 return {m,kind,answer:label(m),options:kind==='action'?[m.action,...ACTION_DISTRACTORS[m.key]]:[...new Set(MUSCLES.map(label))],prompt:kind==='name'?'Modelde vurgulanan kas hangisi?':m.name+' için '+({nerve:'motor innervasyon',origin:'origo',insertion:'insertio',action:'hareket katkısı'} as const)[kind]+' hangisidir?',explanation:m.name+' — '+(kind==='name'?m.action:kind==='nerve'?m.nerve:label(m)),source:m.source};
}
export const QUESTION_IDS=[...FOUNDATION_QUESTIONS.map(q=>q.id),...MUSCLES.flatMap(m=>QUESTION_KINDS.map(kind=>m.key+'-'+kind)),...CASE_JOURNEYS.flatMap(c=>c.steps.map((_,i)=>'journey:'+c.id+':'+i)),...TENDON_QUESTIONS.map(q=>q.id),...FOLLOWUP_QUESTION_IDS,...MODEL_FINDINGS.map(q=>q.id)];


export function parseLearning(value:unknown):LearningData {if(!value||typeof value!=='object')throw new Error('Invalid learning response');const v=value as Partial<LearningData>;if(typeof v.authenticated!=='boolean'||!Array.isArray(v.favorites)||!Array.isArray(v.answers)||!v.favorites.every(k=>typeof k==='string')||!v.answers.every(a=>a&&typeof a.questionId==='string'&&typeof a.correct==='boolean')||v.history!==undefined&&(!Array.isArray(v.history)||!v.history.every(a=>a&&typeof a.attemptId==='string'&&typeof a.questionId==='string'&&typeof a.correct==='boolean'&&Number.isFinite(a.answeredAt)&&a.answeredAt>0)))throw new Error('Invalid learning response');return {authenticated:v.authenticated,favorites:v.favorites.filter(isFavoriteKey),answers:v.answers.filter(a=>questionDefinition(a.questionId)),history:(v.history??[]).filter(a=>questionDefinition(a.questionId)).slice(0,1000)};}
