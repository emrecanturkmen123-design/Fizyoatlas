import {clinicalStructure} from './clinical-structures';
import {CONNECTIVE_STUDIES,selectedConnectiveSide} from './connective-study';
import type {Atlas} from './anatomy';
import {muscleFor} from './education-data';
import {muscleGroupFor} from './muscle-group-study';
import {muscleLessons} from './muscle-lessons';
import {nerveParts,type Nerve,type Side} from './innervation';
import {tendonParts} from './tendon-model';
export function nerveLessons(nerve:Nerve){return [...new Map(nerve.muscles.flatMap(muscleLessons).map(l=>[l.lesson+':'+l.id+('stop' in l?':'+l.stop:''),l])).values()];}
function structureLessons(name:string){const structure=clinicalStructure(name),motion=structure&&CONNECTIVE_STUDIES[structure.key]?.motion;if(!motion){const group=muscleGroupFor(name);return group?[...new Map(group.keys.flatMap(muscleLessons).map(l=>[l.lesson+':'+l.id+('stop' in l?':'+l.stop:''),l])).values()]:muscleLessons(name);}return motion==='knee'?[{lesson:'knee',id:'flexion',label:'Diz · Fleksiyon'}]:motion==='achilles'?[{lesson:'ankle',id:'plantarflexion',label:'Ayak bileği · Plantar fleksiyon'}]:motion==='elbow-flexion'?[{lesson:'elbow',id:'flexion',label:'İlgili kas · Dirsek fleksiyonu'}]:[{lesson:'shoulder',id:motion,label:'Omuz hareketi'}];}
export function structureCoverage(atlas:Atlas,name:string,ids:string[],nerve?:Nerve,side?:Side){const structure=clinicalStructure(name),resolvedSide=side??selectedConnectiveSide(atlas,ids);return {model:nerve?nerveParts(atlas,nerve,side).length:structure?tendonParts(atlas,structure.key,resolvedSide).length:ids.filter(id=>atlas.parts.some(p=>p.id===id)).length,card:!!nerve||!!muscleFor(name)||!!muscleGroupFor(name)||!!structure,lessons:nerve?nerveLessons(nerve):structureLessons(name)};}
export function CoverageBadges({coverage}:{coverage:ReturnType<typeof structureCoverage>}){return <dl className="coverage-badges" aria-label="İçerik kapsamı">{[['3D model',coverage.model?'Var':'Yok'],['Bilgi kartı',coverage.card?'Var':'Henüz yok'],['Hareket bağlantısı',coverage.lessons.length?`${coverage.lessons.length} ders`:'Henüz yok']].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;}
