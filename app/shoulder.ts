import type {Atlas} from './anatomy';
export type ShoulderSide='right'|'left';
export const SHOULDER_MOVES=[
 {id:'flexion',name:'Fleksiyon',plane:'Sagittal',axis:'Mediolateral (sağ–sol)',hint:'Kolu öne kaldırma.',muscles:[['deltoid','clavicular','Deltoid · ön lifler'],['coracobrachialis','','Coracobrachialis'],['pectoralis major','clavicular','Pectoralis major · klaviküler bölüm']]},
 {id:'extension',name:'Ekstansiyon',plane:'Sagittal',axis:'Mediolateral (sağ–sol)',hint:'Kolu geriye götürme.',muscles:[['deltoid','spinal','Deltoid · arka lifler'],['latissimus dorsi','','Latissimus dorsi'],['teres major','','Teres major']]},
 {id:'abduction',name:'Abdüksiyon',plane:'Frontal',axis:'Anteroposterior (ön–arka)',hint:'Kolu yandan gövdeden uzaklaştırma.',muscles:[['deltoid','acromial','Deltoid · orta lifler'],['supraspinatus','','Supraspinatus']]},
 {id:'adduction',name:'Addüksiyon',plane:'Frontal',axis:'Anteroposterior (ön–arka)',hint:'Yana açılmış kolu gövdeye yaklaştırma.',muscles:[['pectoralis major','','Pectoralis major'],['latissimus dorsi','','Latissimus dorsi'],['teres major','','Teres major']]},
 {id:'internal',name:'İç rotasyon',plane:'Transversal',axis:'Humerusun uzun ekseni',hint:'Kol gövde yanındayken humerusu içe çevirme. Ok, dirsek bükülü varsayılarak önkol yönünü temsil eder.',muscles:[['subscapularis','','Subscapularis'],['pectoralis major','','Pectoralis major'],['latissimus dorsi','','Latissimus dorsi'],['teres major','','Teres major'],['deltoid','clavicular','Deltoid · ön lifler']]},
 {id:'external',name:'Dış rotasyon',plane:'Transversal',axis:'Humerusun uzun ekseni',hint:'Kol gövde yanındayken humerusu dışa çevirme. Ok, dirsek bükülü varsayılarak önkol yönünü temsil eder.',muscles:[['infraspinatus','','Infraspinatus'],['teres minor','','Teres minor'],['deltoid','spinal','Deltoid · arka lifler']]},
] as const;
export type ShoulderMove=typeof SHOULDER_MOVES[number];
export interface ShoulderState {id:ShoulderMove['id'];side:ShoulderSide;plane:boolean;motion?:boolean;progress?:number;playing?:boolean;antagonists?:boolean;scapula?:boolean;anatomicalMuscles?:boolean;cuff?:boolean;tendons?:boolean}
export function shoulderParts(atlas:Atlas,m:ShoulderMove,side:ShoulderSide,index?:number){return atlas.parts.filter(p=>p.system==='muscular'&&new RegExp(`\\b${side}\\b`,'i').test(p.name)&&(index===undefined?m.muscles:[m.muscles[index]]).some(([key,portion])=>p.name.toLowerCase().includes(key)&&(!portion||p.name.toLowerCase().includes(portion))));}
export const OPPOSITE:Record<ShoulderMove['id'],ShoulderMove['id']>={flexion:'extension',extension:'flexion',abduction:'adduction',adduction:'abduction',internal:'external',external:'internal'};
export function oppositeMove(m:ShoulderMove){return SHOULDER_MOVES.find(x=>x.id===OPPOSITE[m.id])!;}
export function shoulderRoles(atlas:Atlas,m:ShoulderMove,side:ShoulderSide){const agonists=shoulderParts(atlas,m,side).map(p=>p.id);const antagonists=shoulderParts(atlas,oppositeMove(m),side).map(p=>p.id).filter(id=>!agonists.includes(id));return {agonists,antagonists};}
