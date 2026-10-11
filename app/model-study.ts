import type {Atlas,Part,View} from './anatomy';
import type {Region} from './case-schema';
import {MUSCLES,muscleFor,muscleKeyMatches} from './education-data';
import {NERVES,nerveParts,targetParts,matchesMuscle,type Nerve} from './innervation';
import {muscleRegion} from './study-map';

export type FindingGroup='muscles'|'nerves'|'connective';
export interface ModelFinding {
 id:string;structureKey:string;side:'right'|'left';region:Region;displayName:string;
 prompt:string;answer:string;options:string[];explanation:string;source:string;rationales:Record<string,string>;
 group:FindingGroup;task?:'muscle'|'nerve'|'target';muscleKey?:string;nerveId?:string;
}
export const studyMuscleName=(key:string)=>muscleFor(key)?.name??'M. '+key;
export const primaryNerveMuscle=(nerve:Nerve)=>nerve.muscles.find(key=>MUSCLES.some(m=>m.key===key))??nerve.muscles[0];
const nerveRegion=(n:Nerve):Region=>MUSCLES.some(m=>m.key===primaryNerveMuscle(n))?muscleRegion(primaryNerveMuscle(n)):'neuro';
const sides=['right','left'] as const;
const options=(names:string[])=>[...new Set([...names,'Kas veya kemik'])];
const rationale=(names:string[],answer:string,explanation:string)=>Object.fromEntries(names.map(name=>[name,name===answer?explanation:`Seçtiğin yapı ${name}. Konumunu ve bu soruda istenen anatomik bağlantıyı yeniden incele.`]));
export const MUSCLE_FINDINGS:ModelFinding[]=MUSCLES.flatMap(m=>sides.map(side=>{
 const names=options(MUSCLES.map(x=>x.name)),explanation=m.name+' — '+m.action;
 return {id:`locate:muscle:${m.key}:${side}`,structureKey:'muscle:'+m.key,side,region:muscleRegion(m.key),displayName:m.name,group:'muscles',task:'muscle',muscleKey:m.key,
  prompt:`${side==='right'?'Sağ':'Sol'} tarafta ${m.name} kasını modelde bul.`,answer:m.name,options:names,explanation,source:m.source,rationales:rationale(names,m.name,explanation)};
}));
// Source-missing branches retain motor-target studies, without impossible
// nerve-finding tasks. Availability is independently checked against the atlas.
export const NERVE_FINDINGS:ModelFinding[]=NERVES.flatMap(n=>sides.flatMap(side=>{
 const key=primaryNerveMuscle(n),region=nerveRegion(n),names=['Seçili motor hedef kas','Seçili motor hedefler dışında','Sinir','Kas veya kemik'];
 const explanation=`${n.name} için kartın seçili motor hedefleri: ${n.muscles.map(studyMuscleName).join(', ')}. ${n.indirect?'Bu ilişki distal dalları üzerinden kurulur. ':''}${n.note??'Liste seçili motor hedefleri içerir; sinirin bütün hedeflerinin dökümü değildir.'}`;
 const target:ModelFinding={id:`locate:target:${n.id}:${side}`,structureKey:'nerve:'+n.id,side,region,displayName:n.name+' · motor hedef',group:'nerves',task:'target',muscleKey:key,nerveId:n.id,
  prompt:`${side==='right'?'Sağ':'Sol'} ${n.name} kartının seçili motor hedeflerinden birini modelde bul.`,answer:'Seçili motor hedef kas',options:names,explanation,source:n.source,rationales:rationale(names,'Seçili motor hedef kas',explanation)};
 if(n.modelSurface===false)return [target];
 const nerveNames=options(NERVES.map(x=>x.name)),nerveExplanation=`${n.name}: seçili motor hedefler ${n.muscles.map(studyMuscleName).join(', ')}. ${n.note??''}`;
 return [{id:`locate:nerve:${n.id}:${side}`,structureKey:'nerve:'+n.id,side,region,displayName:n.name,group:'nerves',task:'nerve',nerveId:n.id,
  prompt:`${side==='right'?'Sağ':'Sol'} tarafta ${n.name} sinirini modelde bul.`,answer:n.name,options:nerveNames,explanation:nerveExplanation,source:n.source,rationales:rationale(nerveNames,n.name,nerveExplanation)},target];
}));
export function modelMuscleView(key:string):View{
 return /gluteus|hamstring|semitendinosus|semimembranosus|biceps femoris|gastrocnemius|soleus|tibialis posterior|triceps|anconeus|infraspinatus|teres|latissimus/.test(key)?'back':'front';
}
export function localStudyBones(atlas:Atlas,parts:Part[],side:'right'|'left'){
 if(!parts.length)return [];
 const lo=[0,1,2].map(i=>Math.min(...parts.map(p=>p.bounds[0][i]))-.03),hi=[0,1,2].map(i=>Math.max(...parts.map(p=>p.bounds[1][i]))+.03);
 return atlas.parts.filter(p=>p.system==='skeletal'&&(!/\b(left|right)\b/i.test(p.name)||new RegExp('\\b'+side+'\\b','i').test(p.name))&&[0,1,2].every(i=>p.bounds[1][i]>=lo[i]&&p.bounds[0][i]<=hi[i]));
}
type StudyEnvelope={parts:Part[];candidateIds:string[];hidden:string[]};
const envelopeCache=new WeakMap<Atlas,Map<string,StudyEnvelope>>();
export function buildModelStudyScene(atlas:Atlas,q:ModelFinding){
 let envelopes=envelopeCache.get(atlas);if(!envelopes){envelopes=new Map();envelopeCache.set(atlas,envelopes);}
 const envelopeKey=q.task+':'+q.region+':'+q.side;
 let envelope=envelopes.get(envelopeKey);
 if(!envelope){
  const sameSide=new RegExp('\\b'+q.side+'\\b','i');
  const keys=q.task==='target'?[...new Set([...MUSCLES.filter(m=>muscleRegion(m.key)===q.region).map(m=>m.key),...NERVES.filter(n=>nerveRegion(n)===q.region).flatMap(n=>n.muscles)])]:MUSCLES.filter(m=>muscleRegion(m.key)===q.region).map(m=>m.key);
  const candidates=q.task==='nerve'?NERVES.filter(n=>nerveRegion(n)===q.region).flatMap(n=>nerveParts(atlas,n,q.side)):atlas.parts.filter(p=>p.system==='muscular'&&sameSide.test(p.name)&&keys.some(key=>matchesMuscle(p,key)));
  const candidateIds=[...new Set(candidates.map(p=>p.id))],context=localStudyBones(atlas,candidates,q.side),visible=new Set([...candidateIds,...context.map(p=>p.id)]);
  envelope={parts:atlas.parts.filter(p=>visible.has(p.id)),candidateIds,hidden:atlas.parts.filter(p=>!visible.has(p.id)).map(p=>p.id)};
  envelopes.set(envelopeKey,envelope);
 }
 const nerve=q.nerveId?NERVES.find(n=>n.id===q.nerveId):undefined;
 const targets=q.task==='nerve'?nerveParts(atlas,nerve!,q.side):q.task==='target'?targetParts(atlas,nerve!,q.side):envelope.parts.filter(p=>p.system==='muscular'&&matchesMuscle(p,q.muscleKey!));
 if(!targets.length)return undefined;
 const view=q.task==='nerve'?/gluteal|sciatic|tibial/.test(nerve!.id)?'back':'front':modelMuscleView(q.muscleKey!);
 return {question:q,...envelope,targetIds:targets.map(p=>p.id),view:view as View};
}
export function modelStudyChoice(atlas:Atlas,q:ModelFinding,part:Part){
 if(q.task==='nerve')return NERVES.find(n=>nerveParts(atlas,n,q.side).some(p=>p.id===part.id))?.name??'Kas veya kemik';
 if(q.task==='target')return part.system==='muscular'?(targetParts(atlas,NERVES.find(n=>n.id===q.nerveId)!,q.side).some(p=>p.id===part.id)?'Seçili motor hedef kas':'Seçili motor hedefler dışında'):'Kas veya kemik';
 if(part.system!=='muscular')return 'Kas veya kemik';
 const key=MUSCLES.find(m=>matchesMuscle(part,m.key))?.key??NERVES.flatMap(n=>n.muscles).find(key=>muscleKeyMatches(part.name,key));
 return key?studyMuscleName(key):'Kas veya kemik';
}
