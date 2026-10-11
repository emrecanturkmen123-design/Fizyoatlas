import type {Atlas} from './anatomy';
export const STAGES=['Hasta hikâyesi','Semptom','Muayene','Klinik test','Klinik değerlendirme','Anatomik yapı','Tedavi','Egzersiz','Kontrol ziyareti','Aktiviteye dönüş'] as const;
export type Region='shoulder'|'elbow'|'hip'|'knee'|'ankle'|'spine'|'neuro';
export const REGIONS:Record<Region,string>={shoulder:'Omuz',elbow:'Dirsek, önkol ve el',hip:'Kalça',knee:'Diz',ankle:'Ayak bileği',spine:'Omurga',neuro:'Nöroloji'};
export interface CaseStep {finding:string;question:string;choices:string[];correct:number;why:string;hint:string;rationales?:string[]}
export interface CaseJourney {id:string;title:string;diagnosis:string;region:Region;patient:string;goal:string;sources:{label:string;url:string}[];steps:CaseStep[];model:{keys:string[];system?:string;side?:'right'|'left';task:string;note:string};quizKey:string}
// All patient details, measurements and follow-up visits are fictional teaching scenarios.
export function step(finding:string,question:string,answer:string,wrong:string[],why:string,hint:string):CaseStep{return {finding,question,choices:[answer,...wrong],correct:0,why,hint};}
