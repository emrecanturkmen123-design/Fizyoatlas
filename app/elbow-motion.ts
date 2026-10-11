import * as T from './three-math';
import type {Atlas,Part} from './anatomy';
import {armSegment,around,jointAnchors} from './shoulder-motion';
export interface ElbowState {id:'flexion'|'extension'|'pronation'|'supination';side:'left'|'right';progress:number;playing:boolean;motion:boolean;muscleDemo?:boolean;anatomicalMuscles?:boolean;muscleAttachments?:boolean;tendons?:boolean;plane?:boolean;contraction?:'concentric'|'eccentric'|'isometric'}
export const ELBOW_MOVES=[
 {id:'flexion',name:'Fleksiyon',description:'Önkolu kola yaklaştırma. Sagittal düzlemde, mediolateral eksen çevresinde.',keys:['biceps brachii','brachialis','brachioradialis']},
 {id:'extension',name:'Ekstansiyon',description:'Bükülü dirseği açma. Sagittal düzlemde, mediolateral eksen çevresinde.',keys:['triceps brachii','anconeus']},
 {id:'pronation',name:'Pronasyon',description:'Radiusun ulna çevresinde dönmesiyle önkolu pronasyon yönüne çevirme. Dirsek 90° bükülüdür; ulna bu şemada sabittir.',keys:['pronator teres','pronator quadratus']},
 {id:'supination',name:'Supinasyon',description:'Önkolu supinasyon yönüne çevirme. Radius ve ulna daha paralel konuma yaklaşır. Dirsek 90° bükülüdür.',keys:['biceps brachii','supinator']},
] as const;
export function elbowAngle(s:ElbowState){const t=Math.max(0,Math.min(100,s.progress))/100;if(s.contraction&&['flexion','extension'].includes(s.id))return s.contraction==='isometric'?90:s.contraction==='eccentric'?120-90*t:30+90*t;return s.id==='extension'?120*(1-t):t*(['pronation','supination'].includes(s.id)?80:120);}
export function elbowSegment(p:Part,s:ElbowState){if(armSegment(p,s.side)!==2)return 0;return ['pronation','supination'].includes(s.id)&&!new RegExp(`^${s.side} ulna$`,'i').test(p.name)?2:1;}
// Regional centres extracted from the proximal 12 mm of radius and distal 12 mm of ulna
// in this reference mesh; approximate, not validated clinical joint centres.
const CENTRES={right:{prox:[-.231120,1.107929,-.029027],dist:[-.237781,.888975,.013733]},left:{prox:[.230556,1.108547,-.027348],dist:[.239188,.889597,.014624]}};
export function elbowMatrices(atlas:Atlas,s:ElbowState){const {elbow}=jointAnchors(atlas,s.side),rotation=['pronation','supination'].includes(s.id),angle=elbowAngle(s),upper=around(elbow,new T.Vector3(1,0,0),-T.MathUtils.degToRad(rotation?90:angle));const lower=upper.clone();if(rotation){const c=CENTRES[s.side],prox=new T.Vector3().fromArray(c.prox),axis=new T.Vector3().fromArray(c.dist).sub(prox).normalize(),sign=s.side==='left'?1:-1;lower.multiply(around(prox,axis,T.MathUtils.degToRad(sign*(90+(s.id==='pronation'?angle:-angle)))));}return {upper,lower,scapula:new T.Matrix4(),elbow};}
export function elbowMuscles(atlas:Atlas,s:ElbowState){const m=ELBOW_MOVES.find(m=>m.id===s.id)!;return atlas.parts.filter(p=>p.system==='muscular'&&new RegExp(`\\b${s.side}\\b`,'i').test(p.name)&&m.keys.some(k=>new RegExp('\\b'+k+'\\b','i').test(p.name))).map(p=>p.id);}

export function elbowRotationAxis(side:ElbowState['side']){return new T.Vector3().fromArray(CENTRES[side].dist).sub(new T.Vector3().fromArray(CENTRES[side].prox)).normalize();}
