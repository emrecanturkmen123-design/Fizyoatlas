import {REGIONAL_COURSES,type RegionalCourseId} from './regional-course-content';
import {freshRegionalCourse,parseRegionalCourse,regionalCompletion,regionalNeedsReview,regionalDraftKey,hasRegionalWork,regionalExamQuestions,mergeRegionalDraft} from './regional-course-data';
import {freshKneeCourse,parseKneeCourse,kneeCourseCompletion,kneeCourseNeedsReview,hasKneeCourseWork,KNEE_COURSE_ID,KNEE_COURSE_STEPS,KNEE_STRUCTURES,KNEE_CASES,examQuestions,mergeKneeCourseDraft} from './knee-course-data';
import type {WorkspaceRoute} from './workspace-route';
import {readBrowserDraft} from './browser-drafts';
export type CourseId=RegionalCourseId|typeof KNEE_COURSE_ID;
export const COURSE_DEFINITIONS:{id:CourseId;title:string;summary:string;structures:number;cases:number}[]=[{id:KNEE_COURSE_ID,title:'Diz',summary:'Kemikler, kaslar, bağlar ve menisküsler',structures:KNEE_STRUCTURES.length,cases:KNEE_CASES.length},...REGIONAL_COURSES.map(c=>({id:c.id,title:c.title,summary:c.summary,structures:c.structures.length,cases:c.cases.length}))];
export function courseOverview(records:unknown[]){
 return COURSE_DEFINITIONS.map(c=>{
  const knee=c.id===KNEE_COURSE_ID;
  const record=knee?(records.map(parseKneeCourse).find(Boolean)??freshKneeCourse()):(records.map(parseRegionalCourse).find(p=>p?.courseId===c.id)??freshRegionalCourse(c.id as RegionalCourseId));
  const completion=knee?kneeCourseCompletion(record as ReturnType<typeof freshKneeCourse>):regionalCompletion(record as ReturnType<typeof freshRegionalCourse>);
  const needsReview=knee?kneeCourseNeedsReview(record as ReturnType<typeof freshKneeCourse>):regionalNeedsReview(record as ReturnType<typeof freshRegionalCourse>);
  const questions=knee?examQuestions(record as ReturnType<typeof freshKneeCourse>):regionalExamQuestions(record as ReturnType<typeof freshRegionalCourse>);
  const started=(knee?hasKneeCourseWork(record as ReturnType<typeof freshKneeCourse>):hasRegionalWork(record as ReturnType<typeof freshRegionalCourse>))||record.step!=='anatomy'||('motionStop' in record&&record.motionStop!==0);
  const route:WorkspaceRoute=knee?{lesson:'knee-course',courseStep:record.step,side:record.side}:{lesson:'regional-course',courseId:c.id as RegionalCourseId,courseStep:record.step,courseMotion:(record as ReturnType<typeof freshRegionalCourse>).motionStop,side:record.side};
  return {...c,done:completion.slice(0,4).filter(Boolean).length,started,step:KNEE_COURSE_STEPS.find(s=>s.id===record.step)!.title,route,needsReview:needsReview.some(Boolean),examAnswered:record.exam.filter(x=>x!==null).length,examCorrect:record.exam.filter((x,i)=>x===questions[i].correct).length,examFinished:record.examFinished};
 });
}
export function readCourseDrafts(){
 const knee=readBrowserDraft('atlas-knee-course-draft',parseKneeCourse,mergeKneeCourseDraft);
 return [...(knee?[knee]:[]),...REGIONAL_COURSES.flatMap(c=>{const value=readBrowserDraft(regionalDraftKey(c.id),v=>{const p=parseRegionalCourse(v);return p?.courseId===c.id?p:null;},mergeRegionalDraft);return value?[value]:[];})];
}
