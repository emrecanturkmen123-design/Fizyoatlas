import type {Atlas} from './anatomy';
import type {ShoulderSide} from './shoulder';
import {tendonParts} from './tendon-model';
/** One mapping shared by the study panel, moving surfaces and detail navigation. */
export const CUFF = [
 {key:'supraspinatus',name:'Supraspinatus',tendon:'supraspinatus tendon insertion surface',coverage:'Kaynak tendon gövdesi · yaklaşık doku sınırı',move:'abduction'},
 {key:'infraspinatus',name:'Infraspinatus',tendon:'infraspinatus tendon',coverage:'Kaynak tendon bölgesi',move:'external'},
 {key:'teres minor',name:'Teres minor',tendon:'teres minor tendon insertion surface',coverage:'Kaynak tendon gövdesi · yaklaşık doku sınırı',move:'external'},
 {key:'subscapularis',name:'Subscapularis',tendon:'subscapularis tendon insertion surface',coverage:'Kaynak tendon gövdesi · yaklaşık doku sınırı',move:'internal'},
] as const;
export type CuffKey=typeof CUFF[number]['key'];
export function cuffParts(atlas:Atlas,side:ShoulderSide,key?:CuffKey){
 const entries=key?CUFF.filter(c=>c.key===key):CUFF;
 const tendonIds=new Set(entries.flatMap(c=>tendonParts(atlas,c.tendon,side).map(p=>p.id)));
 return atlas.parts.filter(p=>new RegExp(`\\b${side}\\b`,'i').test(p.name)&&(p.system==='muscular'?entries.some(c=>p.name.toLowerCase().includes(c.key)):tendonIds.has(p.id)));
}
