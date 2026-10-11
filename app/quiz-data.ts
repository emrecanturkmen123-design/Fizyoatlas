import {findingScene} from './model-finding';
import type {Atlas} from './anatomy';
import {muscleKeyMatches} from './education-data';
import {questionDefinition,QUESTION_IDS} from './learning-data';
import {type Region} from './case-schema';
import {TOPICS,questionTopic,type Topic} from './study-topics';
export {TOPICS,type Topic} from './study-topics';
export interface QuizConfig {topic:Topic;region:Region|'all';count:10|20;feedback:'each'|'end';findingGroup?:FindingGroup|'all'}
export const DEFAULT_QUIZ:QuizConfig={topic:'all',region:'all',count:20,feedback:'each'};
export type QuizQuestion={findingId?:string;findingGroup?:FindingGroup;id:string;prompt:string;answer:string;choices:string[];elements:string[];explanation:string;rationales?:Record<string,string>;source:string;topic:Exclude<Topic,'all'>;region:Region};
export {muscleRegion} from './study-map';
import {muscleRegion} from './study-map';
import type {FindingGroup} from './model-study';
function randomFor(seed:number){let value=seed>>>0||1;return()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return (value>>>0)/4294967296;};}
function shuffle<T>(values:T[],random:()=>number){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function reviewQuestions(atlas:Atlas,ids:string[],seed=42,side:'right'|'left'='right'){const random=randomFor(seed);return [...new Set(ids)].flatMap((id):QuizQuestion[]=>{const q=questionDefinition(id);if(!q)return[];const finding=q.kind==='locate'?findingScene(atlas,id):undefined;if(q.kind==='locate'&&!finding)return[];const elements=finding?finding.candidateIds:'reference'in q||q.kind==='clinical'||q.kind==='tendon'?[]:atlas.parts.filter(p=>p.system==='muscular'&&new RegExp('\\b'+side+'\\b','i').test(p.name)&&muscleKeyMatches(p.name,q.m.key)).map(p=>p.id);if(q.kind==='name'&&!elements.length&&!('reference'in q))return[];const topic=questionTopic(q.kind);return [{id,findingId:finding?id:undefined,findingGroup:q.kind==='locate'?q.group:undefined,prompt:q.prompt,answer:q.answer,choices:shuffle([q.answer,...shuffle(q.options.filter(x=>x!==q.answer),random).slice(0,3)],random),elements,explanation:q.explanation,rationales:'rationales'in q?q.rationales:undefined,source:q.source,topic,region:('region'in q&&q.region?q.region:muscleRegion(q.m.key)) as Region}];});}
export function quizPool(atlas:Atlas,config:Pick<QuizConfig,'topic'|'region'|'findingGroup'>=DEFAULT_QUIZ){return reviewQuestions(atlas,QUESTION_IDS).filter(q=>(config.topic==='all'||q.topic===config.topic)&&(config.region==='all'||q.region===config.region)&&(config.topic!=='locate'||!config.findingGroup||config.findingGroup==='all'||q.findingGroup===config.findingGroup));}
export function makeQuiz(atlas:Atlas,seed:number,config:QuizConfig=DEFAULT_QUIZ){const random=randomFor(seed),pool=quizPool(atlas,config);let ids:string[]=[];
 if(config.topic==='all'){const groups=(Object.keys(TOPICS) as Topic[]).filter(t=>t!=='all').map(t=>shuffle(pool.filter(q=>q.topic===t).map(q=>q.id),random));while(ids.length<config.count&&groups.some(g=>g.length))for(const group of groups){const id=group.pop();if(id&&ids.length<config.count)ids.push(id);}}else ids=shuffle(pool.map(q=>q.id),random).slice(0,config.count);
 return reviewQuestions(atlas,shuffle(ids,random),seed+1);
}
export interface QuizState {index:number;answers:(string|null)[]}
export function answerQuiz(state:QuizState,answer:string):QuizState{if(state.index>=state.answers.length||state.answers[state.index]!==null)return state;return {...state,answers:state.answers.map((a,i)=>i===state.index?answer:a)};}
export function quizScore(questions:QuizQuestion[],state:QuizState){return questions.filter((q,i)=>state.answers[i]===q.answer).length;}
export function quizBreakdown(questions:QuizQuestion[],state:QuizState){return Object.entries(TOPICS).filter(([k])=>k!=='all').map(([topic,label])=>({topic,label,total:questions.filter(q=>q.topic===topic).length,correct:questions.filter((q,i)=>q.topic===topic&&q.answer===state.answers[i]).length})).filter(x=>x.total);}
