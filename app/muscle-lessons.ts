import {HAND_MOVES} from './hand-motion';
import {LOWER_MOVES} from './lower-motion';
import {SHOULDER_MOVES} from './shoulder';
import {ELBOW_MOVES} from './elbow-motion';
import {KNEE_MOVES} from './knee-motion';
import {muscleFor} from './education-data';
import type {RegionalCourseId} from './regional-course-content';
const studyLinks:Record<string,{lesson:'regional-course';id:RegionalCourseId;stop:number;label:string}[]>={
 trapezius:[{lesson:'regional-course',id:'shoulder-foundations',stop:3,label:'Omuz dersi · Skapula hareketi'}],
 'rhomboid major':[{lesson:'regional-course',id:'shoulder-foundations',stop:3,label:'Omuz dersi · Skapula hareketi'}],
 'serratus anterior':[{lesson:'regional-course',id:'shoulder-foundations',stop:3,label:'Omuz dersi · Skapula ve serratus anterior'}],
 'flexor carpi radialis':[{lesson:'regional-course',id:'hand-foundations',stop:3,label:'El bileği dersi · Fleksiyon ve radial deviasyon'}],
 'flexor carpi ulnaris':[{lesson:'regional-course',id:'hand-foundations',stop:4,label:'El bileği dersi · Fleksiyon ve ulnar deviasyon'}],
 'extensor carpi radialis longus':[{lesson:'regional-course',id:'hand-foundations',stop:5,label:'El bileği dersi · Ekstansiyon ve radial deviasyon (ECRL)'}],
 'extensor carpi radialis brevis':[{lesson:'regional-course',id:'hand-foundations',stop:6,label:'El bileği dersi · Ekstansiyon ve radial deviasyon (ECRB)'}],
};
const movementLinks:Record<string,{lesson:'hip'|'knee';id:string;label:string}[]>={
 'psoas major':[{lesson:'hip',id:'flexion',label:'Kalça · Fleksiyon bağlamı'}],
 piriformis:[{lesson:'hip',id:'external',label:'Kalça · Dış rotasyon bağlamı'}],
 'tensor fasciae latae':[{lesson:'hip',id:'abduction',label:'Kalça · Abdüksiyon bağlamı'}],
 popliteus:[{lesson:'knee',id:'flexion',label:'Diz · Fleksiyon bağlamı'}],
};
export function muscleLessons(name:string){const key=muscleFor(name)?.key;if(!key)return [];return [
 ...HAND_MOVES.filter(m=>(m.keys as readonly string[]).includes(key)).map(m=>({lesson:'hand' as const,id:m.id,label:'El/parmak · '+m.name})),
 ...LOWER_MOVES.filter(m=>(m.keys as readonly string[]).includes(key)).map(m=>({lesson:m.joint,id:m.id,label:(m.joint==='hip'?'Kalça':'Ayak bileği')+' · '+m.name})),
 ...SHOULDER_MOVES.filter(m=>m.muscles.some(x=>x[0]===key)).map(m=>({lesson:'shoulder' as const,id:m.id,label:'Omuz · '+m.name})),
 ...ELBOW_MOVES.filter(m=>(m.keys as readonly string[]).includes(key)).map(m=>({lesson:'elbow' as const,id:m.id,label:'Dirsek/önkol · '+m.name})),
 ...KNEE_MOVES.filter(m=>(m.keys as readonly string[]).includes(key)).map(m=>({lesson:'knee' as const,id:m.id,label:'Diz · '+m.name})),
 ...(movementLinks[key]??[]),
 ...(studyLinks[key]??[])
 ];}
export type MuscleLesson=ReturnType<typeof muscleLessons>[number];
