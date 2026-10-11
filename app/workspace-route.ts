import {isRegionalCourseId,regionalCourse,type RegionalCourseId} from './regional-course-content';
import {LESSON_HASHES,type Lesson} from './lesson-routes';
import {isKneeCourseStep,type KneeCourseStep} from './knee-course-data';
export interface WorkspaceRoute {
 lesson:Lesson|'practice';courseId?:RegionalCourseId;courseStep?:KneeCourseStep;courseMotion?:number;tab?:'muscles'|'nerves'|'connective';region?:string;
 concept?:string;muscle?:string;nerve?:string;nerveFocus?:'targets';structure?:string;side?:'left'|'right';motion?:string;
 progress?:number;caseId?:string;mode?:'learn'|'exam';quizMuscle?:string;quizTendon?:string;quizFinding?:string;compare?:string;
 attachment?:'both'|'origin'|'insertion';isolate?:true;tendons?:true;trace?:true;learningView?:'favorites';labMode?:'compare'|'clinical';labKind?:'muscles';labFrame?:'centered'|'aligned';labContext?:boolean;clinicalPair?:string;yaw?:number;pitch?:number;zoom?:number;
}
const hashes:Record<WorkspaceRoute['lesson'],string>={courses:'ogren','regional-course':'bolge-dersi','knee-course':'diz-dersi',notebook:'defter',lab:'inceleme',tendons:'tendonlar',study:'atlas',practice:'sinama',movements:'hareketler',shoulder:'omuz',elbow:'dirsek',hip:'kalca',ankle:'ayak-bilegi',knee:'diz',gait:'yuruyus',cases:'vakalar',quiz:'test',learning:'calismalarim',spine:'omurga',latissimus:'latissimus'};
export function parseWorkspaceRoute(hash:string):WorkspaceRoute {
 const [base,query='']=hash.replace(/^#/,'').split('?'),params=new URLSearchParams(query);
 const lesson=base==='atlas'?'study':base==='sinama'?'practice':LESSON_HASHES['#'+base]??'study';
 const route:WorkspaceRoute={lesson};
 const courseStep=params.get('adim');if((lesson==='knee-course'||lesson==='regional-course')&&isKneeCourseStep(courseStep))route.courseStep=courseStep;
 const courseId=params.get('kurs');if(lesson==='regional-course'){if(isRegionalCourseId(courseId))route.courseId=courseId;else return {lesson:'courses'};}
 const stop=params.get('durak');if(lesson==='regional-course'&&route.courseId&&stop!==null&&/^\d+$/.test(stop)&&Number(stop)<regionalCourse(route.courseId)!.motions.length)route.courseMotion=Number(stop);
 const tab=params.get('tur');if(tab==='muscles'||tab==='nerves'||tab==='connective')route.tab=tab;
 for(const [field,param] of Object.entries({region:'bolge',concept:'secim',muscle:'kas',nerve:'sinir',structure:'yapi',motion:'hareket',caseId:'vaka',quizMuscle:'calis',quizTendon:'tendon',quizFinding:'bul',compare:'karsilastir'})){
  const value=params.get(param);if(value&&value.length<=120)(route as unknown as Record<string,unknown>)[field]=value;
 }
 const side=params.get('taraf');if(side==='sol'||side==='left')route.side='left';if(side==='sag'||side==='right')route.side='right';
 if(lesson==='study'&&route.nerve&&params.get('sinirgosterim')==='kaslar')route.nerveFocus='targets';
 const position=params.get('konum');if(position!==null&&position.trim()!==''&&Number.isFinite(Number(position)))route.progress=Math.max(0,Math.min(100,Number(position)));
 const mode=params.get('mod');if(mode==='learn'||mode==='exam')route.mode=mode;
 const attachment=params.get('tutunma');if(attachment==='both'||attachment==='origin'||attachment==='insertion')route.attachment=attachment;
 if(params.get('yalin')==='1')route.isolate=true;if(params.get('sema')==='1')route.tendons=true;if(params.get('iz')==='1')route.trace=true;
 if(params.get('bolum')==='favoriler')route.learningView='favorites';
 const labFrame=params.get('yerlesim');if(labFrame==='centered'||labFrame==='aligned')route.labFrame=labFrame;
 if(lesson==='lab'&&params.get('karsilastirmagrubu')==='kaslar')route.labKind='muscles';
 if(params.get('cevre')==='1'||params.get('cevre')==='0')route.labContext=params.get('cevre')==='1';
 const clinicalPair=params.get('bilgikarsilastirma');if(clinicalPair&&clinicalPair.length<=120)route.clinicalPair=clinicalPair;
 const labMode=params.get('gosterim');if(labMode==='compare'||labMode==='clinical')route.labMode=labMode;else if(labMode==='section')route.labMode='compare';
 for(const [key,param,min,max] of [['yaw','donus',-180,180],['pitch','egim',-80,80],['zoom','yakinlik',.5,2]] as const){const raw=params.get(param);if(raw!==null&&raw!==''&&Number.isFinite(Number(raw)))route[key]=Math.max(min,Math.min(max,Number(raw)));}
 if(lesson==='latissimus'){route.lesson='study';route.muscle='latissimus dorsi';}
 return route;
}
export function workspaceHash(route:WorkspaceRoute){
 const p=new URLSearchParams();
 if(route.lesson==='regional-course'&&route.courseId)p.set('kurs',route.courseId);
 if((route.lesson==='knee-course'||route.lesson==='regional-course')&&route.courseStep)p.set('adim',route.courseStep);
 if(route.lesson==='regional-course'&&route.courseId&&Number.isInteger(route.courseMotion)&&Number(route.courseMotion)>=0&&Number(route.courseMotion)<regionalCourse(route.courseId)!.motions.length)p.set('durak',String(route.courseMotion));
 if(route.lesson==='study'&&route.nerve&&route.nerveFocus==='targets')p.set('sinirgosterim','kaslar');
 if(route.lesson==='lab'&&route.labKind==='muscles')p.set('karsilastirmagrubu','kaslar');
 for(const [field,param] of Object.entries({tab:'tur',region:'bolge',concept:'secim',muscle:'kas',nerve:'sinir',structure:'yapi',side:'taraf',motion:'hareket',progress:'konum',caseId:'vaka',mode:'mod',quizMuscle:'calis',quizTendon:'tendon',quizFinding:'bul',compare:'karsilastir',attachment:'tutunma',isolate:'yalin',tendons:'sema',trace:'iz',learningView:'bolum',labMode:'gosterim',labFrame:'yerlesim',labContext:'cevre',clinicalPair:'bilgikarsilastirma',yaw:'donus',pitch:'egim',zoom:'yakinlik'})){
  let value=route[field as keyof WorkspaceRoute];
  if(value===undefined||value===''||field==='tab'&&value==='muscles'||field==='region'&&value==='all')continue;
  if(field==='side')value=value==='left'?'sol':'sag';
  if(field==='tendons'||field==='trace'||field==='isolate')value='1';
  if(field==='labContext')value=value?'1':'0';
  if(field==='learningView')value='favoriler';
  if(field==='progress'){if(!value)continue;value=Math.round(Number(value));}
  p.set(param,String(value));
 }
 return '#'+hashes[route.lesson]+(p.size?'?'+p.toString():'');
}
export function routeIdentity(route:WorkspaceRoute){const {progress,yaw,pitch,zoom,...identity}=route;return workspaceHash(identity);}
