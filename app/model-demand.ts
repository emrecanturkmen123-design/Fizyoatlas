import type {Atlas,SceneState} from './anatomy';
import {tendonContextParts} from './tendon-context';
import {muscleKeyMatches} from './education-data';
import {GAIT_PHASES} from './gait-data';
import {limbMuscleIds} from './limb-muscles';
import {shoulderRoles,SHOULDER_MOVES} from './shoulder';
import {cuffParts} from './shoulder-study';
import {spineRegion} from './spine';
export function requiredChunks(atlas:Atlas,s:SceneState){
 const selected=new Set(s.selected),hidden=new Set(s.hidden??[]),context=new Set(tendonContextParts(atlas,s.selected));
 const movement=!!s.gait||!!s.shoulder?.motion||!!s.elbow?.motion||!!s.lower?.motion||!!s.knee?.motion;
 const muscles=new Set(limbMuscleIds(atlas,s));
 if(s.shoulder?.anatomicalMuscles&&s.shoulder.cuff!==false)cuffParts(atlas,s.shoulder.side).filter(p=>p.system==='muscular').forEach(p=>muscles.add(p.id));
 if(s.shoulder?.anatomicalMuscles){const r=shoulderRoles(atlas,SHOULDER_MOVES.find(m=>m.id===s.shoulder!.id)!,s.shoulder.side);[...r.agonists,...(s.shoulder.antagonists!==false?r.antagonists:[])].forEach(id=>muscles.add(id));}
 const needed=atlas.parts.filter(p=>{
  if(hidden.has(p.id))return false;
  if(movement){
   if(p.system==='skeletal')return true;
   if(s.gait)return !!s.gait.muscles&&p.system==='muscular'&&GAIT_PHASES.some(phase=>phase.keys.some(k=>muscleKeyMatches(p.name,k)));
   if(s.elbow?.anatomicalMuscles&&p.system==='muscular'&&new RegExp('\\b'+s.elbow.side+'\\b','i').test(p.name)&&/biceps brachii|triceps brachii|brachialis|brachioradialis|anconeus|pronator|supinator/i.test(p.name))return true;
   if(muscles.has(p.id))return true;
   if(s.lower?.joint==='ankle'&&s.lower.anatomicalMuscles&&s.lower.achilles!==false&&p.system==='connective')return p.name.toLowerCase()===s.lower.side+' calcaneal tendon';
   if(s.knee?.tendons&&p.system==='connective')return p.name.toLowerCase()===s.knee.side+' patellar ligament'||!!s.knee.anatomicalMuscles&&p.name.toLowerCase()===s.knee.side+' quadriceps tendon';
   if(s.elbow?.anatomicalMuscles&&s.elbow.tendons&&p.system==='connective')return p.name.toLowerCase()===s.elbow.side+' biceps distal tendon'||['flexion','extension'].includes(s.elbow.id)&&p.name.toLowerCase()===s.elbow.side+' biceps long head tendon';
   if(s.shoulder?.anatomicalMuscles&&s.shoulder.tendons!==false&&p.system==='connective')return p.name.toLowerCase().startsWith(s.shoulder.side+' ')&&/infraspinatus|supraspinatus|subscapularis|teres minor/.test(p.name);
   return false;
  }
  if(hidden.has(p.id))return false;
  if(s.spine)return p.system==='skeletal'&&!!spineRegion(p);
  return s.isolate?selected.has(p.id):s.visible.includes(p.system)||selected.has(p.id)||context.has(p.id);
 });
 return [...new Set(needed.map(p=>p.chunk))];
}
