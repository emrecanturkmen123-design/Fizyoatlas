import {Vector3,Matrix4,MathUtils} from './three-math';
import type {Atlas,Part} from './anatomy';
import {around} from './shoulder-motion';
export const HAND_SOURCE='https://anatomy.ttuhscep.edu/schemes/forearm_tables.html';
export const HAND_INTRINSIC_SOURCE='https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-upper-limb/';
export type HandDigit='index'|'middle'|'ring'|'little';
export interface HandState{id:HandMoveId;side:'left'|'right';digit:HandDigit|'all';progress:number;playing:boolean;motion:boolean;anatomicalMuscles?:boolean;tendons?:boolean;plane?:boolean}
export const HAND_MOVES=[
 {id:'wrist-flexion',name:'El bileği fleksiyonu',group:'wrist',keys:['flexor carpi radialis','flexor carpi ulnaris'],description:'Elin palmar yüzünü önkola yaklaştır.'},
 {id:'wrist-extension',name:'El bileği ekstansiyonu',group:'wrist',keys:['extensor carpi radialis longus','extensor carpi radialis brevis','extensor carpi ulnaris'],description:'Elin dorsal yüzünü önkola yaklaştır.'},
 {id:'radial-deviation',name:'Radial deviasyon',group:'wrist',keys:['flexor carpi radialis','extensor carpi radialis longus','extensor carpi radialis brevis'],description:'Eli başparmak tarafına yönelt.'},
 {id:'ulnar-deviation',name:'Ulnar deviasyon',group:'wrist',keys:['flexor carpi ulnaris','extensor carpi ulnaris'],description:'Eli küçük parmak tarafına yönelt.'},
 {id:'finger-flexion',name:'Parmakları bükme',group:'fingers',keys:['flexor digitorum superficialis','flexor digitorum profundus'],description:'II–V parmakların MCP, PIP ve DIP eklemleri birlikte bükülür.'},
 {id:'finger-extension',name:'Parmakları açma',group:'fingers',keys:['extensor digitorum'],description:'Bükülü parmakları referans konuma aç. İnterosseiler ve lumbrikaller IP ekstansiyonuna da katkı verir.'},
 {id:'mcp-flexion',name:'MCP fleksiyonu',group:'fingers',keys:['flexor digitorum superficialis','flexor digitorum profundus'],description:'Yalnız metakarp–proksimal falanks eklemini bük; IP eklemleri referans konumunu korur.'},
 {id:'pip-flexion',name:'PIP fleksiyonu',group:'fingers',keys:['flexor digitorum superficialis','flexor digitorum profundus'],description:'Proksimal–orta falanks eklemini bük.'},
 {id:'dip-flexion',name:'DIP fleksiyonu',group:'fingers',keys:['flexor digitorum profundus'],description:'Orta–distal falanks eklemini bük. FDS bu ekleme doğrudan tutunmaz.'},
 {id:'thumb-flexion',name:'Başparmak fleksiyonu',group:'thumb',keys:['flexor pollicis longus'],description:'Başparmağın MCP ve IP eklemleri bükülür; IP fleksiyonuna FPL katkı verir.'},
 {id:'thumb-extension',name:'Başparmak ekstansiyonu',group:'thumb',keys:['extensor pollicis longus','extensor pollicis brevis'],description:'MCP ve IP eklemleri açılır. EPL IP; EPB MCP ekstansiyonuna katkı verir.'},
 {id:'thumb-abduction',name:'Başparmak palmar abdüksiyonu',group:'thumb',keys:['abductor pollicis brevis'],description:'Başparmağı avuç düzleminden öne uzaklaştır.'},
 {id:'thumb-opposition',name:'Başparmak opozisyonu',group:'thumb',keys:['opponens pollicis','abductor pollicis brevis'],description:'Birinci metakarpı döndürerek başparmağı avuç içine yönelt. Birleşik CMC hareketinin yaklaşık gösterimidir.'},
] as const;
export type HandMoveId=typeof HAND_MOVES[number]['id'];
export const HAND_DIGITS:HandDigit[]=['index','middle','ring','little'];
export const HAND_DIGIT_NAMES:Record<HandDigit|'all',string>={all:'II–V birlikte',index:'İşaret parmağı',middle:'Orta parmak',ring:'Yüzük parmağı',little:'Küçük parmak'};
const V=(p:readonly number[])=>new Vector3().fromArray([...p]);
// Approximate source-mesh contact centres. These are teaching pivots, not clinical joint centres.
const PIVOTS={
 right:{index:[[-.286055,.799062,.039134],[-.298746,.766117,.054765],[-.305036,.750591,.071384]],middle:[[-.266283,.800839,.039013],[-.271588,.763733,.061803],[-.274650,.741614,.080218]],ring:[[-.246774,.805916,.040091],[-.249048,.770169,.060725],[-.251371,.749304,.080021]],little:[[-.229809,.812448,.041963],[-.225867,.782548,.057203],[-.222087,.766331,.070736]],thumb:[[-.274074,.869054,.029208],[-.303912,.841700,.048289],[-.315777,.818804,.061999]]},
 left:{index:[[.285262,.799003,.039055],[.297712,.765573,.055301],[.306665,.751339,.071527]],middle:[[.265885,.800689,.039327],[.270920,.763412,.061660],[.274051,.741491,.080093]],ring:[[.247005,.805048,.038795],[.249464,.769622,.060199],[.249283,.749307,.079882]],little:[[.229828,.812171,.041592],[.225051,.782984,.057619],[.222700,.766487,.070810]],thumb:[[.274828,.868715,.028364],[.303869,.841752,.048236],[.314148,.817456,.061418]]},
};
export function handPartSide(p:Part){const x=(p.bounds[0][0]+p.bounds[1][0])/2;return x<0?'right':'left';}
export function handBone(p:Part,side:HandState['side']){
 return p.system==='skeletal'&&handPartSide(p)===side&&/metacarpal|phalanx of (?:right|left) (?:thumb\b|(?:index|middle|ring|little) finger\b)|\b(scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate)\b/i.test(p.name);
}
export function handBoneChain(p:Part):{digit:HandDigit|'thumb';segment:number}|undefined{
 const finger=p.name.match(/^(Proximal|Middle|Distal) phalanx of (right|left) (thumb|(?:index|middle|ring|little)(?= finger\b))/i);
 if(finger)return {digit:finger[3].toLowerCase() as HandDigit|'thumb',segment:{proximal:1,middle:2,distal:3}[finger[1].toLowerCase() as 'proximal'|'middle'|'distal']};
 if(/first metacarpal/i.test(p.name))return {digit:'thumb',segment:0};
}
export function handContextParts(atlas:Atlas,side:HandState['side']){return atlas.parts.filter(p=>handBone(p,side)||p.system==='skeletal'&&handPartSide(p)===side&&/\b(radius|ulna|humerus)\b/i.test(p.name));}
export function handMuscleParts(atlas:Atlas,s:HandState){const keys=HAND_MOVES.find(m=>m.id===s.id)!.keys;return handSoftParts(atlas,s).filter(p=>p.system==='muscular'&&keys.some(k=>p.name.toLowerCase().includes(k))); }
// Two complete FPB meshes have swapped side labels; verified head surfaces remain.
export function handSoftParts(atlas:Atlas,s:HandState){return atlas.parts.filter(p=>!['FJ1469','FJ1469M'].includes(p.id)&&handPartSide(p)===s.side&&p.bounds[1][1]>.70&&p.bounds[0][1]<1.18&&(p.system==='muscular'&&/carpi|digitorum|pollicis|lumbrical|interossei of.*hand|digiti minimi|indicis/i.test(p.name)||p.system==='connective'&&p.clinicalKey&&/digitorum|pollicis/.test(p.clinicalKey)));}
export function handProgress(s:HandState){return MathUtils.clamp(s.progress,0,100)/100;}
export function handAngles(s:HandState){const t=handProgress(s),close=s.id==='finger-extension'||s.id==='thumb-extension'?1-t:t;return {wrist:s.id==='wrist-flexion'?45*t:s.id==='wrist-extension'?-40*t:0,deviation:s.id==='radial-deviation'?20*t:s.id==='ulnar-deviation'?-25*t:0,mcp:['finger-flexion','finger-extension','mcp-flexion'].includes(s.id)?50*close:0,pip:['finger-flexion','finger-extension','pip-flexion'].includes(s.id)?60*close:0,dip:['finger-flexion','finger-extension','dip-flexion'].includes(s.id)?35*close:0,thumbMcp:['thumb-flexion','thumb-extension'].includes(s.id)?30*close:s.id==='thumb-opposition'?15*t:0,thumbIp:['thumb-flexion','thumb-extension'].includes(s.id)?40*close:s.id==='thumb-opposition'?12*t:0,thumbAbduction:s.id==='thumb-abduction'?25*t:s.id==='thumb-opposition'?15*t:0,opposition:s.id==='thumb-opposition'?55*t:0};}
export interface HandPose{wrist:Matrix4;matrices:Map<string,Matrix4>;chains:Record<string,Matrix4[]>;palmar:Vector3;wristPoint:Vector3;pivots:typeof PIVOTS['right']}
export function handPose(atlas:Atlas,s:HandState):HandPose{
 const pivots=PIVOTS[s.side],wristPoint=new Vector3(s.side==='right'?-.253:.253,.887,.020);
 const index=V(pivots.index[0]).sub(wristPoint),little=V(pivots.little[0]).sub(wristPoint),palmar=index.clone().cross(little).normalize();if(palmar.z<0)palmar.negate();
 const long=V(pivots.middle[0]).sub(wristPoint).normalize(),flexAxis=long.clone().cross(palmar).normalize(),a=handAngles(s),rad=MathUtils.degToRad;
 const wrist=around(wristPoint,flexAxis,rad(a.wrist)).multiply(around(wristPoint,palmar,rad(a.deviation*(s.side==='right'?-1:1))));
 const chains:Record<string,Matrix4[]>={};
 for(const digit of HAND_DIGITS){const p=pivots[digit],axis=V(p[1]).sub(V(p[0])).cross(palmar).normalize(),active=s.digit==='all'||s.digit===digit;
  const mcp=wrist.clone().multiply(around(V(p[0]),axis,rad(active?a.mcp:0))),pip=mcp.clone().multiply(around(V(p[1]),axis,rad(active?a.pip:0))),dip=pip.clone().multiply(around(V(p[2]),axis,rad(active?a.dip:0)));chains[digit]=[wrist,mcp,pip,dip];
 }
 const tp=pivots.thumb,thumbLong=V(tp[1]).sub(V(tp[0])).normalize(),sign=s.side==='right'?1:-1;
 const cmc=wrist.clone().multiply(around(V(tp[0]),new Vector3(0,sign,0),rad(a.thumbAbduction))).multiply(around(V(tp[0]),palmar,rad(sign*a.opposition))).multiply(around(V(tp[0]),thumbLong,rad(sign*a.opposition*.3)));
 const thumbAxis=palmar.clone().multiplyScalar(s.side==='right'?1:-1),tmcp=cmc.clone().multiply(around(V(tp[1]),thumbAxis,rad(a.thumbMcp))),tip=tmcp.clone().multiply(around(V(tp[2]),thumbAxis,rad(a.thumbIp)));chains.thumb=[cmc,tmcp,tip,tip];
 const matrices=new Map<string,Matrix4>();for(const p of atlas.parts.filter(p=>handBone(p,s.side))){const c=handBoneChain(p);matrices.set(p.id,c?chains[c.digit][c.digit==='thumb'&&c.segment===3?2:c.segment]:wrist);}
 return {wrist,matrices,chains,palmar,wristPoint,pivots};
}
