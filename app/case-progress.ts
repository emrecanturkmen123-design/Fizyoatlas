import {caseFollowup} from './case-followup';
import {ankleBranch,caseBranch} from './case-branch';
import {CASE_JOURNEYS} from './case-journeys';
export type CaseMode='learn'|'exam';
export interface CaseProgress {caseId:string;mode:CaseMode;version:1;index:number;answers:(number|null)[];hinted:number[];branch:string[];followup?:string;updatedAt?:number;revision?:number}
export const progressKey=(p:Pick<CaseProgress,'caseId'|'mode'>)=>p.caseId+':'+p.mode;
export function parseCaseProgress(value:unknown):CaseProgress|undefined{
 if(!value||typeof value!=='object'||Array.isArray(value))return;
 const p=value as CaseProgress,c=CASE_JOURNEYS.find(c=>c.id===p.caseId);
 if(!c||p.version!==1||!['learn','exam'].includes(p.mode)||!Number.isInteger(p.index)||p.index<0||p.index>c.steps.length)return;
 if(!Array.isArray(p.answers)||p.answers.length!==c.steps.length||!p.answers.every((v,i)=>v===null?i>=p.index:Number.isInteger(v)&&v>=0&&v<c.steps[i].choices.length&&i<=p.index))return;
 if(!Array.isArray(p.hinted)||p.hinted.length>c.steps.length||new Set(p.hinted).size!==p.hinted.length||!p.hinted.every(i=>Number.isInteger(i)&&i>=0&&i<=p.index&&i<c.steps.length)||p.mode==='exam'&&p.hinted.length)return;
 if(!Array.isArray(p.branch)||p.branch.length>32||!p.branch.every(v=>typeof v==='string'))return;
 if(p.caseId!=='ankle-sprain'&&(p.branch.length&&(!caseBranch(p.caseId,p.branch)||p.mode==='exam'||p.index<2||p.index>2&&!caseBranch(p.caseId,p.branch)?.ready))||p.caseId==='ankle-sprain'&&(!ankleBranch(p.branch)||p.index<2&&p.branch.length||p.index>2&&!ankleBranch(p.branch)?.ready))return;
 if(p.followup!==undefined&&(typeof p.followup!=='string'||!caseFollowup(p.caseId,p.followup)||p.mode!=='learn'||p.index<7||p.answers[7]===null))return;
 return {...(Number.isInteger(p.revision)&&Number(p.revision)>=0?{revision:p.revision}:{}),caseId:p.caseId,mode:p.mode,version:1,index:p.index,answers:[...p.answers],hinted:[...p.hinted],branch:[...p.branch],...(p.followup?{followup:p.followup}:{})};
}
export function freshProgress(caseId:string,mode:CaseMode):CaseProgress{return {caseId,mode,version:1,index:0,answers:CASE_JOURNEYS.find(c=>c.id===caseId)!.steps.map(()=>null),hinted:[],branch:[]};}
