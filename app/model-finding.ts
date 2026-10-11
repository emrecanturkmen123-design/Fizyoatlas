import {LIGAMENT_INFO} from './ligament-data';
import type {Atlas,Part,View} from './anatomy';
import type {Region} from './case-schema';
import {CLINICAL_STRUCTURES,clinicalStructure} from './clinical-structures';
import {CONNECTIVE_STUDIES,connectiveSelection} from './connective-study';
import {TENDON_INFO} from './tendon-data';
import {MUSCLES} from './education-data';
import {NERVES} from './innervation';
import {MUSCLE_FINDINGS,NERVE_FINDINGS,primaryNerveMuscle,buildModelStudyScene,modelStudyChoice,type ModelFinding} from './model-study';
const regions:Record<string,Region>={'Omuz':'shoulder','Diz':'knee','Ayak bileği':'ankle','Dirsek, önkol ve el':'elbow'};
const muscles:Record<string,string>={shoulder:'infraspinatus',knee:'rectus femoris',ankle:'soleus',elbow:'extensor carpi radialis brevis'};
export const CONNECTIVE_FINDINGS:ModelFinding[]=CLINICAL_STRUCTURES.filter(s=>s.modelScope!=='context').flatMap(s=>(['right','left'] as const).map(side=>({
 id:`locate:${s.key}:${side}`,structureKey:s.key,side,region:regions[s.region],muscleKey:s.key.includes('biceps')?'biceps brachii':s.key.includes('quadriceps')||s.key==='patellar ligament'?'rectus femoris':muscles[regions[s.region]],displayName:s.name,
 group:'connective' as const,prompt:`${side==='right'?'Sağ':'Sol'} tarafta ${s.name.toLocaleLowerCase('tr')} yapısını modelde bul.`,answer:s.name,
 options:[...CLINICAL_STRUCTURES.filter(x=>x.modelScope!=='context').map(x=>x.name),'Kas veya kemik'],
 explanation:s.note,source:TENDON_INFO[s.key]?.sources[0].url??LIGAMENT_INFO[s.key]?.sources[0].url??'https://github.com/Z-Anatomy/Models-of-human-anatomy',
 rationales:Object.fromEntries([...CLINICAL_STRUCTURES.filter(x=>x.modelScope!=='context').map(x=>[x.name,x.key===s.key?s.note:`Seçilen yapı ${x.name}. Aranan yapının bağlantılarını ve ekleme göre konumunu yeniden incele.`]),['Kas veya kemik','Seçtiğin yüzey bağ, tendon veya menisküs geometrisi değildir.']]),
})));
export const MODEL_FINDINGS=[...CONNECTIVE_FINDINGS,...MUSCLE_FINDINGS,...NERVE_FINDINGS];
export const findingIds=(key:string,side?:'right'|'left')=>{
 const ids=MODEL_FINDINGS.filter(q=>q.structureKey===key&&(!side||q.side===side)).map(q=>q.id);
 const nerve=key.startsWith('nerve:')?NERVES.find(n=>n.id===key.slice(6)):undefined;
 const muscle=key.startsWith('muscle:')?MUSCLES.find(m=>m.key===key.slice(7)):nerve?MUSCLES.find(m=>m.key===primaryNerveMuscle(nerve)):undefined;
 return ids.length&&muscle?[...ids,muscle.key+'-action']:ids;
};
type FindingEnvelope={parts:Part[];candidateIds:string[];hidden:string[]};
const connectiveSceneCache=new WeakMap<Atlas,{envelopes:Map<string,FindingEnvelope>;selections:Map<string,ReturnType<typeof connectiveSelection>>}>();
function buildFindingScene(atlas:Atlas,id:string){
 const q=MODEL_FINDINGS.find(q=>q.id===id);if(!q)return;
 if(q.group!=='connective')return buildModelStudyScene(atlas,q);
 let cached=connectiveSceneCache.get(atlas);if(!cached){cached={envelopes:new Map(),selections:new Map()};connectiveSceneCache.set(atlas,cached);}
 const selection=(key:string)=>{const k=key+':'+q.side;let value=cached.selections.get(k);if(!value){value=connectiveSelection(atlas,key,q.side);cached.selections.set(k,value);}return value;};
 const envelopeKey=q.region+':'+q.side;let envelope=cached.envelopes.get(envelopeKey);
 if(!envelope){
  const items=CLINICAL_STRUCTURES.filter(s=>s.modelScope!=='context'&&regions[s.region]===q.region),candidateIds=items.flatMap(s=>selection(s.key).structures),contextIds=items.flatMap(s=>selection(s.key).context);
  const context=new Set(contextIds),visible=new Set([...candidateIds,...atlas.parts.filter(p=>context.has(p.id)&&p.system!=='connective').map(p=>p.id)]);
  envelope={parts:atlas.parts.filter(p=>visible.has(p.id)),candidateIds,hidden:atlas.parts.filter(p=>!visible.has(p.id)).map(p=>p.id)};
  cached.envelopes.set(envelopeKey,envelope);
 }
 const targetIds=selection(q.structureKey).structures;if(!targetIds.length)return;
 return {question:q,...envelope,targetIds,view:(CONNECTIVE_STUDIES[q.structureKey]?.view??'front') as View};
}
const sceneCache=new WeakMap<Atlas,Map<string,ReturnType<typeof buildFindingScene>>>();
export function findingScene(atlas:Atlas,id:string){let scenes=sceneCache.get(atlas);if(!scenes){scenes=new Map();sceneCache.set(atlas,scenes);}if(!scenes.has(id))scenes.set(id,buildFindingScene(atlas,id));return scenes.get(id);}
export function findingChoice(atlas:Atlas,id:string,partId:string){const scene=findingScene(atlas,id),part=atlas.parts.find(p=>p.id===partId);if(!scene||!part||!scene.parts.some(p=>p.id===partId))return;return scene.question.group!=='connective'?modelStudyChoice(atlas,scene.question,part):part.system==='connective'?clinicalStructure(part.name)?.name??'Kas veya kemik':'Kas veya kemik';}
export type FindingMesh={part:Part;positions:Float32Array;indices:Uint32Array};
export function projectFinding(meshes:FindingMesh[],view:View,width:number,height:number,candidateIds?:string[]){
 const matrix=view==='back'?[-1,0,0,0,1,0,0,0,-1]:view==='side'?[0,0,-1,0,1,0,1,0,0]:[1,0,0,0,1,0,0,0,1];
 const apply=(p:Float32Array,i:number)=>[matrix[0]*p[i]+matrix[1]*p[i+1]+matrix[2]*p[i+2],matrix[3]*p[i]+matrix[4]*p[i+1]+matrix[5]*p[i+2],matrix[6]*p[i]+matrix[7]*p[i+1]+matrix[8]*p[i+2]];
 const ids=candidateIds?new Set(candidateIds):undefined,candidates=meshes.filter(m=>ids?ids.has(m.part.id):m.part.system==='connective'),points=candidates.flatMap(m=>[m.part.bounds[0],m.part.bounds[1]].map(p=>apply(new Float32Array(p),0)));
 if(!points.length)return [];
 const lo=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],hi=[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))],scale=Math.min((width-80)/Math.max(hi[0]-lo[0],.08),(height-70)/Math.max(hi[1]-lo[1],.1)),cx=(hi[0]+lo[0])/2,cy=(hi[1]+lo[1])/2;
 return meshes.flatMap(m=>{const projected=Array.from({length:m.positions.length/3},(_,i)=>{const p=apply(m.positions,i*3);return [width/2+(p[0]-cx)*scale,height/2-(p[1]-cy)*scale,p[2]];});return Array.from({length:m.indices.length/3},(_,i)=>{const p=[projected[m.indices[i*3]],projected[m.indices[i*3+1]],projected[m.indices[i*3+2]]];return {partId:m.part.id,system:m.part.system,p,depth:(p[0][2]+p[1][2]+p[2][2])/3};});}).sort((a,b)=>a.depth-b.depth);
}
export type FindingTriangle=ReturnType<typeof projectFinding>[number];
export function pickFinding(triangles:FindingTriangle[],x:number,y:number,candidateIds?:string[]){
 const hit=(t:FindingTriangle)=>{const [a,b,c]=t.p,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)return false;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den;return u>=0&&v>=0&&u+v<=1;};
 // Surrounding anatomy is translucent; all tendon/ligament candidates share
 // the same priority. The requested answer is never used by the picker.
 const candidates=candidateIds?new Set(candidateIds):undefined;
 return [...triangles].reverse().find(t=>(candidates?candidates.has(t.partId):t.system==='connective')&&hit(t))?.partId??[...triangles].reverse().find(hit)?.partId;
}
