import {DISTAL_STUDIES} from './distal-tendons';
import type {Atlas} from './anatomy';
import {clinicalStructure} from './clinical-structures';
const muscles:Record<string,string[]>={
 ...Object.fromEntries(DISTAL_STUDIES.map(s=>[s.key,s.muscles])),
 'quadriceps tendon':['rectus femoris','vastus lateralis','vastus medialis','vastus intermedius'],
 'patellar ligament':['rectus femoris','vastus lateralis','vastus medialis','vastus intermedius'],
 'biceps long head tendon':['long head of {side} biceps brachii'],
 'biceps distal tendon':['biceps brachii'],
 'common extensor tendon':['extensor carpi radialis brevis','extensor digitorum','extensor digiti minimi','extensor carpi ulnaris'],
 'calcaneal tendon':['gastrocnemius','soleus'],
 'infraspinatus tendon':['infraspinatus'],
 'supraspinatus tendon insertion surface':['supraspinatus'],
 'subscapularis tendon insertion surface':['subscapularis'],
 'teres minor tendon insertion surface':['teres minor']
};
// Preserve source geometry. Show the muscle continuation instead of inventing a
// bone attachment at the proximal tendon end. Side follows the selected mesh.
export function tendonContextParts(atlas:Atlas,selected:readonly string[]):string[]{
 const ids=new Set(selected),targets=new Map<string,string[]>();
 for(const p of atlas.parts){
  if(!ids.has(p.id)||p.system!=='connective')continue;
  const structure=clinicalStructure(p.name),side=p.name.toLowerCase().match(/\b(left|right)\b/)?.[1];
  if(structure&&side&&muscles[structure.key])targets.set(side,[...(targets.get(side)??[]),...muscles[structure.key]]);
 }
 return atlas.parts.filter(p=>[...targets].some(([side,keys])=>{
  const name=p.name.toLowerCase();
  if(!new RegExp(`\\b${side}\\b`,'i').test(name))return false;
  if(p.system==='muscular')return keys.some(k=>name.replace(/\s+muscle$/,'').endsWith(k.replace('{side}',side)));
  return keys.includes('extensor carpi radialis brevis')&&name===side+' extensor carpi radialis brevis proximal tendon';
 })).map(p=>p.id);
}
