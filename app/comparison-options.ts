import type {Atlas,Part} from './anatomy';
import {CLINICAL_STRUCTURES} from './clinical-structures';
import {TENDON_COMPARISONS,comparisonFor} from './tendon-comparisons';
import type {Vec3} from './anatomy-lab-geometry';

export function suggestedComparison(key:string){
 const pair=TENDON_COMPARISONS.find(p=>p.id===comparisonFor(key));
 const other=pair?.sides.find(s=>s.route.structure&&s.route.structure!==key)?.route.structure;
 if(other)return other;
 const pairs:Record<string,string>={
  'calcaneal tendon':'tibialis anterior tendon',
  'flexor digitorum profundus tendon':'flexor digitorum superficialis tendon',
  'flexor digitorum superficialis tendon':'flexor digitorum profundus tendon',
  'flexor pollicis longus tendon':'extensor pollicis longus tendon',
  'extensor pollicis longus tendon':'flexor pollicis longus tendon',
  'tibialis anterior tendon':'tibialis posterior tendon',
  'tibialis posterior tendon':'fibularis longus tendon',
  'fibularis longus tendon':'fibularis brevis tendon',
  'fibularis brevis tendon':'fibularis longus tendon',
 };
 if(pairs[key]&&CLINICAL_STRUCTURES.some(s=>s.key===pairs[key]))return pairs[key];
 const structure=CLINICAL_STRUCTURES.find(s=>s.key===key);
 return CLINICAL_STRUCTURES.find(s=>s.key!==key&&s.region===structure?.region&&s.kind===structure?.kind)?.key
  ??CLINICAL_STRUCTURES.find(s=>s.key!==key&&s.region===structure?.region)?.key
  ??'patellar ligament';
}
function bounds(parts:Part[]){
 if(!parts.length)return {center:[0,0,0] as Vec3,span:.1};
 const min=[0,1,2].map(i=>Math.min(...parts.map(p=>p.bounds[0][i])));
 const max=[0,1,2].map(i=>Math.max(...parts.map(p=>p.bounds[1][i])));
 // A bounding-sphere diameter fits every shared camera angle at zoom 1.
 return {center:min.map((v,i)=>(v+max[i])/2) as Vec3,span:Math.max(.04,Math.hypot(...max.map((v,i)=>v-min[i])))};
}
export function comparisonFrames(atlas:Atlas,leftIds:string[],rightIds:string[],frame:'centered'|'aligned'){
 const left=atlas.parts.filter(p=>leftIds.includes(p.id)),right=atlas.parts.filter(p=>rightIds.includes(p.id));
 if(frame==='aligned'){const shared=bounds([...left,...right]);return [shared,shared];}
 const a=bounds(left),b=bounds(right),span=Math.max(a.span,b.span);
 return [{center:a.center,span},{center:b.center,span}];
}
