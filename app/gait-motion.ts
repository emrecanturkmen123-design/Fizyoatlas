import * as T from 'three';
import type {Atlas,Part} from './anatomy';
import {lowerAnchor} from './lower-motion';
import {kneeAnchor,kneeSegment} from './knee-motion';

export interface GaitState {progress:number;playing:boolean;speed:number;muscles:boolean;plane:boolean}
export type GaitSide='right'|'left';
export const GAIT_SAMPLES=[0,6,20,40,55,66,80,94] as const;
export const GAIT_STARTS=[0,2,10,30,50,60,73,87] as const;
export const GAIT_STRIDE=.82;
export const GAIT_GROUND=.003;
export function gaitPhase(progress:number){const p=T.MathUtils.clamp(progress,0,100);if(p===100)return 0;let i=0;while(i<7&&p>=GAIT_STARTS[i+1])i++;return i;}
export function gaitContact(progress:number){const p=((progress%100)+100)%100;return p<2?'Topuk teması':p<10?'Topuktan tabana':p<30?'Taban teması':p<50?'Ön ayak teması':p<60?'Parmak ucu teması':'Zeminden ayrı';}
export function gaitSupport(progress:number){const p=((progress%100)+100)%100;return p<10||p>=50&&p<60?'Çift destek':p<50?'Sağ tek destek':'Sol tek destek';}
export function gaitSegment(p:Part):{side:GaitSide;segment:'thigh'|'shin'|'foot'}|undefined{
 const side=/\bright\b/i.test(p.name)?'right':/\bleft\b/i.test(p.name)?'left':undefined;
 if(!side||p.system!=='skeletal')return;
 if(new RegExp('^'+side+' (femur|patella)$','i').test(p.name))return {side,segment:'thigh'};
 if(kneeSegment(p,{side}))return {side,segment:/\b(tibia|fibula)\b/i.test(p.name)?'shin':'foot'};
}
function smooth(t:number){t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);}
function track(p:number,keys:readonly (readonly [number,number])[]){let i=0;while(i<keys.length-2&&p>keys[i+1][0])i++;const [a,av]=keys[i],[b,bv]=keys[i+1];return T.MathUtils.lerp(av,bv,smooth((p-a)/(b-a)));}
interface LegRest {hip:T.Vector3;knee:T.Vector3;ankle:T.Vector3;foot:Float32Array;heel:T.Vector3;toe:T.Vector3;lengths:[number,number]}
export interface GaitModel {atlas:Atlas;legs:Record<GaitSide,LegRest>}
export function createGaitModel(atlas:Atlas,geometries:Map<string,T.BufferGeometry>):GaitModel{
 const legs={} as Record<GaitSide,LegRest>;
 for(const side of ['right','left'] as const){
  const hip=lowerAnchor(atlas,{joint:'hip',side}),knee=kneeAnchor(atlas,side),ankle=lowerAnchor(atlas,{joint:'ankle',side});
  const footParts=atlas.parts.filter(p=>{const seg=gaitSegment(p);return seg?.side===side&&seg.segment==='foot';});
  const arrays=footParts.map(p=>geometries.get(p.id)?.attributes.position.array).filter(Boolean) as Float32Array[];
  const foot=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){foot.set(a,offset);offset+=a.length;}
  // Actual plantar vertices, rather than bounding-box corners, determine contact.
  const extremum=(front:boolean)=>{let best=Infinity,out=ankle.clone();for(let i=0;i<foot.length;i+=3){const y=foot[i+1],z=foot[i+2];if(front?z<.08:z>-.04)continue;const score=y+(front?-.015*z:.015*z);if(score<best){best=score;out.fromArray(foot,i);}}return out;};
  legs[side]={hip,knee,ankle,foot,heel:extremum(false),toe:extremum(true),lengths:[hip.distanceTo(knee),knee.distanceTo(ankle)]};
 }
 return {atlas,legs};
}
function mapSegment(from:T.Vector3,to:T.Vector3,start:T.Vector3,end:T.Vector3){
 const rotation=new T.Quaternion().setFromUnitVectors(to.clone().sub(from).normalize(),end.clone().sub(start).normalize());
 return new T.Matrix4().makeTranslation(...start.toArray()).multiply(new T.Matrix4().makeRotationFromQuaternion(rotation)).multiply(new T.Matrix4().makeTranslation(...from.clone().negate().toArray()));
}
export interface GaitLegPose {thigh:T.Matrix4;shin:T.Matrix4;foot:T.Matrix4;hip:T.Vector3;knee:T.Vector3;ankle:T.Vector3;contact:T.Vector3;clearance:number;phase:number;pitch:number}
export interface GaitPose {root:T.Matrix4;legs:Record<GaitSide,GaitLegPose>;progress:number}
export function gaitPose(model:GaitModel,progress:number):GaitPose{
 const t=T.MathUtils.clamp(progress,0,100)/100;
 const root=new T.Matrix4().makeTranslation(.009*Math.sin(2*Math.PI*t),0,GAIT_STRIDE*t);
 const legs={} as Record<GaitSide,GaitLegPose>;
 const feet={} as Record<GaitSide,Pick<GaitLegPose,'foot'|'contact'|'clearance'|'phase'|'pitch'>>;
 for(const side of ['right','left'] as const){
  const rest=model.legs[side],shift=side==='right'?0:.5,cycle=Math.floor(t+shift),p=t+shift-cycle;
  const pitch=T.MathUtils.degToRad(track(p,[[0,-12],[.1,0],[.3,0],[.5,20],[.6,32],[.73,0],[.87,-2],[1,-12]]));
  const swing=p>=.6,s=smooth((p-.6)/.4),heelWeight=1-smooth((p-.1)/.2),pivot=rest.toe.clone().lerp(rest.heel,heelWeight);
  const plantedZ=(cycle-shift+.25)*GAIT_STRIDE;
  const nextZ=plantedZ+GAIT_STRIDE;
  const z=swing?T.MathUtils.lerp(plantedZ,nextZ,s):plantedZ;
  // Rotate about a stationary plantar pivot; toe-off and heel strike share
  // identical endpoint transforms with the adjacent stance interval.
  const swingPivot=rest.toe.clone().lerp(rest.heel,s);
  if(swing)pivot.copy(swingPivot);
  const rotation=new T.Matrix4().makeRotationX(pitch);
  let minY=Infinity;const point=new T.Vector3();
  for(let i=0;i<rest.foot.length;i+=3){point.fromArray(rest.foot,i).sub(pivot).applyMatrix4(rotation);minY=Math.min(minY,point.y);}
  const lift=swing?track(p,[[.6,0],[.69,.14],[.8,.08],[.9,.045],[1,0]]):0;
  const target=new T.Vector3(pivot.x,GAIT_GROUND-minY+lift,z+pivot.z);
  const foot=new T.Matrix4().makeTranslation(...target.toArray()).multiply(rotation).multiply(new T.Matrix4().makeTranslation(...pivot.clone().negate().toArray()));
  let lowest=Infinity,contact=new T.Vector3();for(let i=0;i<rest.foot.length;i+=3){point.fromArray(rest.foot,i).applyMatrix4(foot);if(point.y<lowest){lowest=point.y;contact.copy(point);}}
  feet[side]={foot,contact,clearance:lowest-GAIT_GROUND,phase:p*100,pitch};
 }
 // During single support, set pelvis height from the supporting knee's small
 // stance flexion. A fixed low pelvis creates a crouched gait in every pose.
 const support:GaitSide=t%1<.5?'right':'left',rest=model.legs[support],supportAnkle=rest.ankle.clone().applyMatrix4(feet[support].foot);
 const flex=T.MathUtils.degToRad(track(feet[support].phase/100,[[0,5],[.06,15],[.2,5],[.4,5],[.5,5]]));
 const [a,b]=rest.lengths,reach=Math.sqrt(a*a+b*b+2*a*b*Math.cos(flex));
 const dx=rest.hip.x+root.elements[12]-supportAnkle.x,dz=rest.hip.z+root.elements[14]-supportAnkle.z;
 let bodyY=supportAnkle.y+Math.sqrt(Math.max(0,reach*reach-dx*dx-dz*dz))-rest.hip.y;
 // The other leg must remain reachable at double support and terminal swing.
 for(const side of ['right','left'] as const){const r=model.legs[side],ankle=r.ankle.clone().applyMatrix4(feet[side].foot),maxReach=r.lengths[0]+r.lengths[1]-.0001,x=r.hip.x+root.elements[12]-ankle.x,z=r.hip.z+root.elements[14]-ankle.z;bodyY=Math.min(bodyY,ankle.y+Math.sqrt(Math.max(0,maxReach*maxReach-x*x-z*z))-r.hip.y);}
 root.elements[13]=bodyY;
 for(const side of ['right','left'] as const){
  const rest=model.legs[side],foot=feet[side].foot;
  const hip=rest.hip.clone().applyMatrix4(root),ankle=rest.ankle.clone().applyMatrix4(foot),delta=ankle.clone().sub(hip),distance=delta.length(),[upper,lower]=rest.lengths;
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const direction=delta.clone().normalize(),forward=new T.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
  const knee=hip.clone().addScaledVector(direction,along).addScaledVector(forward,Math.sqrt(Math.max(0,upper*upper-along*along)));
  const thigh=mapSegment(rest.hip,rest.knee,hip,knee),shin=mapSegment(rest.knee,rest.ankle,knee,ankle);
  legs[side]={...feet[side],thigh,shin,hip,knee,ankle};
 }
 return {root,legs,progress};
}
export function gaitBoneMatrix(part:Part,pose:GaitPose){const seg=gaitSegment(part);return seg?pose.legs[seg.side][seg.segment]:pose.root;}
