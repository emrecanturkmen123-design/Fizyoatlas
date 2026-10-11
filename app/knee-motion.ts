import * as T from './three-math';
import type {Atlas,Part} from './anatomy';
import {around} from './shoulder-motion';
import {muscleKeyMatches} from './education-data';
export interface KneeState {id:'flexion'|'extension';side:'left'|'right';progress:number;playing:boolean;motion:boolean;anatomicalMuscles?:boolean;antagonists:boolean;plane?:boolean;tendons?:boolean}
export const KNEE_MOVES=[{id:'flexion',name:'Fleksiyon',hint:'Bacağı uyluğa doğru, arkaya bükme.',keys:['biceps femoris','semitendinosus','semimembranosus','gastrocnemius']},{id:'extension',name:'Ekstansiyon',hint:'Bükülü dizi açma.',keys:['rectus femoris','vastus lateralis','vastus medialis','vastus intermedius']}] as const;
export function kneeAngle(s:KneeState){const t=Math.max(0,Math.min(100,s.progress))/100;return 120*(s.id==='extension'?1-t:t);}
export function kneeSegment(p:Part,s:Pick<KneeState,'side'>){return p.system==='skeletal'&&!/cartilage/i.test(p.name)&&new RegExp('\\b'+s.side+'\\b','i').test(p.name)&&(/\b(tibia|fibula|talus|calcaneus|cuboid|cuneiform|metatarsal)\b|navicular.*foot|sesamoid.*foot|phalanx.*toe/i.test(p.name))?1:0;}
export function kneeAnchor(atlas:Atlas,side:KneeState['side']){const f=atlas.parts.find(p=>p.name.toLowerCase()===side+' femur');if(!f)throw new Error('Femur missing');const [lo,hi]=f.bounds;const tibia=atlas.parts.find(p=>p.name.toLowerCase()===side+' tibia')!;return new T.Vector3((tibia.bounds[0][0]+tibia.bounds[1][0])/2,lo[1]+.022,(lo[2]+hi[2])/2);}
export function kneeMatrices(atlas:Atlas,s:KneeState){const knee=kneeAnchor(atlas,s.side),upper=around(knee,new T.Vector3(1,0,0),T.MathUtils.degToRad(kneeAngle(s)));return {upper,lower:upper,scapula:new T.Matrix4(),knee};}
export function kneeRoles(atlas:Atlas,s:KneeState){const target=(id:KneeState['id'])=>{const keys=KNEE_MOVES.find(m=>m.id===id)!.keys;return atlas.parts.filter(p=>p.system==='muscular'&&new RegExp('\\b'+s.side+'\\b','i').test(p.name)&&keys.some(k=>muscleKeyMatches(p.name,k))).map(p=>p.id);};return {agonists:target(s.id),antagonists:target(s.id==='flexion'?'extension':'flexion')};}
