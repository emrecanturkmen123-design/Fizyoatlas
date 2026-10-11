import {REGIONS} from './case-schema';
import {questionDefinition,type LearningData} from './learning-data';
import {muscleRegion,STUDY_REGIONS} from './study-map';
import {QUESTION_IDS} from './learning-data';
import {TOPICS,questionTopic} from './study-topics';
const DAY=86400000,INTERVALS=[1,3,7,14,30];
export function reviewSchedule(data:LearningData,now=Date.now()){
 return data.answers.flatMap(a=>{const q=questionDefinition(a.questionId);if(!q)return[];const history=(data.history??[]).filter(h=>h.questionId===a.questionId).sort((x,y)=>y.answeredAt-x.answeredAt||y.attemptId.localeCompare(x.attemptId));let streak=0;for(const h of history){if(!h.correct)break;streak++;}const latest=history[0],days=streak?INTERVALS[Math.min(streak-1,4)]:0,dueAt=latest?latest.answeredAt+(a.correct?days*DAY:0):now;return [{questionId:a.questionId,label:q.kind==='clinical'?q.prompt:'displayName'in q?q.displayName:q.m.name,region:'region'in q&&q.region?q.region:muscleRegion(q.m.key),correct:a.correct,streak,days,dueAt,due:dueAt<=now}];}).sort((a,b)=>a.dueAt-b.dueAt||a.questionId.localeCompare(b.questionId));
}
export function learningRegions(data:LearningData){const reviews=reviewSchedule(data);return Object.entries({...STUDY_REGIONS,...REGIONS}).filter(([key])=>key!=='all').map(([key,label])=>{const questions=reviews.filter(q=>q.region===key);return {key,label,total:questions.length,correct:questions.filter(q=>q.correct).length,due:questions.filter(q=>q.due).length};}).filter(x=>x.total);}
export function learningTopics(data:LearningData,now=Date.now()){
 const latest=new Map(data.answers.map(a=>[a.questionId,a])),reviews=reviewSchedule({...data,answers:[...latest.values()]},now);
 return Object.entries(TOPICS).filter(([key])=>key!=='all').map(([key,label])=>{
  const pool=QUESTION_IDS.filter(id=>{const q=questionDefinition(id);return q&&questionTopic(q.kind)===key;}),studied=pool.filter(id=>latest.has(id)),wrong=studied.filter(id=>!latest.get(id)!.correct),due=reviews.filter(r=>pool.includes(r.questionId)&&r.due);
  const suggestions=[...new Set([...wrong,...pool.filter(id=>!latest.has(id)),...due.map(r=>r.questionId)])].slice(0,10);
  return {key,label,total:studied.length,correct:studied.length-wrong.length,wrong:wrong.length,due:due.length,available:pool.length,suggestions};
 });
}
export function recommendedTopic(data:LearningData,now=Date.now()){
 const topics=learningTopics(data,now).filter(t=>t.suggestions.length);
 return topics.sort((a,b)=>b.wrong-a.wrong||(a.total?a.correct/a.total:1)-(b.total?b.correct/b.total:1)||a.total-b.total)[0];
}
