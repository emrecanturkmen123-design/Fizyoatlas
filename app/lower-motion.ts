import * as T from './three-math';
import type {Atlas,Part} from './anatomy';
import {around} from './shoulder-motion';
import {kneeSegment} from './knee-motion';
import {muscleKeyMatches} from './education-data';
export type LowerJoint='hip'|'ankle';
export interface LowerState {joint:LowerJoint;id:string;side:'left'|'right';progress:number;playing:boolean;motion:boolean;anatomicalMuscles?:boolean;achilles?:boolean;plane:boolean;antagonists:boolean}
export const LOWER_MOVES=[
 {joint:'hip',id:'flexion',name:'Fleksiyon',max:60,plane:'Sagittal',axis:'Mediolateral',keys:['iliacus','rectus femoris'],opposite:'extension',hint:'Diz düzken uyluğu öne kaldır. Iliacus, iliopsoas grubunun bir parçasıdır.'},
 {joint:'hip',id:'extension',name:'Ekstansiyon',max:20,plane:'Sagittal',axis:'Mediolateral',keys:['gluteus maximus','semitendinosus','semimembranosus'],opposite:'flexion',hint:'Uyluğu gövdenin arkasına götür.'},
 {joint:'hip',id:'abduction',name:'Abdüksiyon',max:35,plane:'Frontal',axis:'Anteroposterior',keys:['gluteus medius','gluteus minimus'],opposite:'adduction',hint:'Bacağı orta hattan yana uzaklaştır. Gluteus medius ve minimus katkı verir.'},
 {joint:'hip',id:'adduction',name:'Addüksiyon',max:35,plane:'Frontal',axis:'Anteroposterior',keys:['adductor longus'],opposite:'abduction',hint:'Yana açılmış bacağı orta hatta geri getir.'},
 {joint:'hip',id:'internal',name:'İç rotasyon',max:30,plane:'Transversal',axis:'Longitudinal',keys:['gluteus medius','gluteus minimus'],opposite:'external',hint:'Femuru içe döndür. Gluteus medius ve minimusun ön lifleri katkı verir; bu, tüm liflerin tek görevi değildir.'},
 {joint:'hip',id:'external',name:'Dış rotasyon',max:30,plane:'Transversal',axis:'Longitudinal',keys:['gluteus maximus'],opposite:'internal',hint:'Femuru dışa döndür. Gösterim, yaklaşık düşey uzun eksen çevresindedir.'},
 {joint:'ankle',id:'dorsiflexion',name:'Dorsifleksiyon',max:20,plane:'Sagittal',axis:'Mediolateral',keys:['tibialis anterior'],opposite:'plantarflexion',hint:'Ayak sırtını bacağa yaklaştır.'},
 {joint:'ankle',id:'plantarflexion',name:'Plantar fleksiyon',max:40,plane:'Sagittal',axis:'Mediolateral',keys:['gastrocnemius','soleus','tibialis posterior','fibularis longus','fibularis brevis'],opposite:'dorsiflexion',hint:'Ayağı aşağı yönlendir. Gastrocnemius ve soleus başlıca kuvveti sağlar; tibialis posterior ve fibularis kasları katkı verir. İnversiyon ve eversiyon burada gösterilmez.'}
] as const;
export function lowerMove(s:Pick<LowerState,'joint'|'id'>){const m=LOWER_MOVES.find(m=>m.joint===s.joint&&m.id===s.id);if(!m)throw new Error('Unknown lower limb movement');return m;}
export function lowerAngle(s:LowerState){const t=T.MathUtils.clamp(s.progress,0,100)/100;return lowerMove(s).max*(s.id==='adduction'?1-t:t);}
export function lowerSegment(p:Part,s:Pick<LowerState,'joint'|'side'>){if(p.system!=='skeletal'||!new RegExp('\\b'+s.side+'\\b','i').test(p.name))return 0;const distal=!!kneeSegment(p,s);if(s.joint==='ankle')return distal&&!/\b(tibia|fibula)\b/i.test(p.name)?1:0;return distal||new RegExp('^'+s.side+' (femur|patella)$','i').test(p.name)?1:0;}
export function lowerAnchor(atlas:Atlas,s:Pick<LowerState,'joint'|'side'>){const p=atlas.parts.find(p=>p.name.toLowerCase()===s.side+(s.joint==='hip'?' femur':' talus'));if(!p)throw new Error('Joint bone missing');const [lo,hi]=p.bounds;if(s.joint==='ankle')return new T.Vector3((lo[0]+hi[0])/2,hi[1]-.012,(lo[2]+hi[2])/2);return new T.Vector3(s.side==='left'?lo[0]+.022:hi[0]-.022,hi[1]-.025,(lo[2]+hi[2])/2);}
export function lowerAxis(s:LowerState){return new T.Vector3(...(lowerMove(s).plane==='Frontal'?[0,0,1]:lowerMove(s).plane==='Transversal'?[0,1,0]:[1,0,0]) as [number,number,number]);}
export function lowerMatrices(atlas:Atlas,s:LowerState){const sign=s.side==='left'?1:-1,angle=lowerAngle(s),factor=['flexion','dorsiflexion'].includes(s.id)?-1:['abduction','adduction','external'].includes(s.id)?sign:s.id==='internal'?-sign:1;const upper=around(lowerAnchor(atlas,s),lowerAxis(s),T.MathUtils.degToRad(angle*factor));return {upper,lower:upper,scapula:new T.Matrix4()};}
export function lowerRoles(atlas:Atlas,s:LowerState){const m=lowerMove(s),opp=lowerMove({...s,id:m.opposite});const select=(keys:readonly string[])=>atlas.parts.filter(p=>p.system==='muscular'&&new RegExp('\\b'+s.side+'\\b','i').test(p.name)&&keys.some(k=>muscleKeyMatches(p.name,k))).map(p=>p.id);return {agonists:select(m.keys),antagonists:select(opp.keys)};}
