import * as T from './three-math';
import type {Atlas,Part} from './anatomy';
import type {ShoulderState,ShoulderSide} from './shoulder';
const distal=/\b(radius|ulna|metacarpal|capitate|hamate|lunate|pisiform|scaphoid|trapezium|trapezoid|triquetral)\b|phalanx.*(finger|thumb)/i;
export function armSegment(p:Part,side:ShoulderSide){if(p.system!=='skeletal'||!new RegExp(`\\b${side}\\b`,'i').test(p.name))return 0;return /\bhumerus\b/i.test(p.name)?1:distal.test(p.name)?2:0;}
export function angleFor(s:ShoulderState){const t=Math.max(0,Math.min(100,s.progress??0))/100;return s.id==='adduction'?90*(1-t):t*(s.id==='extension'?30:['internal','external'].includes(s.id)?45:90);}
export function jointAnchors(atlas:Atlas,side:ShoulderSide){
 const h=atlas.parts.find(p=>armSegment(p,side)===1);if(!h)throw new Error('Humerus missing');
 const [lo,hi]=h.bounds,sign=side==='left'?1:-1;
 // Teaching pivots estimated from the humerus envelope; not patient measurements.
 const shoulder=new T.Vector3(sign*(Math.min(Math.abs(lo[0]),Math.abs(hi[0]))+.022),hi[1]-.018,(lo[2]+hi[2])/2);
 const elbow=new T.Vector3(sign*(Math.max(Math.abs(lo[0]),Math.abs(hi[0]))-.022),lo[1]+.015,(lo[2]+hi[2])/2);
 return {shoulder,elbow};
}
export function around(p:T.Vector3,axis:T.Vector3,angle:number){return new T.Matrix4().makeTranslation(p.x,p.y,p.z).multiply(new T.Matrix4().makeRotationAxis(axis,angle)).multiply(new T.Matrix4().makeTranslation(-p.x,-p.y,-p.z));}
export function poseMatrices(atlas:Atlas,s:ShoulderState){
 const {shoulder,elbow}=jointAnchors(atlas,s.side),sign=s.side==='left'?1:-1,angle=T.MathUtils.degToRad(angleFor(s));
 let axis=new T.Vector3(1,0,0),a=-angle;
 if(s.id==='extension')a=angle;
 if(['abduction','adduction'].includes(s.id)){axis.set(0,0,1);a=sign*angle;}
 const rotation=['internal','external'].includes(s.id);
 if(rotation){axis.copy(elbow).sub(shoulder).normalize();a=(s.id==='internal'?sign:-sign)*angle;}
 const upper=around(shoulder,axis,a),lower=upper.clone();if(rotation)lower.multiply(around(elbow,new T.Vector3(1,0,0),-Math.PI/2));
 const scapula=new T.Matrix4();
 if(s.scapula&&['flexion','abduction','adduction'].includes(s.id)){
  const bone=atlas.parts.find(p=>p.name.toLowerCase()===s.side+' scapula');
  if(bone){const [lo,hi]=bone.bounds;const pivot=new T.Vector3(sign*(Math.max(Math.abs(lo[0]),Math.abs(hi[0]))-.012),hi[1]-.022,(lo[2]+hi[2])/2);scapula.copy(around(pivot,new T.Vector3(0,0,1),sign*T.MathUtils.degToRad(angleFor(s)/3)));upper.premultiply(scapula);lower.premultiply(scapula);}
 }
 return {upper,lower,shoulder,elbow,scapula};
}
export function advancePlayback(s:ShoulderState,delta=2):ShoulderState{const progress=Math.min(100,(s.progress??0)+delta);return {...s,progress,playing:progress<100};}

export function motionSegment(p:Part,s:ShoulderState){const arm=armSegment(p,s.side);return arm||(s.scapula&&['flexion','abduction','adduction'].includes(s.id)&&p.system==='skeletal'&&p.name.toLowerCase()===s.side+' scapula'?3:0);}
